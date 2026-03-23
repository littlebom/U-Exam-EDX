import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import type { PaginationParams, PaginationMeta } from "@/types";

interface UserListResult {
  data: Array<Record<string, unknown>>;
  meta: PaginationMeta;
}

export async function listUsers(
  tenantId: string,
  params: PaginationParams = {}
): Promise<UserListResult> {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where = {
    userTenants: {
      some: { tenantId, isActive: true },
    },
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" as const } },
            { email: { contains: params.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        userTenants: {
          where: { tenantId },
          include: { role: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    phone: user.phone,
    provider: user.provider,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    role: user.userTenants[0]?.role
      ? { id: user.userTenants[0].role.id, name: user.userTenants[0].role.name }
      : null,
  }));

  return {
    data: data as unknown as Array<Record<string, unknown>>,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

interface CreateUserParams {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
  phone?: string;
}

export async function createUser(params: CreateUserParams) {
  const { tenantId, name, email, password, roleId, phone } = params;
  const emailLower = email.toLowerCase();

  // Check uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: emailLower },
  });

  if (existing) {
    // Check if already in this tenant
    const existingLink = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: existing.id, tenantId } },
    });
    if (existingLink) {
      throw errors.conflict("ผู้ใช้นี้อยู่ในองค์กรแล้ว");
    }

    // Add existing user to this tenant
    await prisma.userTenant.create({
      data: {
        userId: existing.id,
        tenantId,
        roleId,
      },
    });
    return existing;
  }

  // Create new user + link
  const passwordHash = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: emailLower,
        passwordHash,
        name,
        phone,
        provider: "credentials",
      },
    });

    await tx.userTenant.create({
      data: {
        userId: newUser.id,
        tenantId,
        roleId,
        isDefault: true,
      },
    });

    return newUser;
  });

  return user;
}

export async function updateUser(
  userId: string,
  tenantId: string,
  data: { name?: string; phone?: string; roleId?: string; isActive?: boolean }
) {
  const { roleId, isActive, ...userData } = data;

  // Update user fields
  if (Object.keys(userData).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: userData,
    });
  }

  // Update role or active status if provided
  if (roleId !== undefined || isActive !== undefined) {
    await prisma.userTenant.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: {
        ...(roleId !== undefined ? { roleId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      userTenants: {
        where: { tenantId },
        include: { role: true },
      },
    },
  });
}

export async function deleteUser(userId: string, tenantId: string) {
  // Soft delete: deactivate the tenant membership
  await prisma.userTenant.update({
    where: { userId_tenantId: { userId, tenantId } },
    data: { isActive: false },
  });
}
