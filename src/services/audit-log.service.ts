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
  // User
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "ROLE_CHANGE"
  // System
  | "SETTINGS_UPDATE"
  | "EMAIL_SENT"
  | "NOTIFICATION_SENT";

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
  USER_CREATE: "USER",
  USER_UPDATE: "USER",
  USER_DELETE: "USER",
  ROLE_CHANGE: "USER",
  SETTINGS_UPDATE: "SYSTEM",
  EMAIL_SENT: "SYSTEM",
  NOTIFICATION_SENT: "SYSTEM",
};

// ─── Log Audit (non-blocking) ───────────────────────────────────────

export function logAudit(params: LogAuditParams) {
  // Fire and forget — never block the caller
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
      console.error("[audit-log] Failed to write:", err);
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
