import { prisma } from "@/lib/prisma";
import { buildPaginationMeta } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────

export type AuditCategory = "AUTH" | "EXAM" | "ADMIN" | "USER" | "SYSTEM";

export type AuditAction =
  // Auth
  | "AUTH_LOGIN"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_LOGOUT"
  | "AUTH_PASSWORD_CHANGE"
  // Exam
  | "EXAM_START"
  | "EXAM_SUBMIT"
  | "EXAM_TIMEOUT"
  | "EXAM_FORCE_SUBMIT"
  // Admin
  | "EXAM_CREATE"
  | "EXAM_UPDATE"
  | "EXAM_DELETE"
  | "SCHEDULE_CREATE"
  | "SCHEDULE_UPDATE"
  | "REGISTRATION_APPROVE"
  | "REGISTRATION_CANCEL"
  | "CERTIFICATE_ISSUE"
  | "CERTIFICATE_REVOKE"
  | "GRADE_CONFIRM"
  | "QUESTION_CREATE"
  | "QUESTION_IMPORT"
  // User
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "ROLE_CHANGE"
  | "PROFILE_UPDATE"
  | "FACE_IMAGE_UPLOAD"
  // System
  | "SETTINGS_UPDATE"
  | "EMAIL_SENT"
  | "NOTIFICATION_SENT"
  | "BADGE_AWARDED";

interface LogAuditParams {
  tenantId?: string | null;
  userId?: string | null;
  action: AuditAction;
  category: AuditCategory;
  target?: string | null;
  detail?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

// ─── Action → Category Mapping ──────────────────────────────────────

const ACTION_CATEGORY: Record<string, AuditCategory> = {
  AUTH_LOGIN: "AUTH",
  AUTH_LOGIN_FAILED: "AUTH",
  AUTH_LOGOUT: "AUTH",
  AUTH_PASSWORD_CHANGE: "AUTH",
  EXAM_START: "EXAM",
  EXAM_SUBMIT: "EXAM",
  EXAM_TIMEOUT: "EXAM",
  EXAM_FORCE_SUBMIT: "EXAM",
  EXAM_CREATE: "ADMIN",
  EXAM_UPDATE: "ADMIN",
  EXAM_DELETE: "ADMIN",
  SCHEDULE_CREATE: "ADMIN",
  SCHEDULE_UPDATE: "ADMIN",
  REGISTRATION_APPROVE: "ADMIN",
  REGISTRATION_CANCEL: "ADMIN",
  CERTIFICATE_ISSUE: "ADMIN",
  CERTIFICATE_REVOKE: "ADMIN",
  GRADE_CONFIRM: "ADMIN",
  QUESTION_CREATE: "ADMIN",
  QUESTION_IMPORT: "ADMIN",
  USER_CREATE: "USER",
  USER_UPDATE: "USER",
  USER_DELETE: "USER",
  ROLE_CHANGE: "USER",
  PROFILE_UPDATE: "USER",
  FACE_IMAGE_UPLOAD: "USER",
  SETTINGS_UPDATE: "SYSTEM",
  EMAIL_SENT: "SYSTEM",
  NOTIFICATION_SENT: "SYSTEM",
  BADGE_AWARDED: "SYSTEM",
};

// ─── JSONL File Writer ───────────────────────────────────────────────

async function writeAuditLogFile(params: LogAuditParams) {
  try {
    // Dynamic import to avoid bundling fs in client
    const fs = await import("fs");
    const path = await import("path");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // 2026-03-25
    const logDir = path.join(process.cwd(), "logs", "audit");

    // Ensure directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = JSON.stringify({
      timestamp: now.toISOString(),
      action: params.action,
      category: params.category ?? ACTION_CATEGORY[params.action] ?? "SYSTEM",
      userId: params.userId ?? null,
      tenantId: params.tenantId ?? null,
      target: params.target ?? null,
      detail: params.detail ?? null,
      ipAddress: params.ipAddress ?? null,
    });

