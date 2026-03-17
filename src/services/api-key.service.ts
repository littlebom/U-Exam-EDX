import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import crypto from "crypto";
import type { Prisma } from "@/generated/prisma";

// ─── Generate API Key ───────────────────────────────────────────────

export async function generateApiKey(
  tenantId: string,
  data: {
    name: string;
    expiresAt?: Date;
    scopes?: string[];
  }
) {
  // Generate a random key
  const rawKey = `uex_${crypto.randomBytes(32).toString("hex")}`;
  const prefix = rawKey.slice(0, 8);
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      name: data.name,
      prefix,
      keyHash,
      expiresAt: data.expiresAt,
      scopes: data.scopes
        ? (data.scopes as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });

  // Return the raw key only once — it cannot be retrieved later
  return {
    id: apiKey.id,
    name: apiKey.name,
    key: rawKey, // Only shown once!
    prefix: apiKey.prefix,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  };
}

// ─── List API Keys ──────────────────────────────────────────────────

export async function listApiKeys(tenantId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      scopes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k) => ({
    ...k,
    maskedKey: `${k.prefix}...`,
    isExpired: k.expiresAt ? new Date() > k.expiresAt : false,
  }));
}

// ─── Validate API Key ───────────────────────────────────────────────

export async function validateApiKey(rawKey: string) {
  const prefix = rawKey.slice(0, 8);
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.findFirst({
    where: { prefix, keyHash, isActive: true },
    include: { tenant: { select: { id: true, name: true, isActive: true } } },
  });

  if (!apiKey) return null;
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return null;
  if (!apiKey.tenant.isActive) return null;

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    tenantId: apiKey.tenantId,
    keyId: apiKey.id,
    scopes: apiKey.scopes as string[] | null,
  };
}

// ─── Revoke API Key ─────────────────────────────────────────────────

export async function revokeApiKey(tenantId: string, id: string) {
  const key = await prisma.apiKey.findFirst({
    where: { id, tenantId },
  });
  if (!key) throw errors.notFound("ไม่พบ API Key");

  return prisma.apiKey.update({
    where: { id },
    data: { isActive: false },
  });
}

// ─── Delete API Key ─────────────────────────────────────────────────

export async function deleteApiKey(tenantId: string, id: string) {
  const key = await prisma.apiKey.findFirst({
    where: { id, tenantId },
  });
  if (!key) throw errors.notFound("ไม่พบ API Key");

  return prisma.apiKey.delete({ where: { id } });
}