    fs.appendFileSync(
      path.join(logDir, `${dateStr}.jsonl`),
      logEntry + "\n",
      "utf-8"
    );
  } catch (err) {
    console.error("[audit-log] Failed to write file:", err);
  }
}

// ─── Log Audit (non-blocking) — writes to DB + JSONL file ───────────

export function logAudit(params: LogAuditParams) {
  // 1. Write to JSONL file (async, non-blocking)
  writeAuditLogFile(params).catch((err) =>
    console.error("[audit-log] JSONL write error:", err)
  );

  // 2. Write to DB (async, fire and forget)
  prisma.auditLog
    .create({
      data: {
        tenantId: params.tenantId ?? null,
        userId: params.userId ?? null,
        action: params.action,
        category: params.category ?? ACTION_CATEGORY[params.action] ?? "SYSTEM",
        target: params.target ?? null,
        detail: params.detail ?? undefined,
        ipAddress: params.ipAddress ?? null,
      },
    })
    .catch((err) => {
      console.error("[audit-log] Failed to write DB:", err);
    });
}

// ─── Shorthand helpers ──────────────────────────────────────────────

export function logAuthEvent(
  action: "AUTH_LOGIN" | "AUTH_LOGIN_FAILED" | "AUTH_LOGOUT" | "AUTH_PASSWORD_CHANGE",
  opts: { userId?: string | null; tenantId?: string | null; ipAddress?: string | null; detail?: Record<string, unknown> }
) {
  logAudit({ ...opts, action, category: "AUTH" });
}

export function logExamEvent(
  action: "EXAM_START" | "EXAM_SUBMIT" | "EXAM_TIMEOUT" | "EXAM_FORCE_SUBMIT",
  opts: { userId: string; tenantId?: string | null; target: string; ipAddress?: string | null; detail?: Record<string, unknown> }
) {
  logAudit({ ...opts, action, category: "EXAM" });
}

export function logAdminAction(
  action: AuditAction,
  opts: { userId: string; tenantId: string; target?: string; detail?: Record<string, unknown> }
) {
  logAudit({ ...opts, action, category: ACTION_CATEGORY[action] ?? "ADMIN" });
}

// ─── Cleanup old DB logs ─────────────────────────────────────────────

export async function cleanupOldAuditLogs(tenantId?: string) {
  // Get retention days from tenant settings (default 7)
  let retentionDays = 7;

  if (tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      });
      const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
      const configured = settings.auditLogRetentionDays;
      if (typeof configured === "number" && configured > 0) {
        retentionDays = configured;
      }
    } catch {
      // Use default
    }
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const where: Record<string, unknown> = {
    createdAt: { lt: cutoffDate },
  };
  if (tenantId) {
    where.OR = [{ tenantId }, { tenantId: null }];
  }

  const result = await prisma.auditLog.deleteMany({ where });
  return { deleted: result.count, retentionDays, cutoffDate };
}

// ─── Query Audit Logs ───────────────────────────────────────────────

export async function listAuditLogs(
  filters: {
    tenantId?: string;
    userId?: string;
    category?: string;
    action?: string;
    search?: string;
    page?: number;
    perPage?: number;
  } = {}
) {
  const { tenantId, userId, category, action, search, page = 1, perPage = 50 } = filters;

  const conditions: Record<string, unknown>[] = [];

  // Show logs for this tenant OR logs without tenant (auth events)
  if (tenantId) conditions.push({ OR: [{ tenantId }, { tenantId: null }] });
  if (userId) conditions.push({ userId });
  if (category) conditions.push({ category });
  if (action) conditions.push({ action });
  if (search) {
    conditions.push({
      OR: [
        { action: { contains: search, mode: "insensitive" } },
        { target: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: logs.map((log) => ({
      id: log.id,
      action: log.action,
      category: log.category,
      target: log.target,
      detail: log.detail,
      ipAddress: log.ipAddress,
      userName: log.user?.name ?? null,
      userEmail: log.user?.email ?? null,
      createdAt: log.createdAt,
    })),
    meta: buildPaginationMeta(page, perPage, total),
  };
}
