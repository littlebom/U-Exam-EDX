import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { Prisma } from "@/generated/prisma";
import type {
  LogEventInput,
  LogEventsInput,
} from "@/lib/validations/exam-session";

// ─── Log Single Event ───────────────────────────────────────────────

export async function logEvent(
  sessionId: string,
  candidateId: string,
  data: LogEventInput
) {
  // Verify session belongs to candidate and is active
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: { id: true, candidateId: true, status: true },
  });

  if (!session || session.candidateId !== candidateId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  if (session.status !== "IN_PROGRESS") {
    return null; // silently ignore events for non-active sessions
  }

  const event = await prisma.examEvent.create({
    data: {
      sessionId,
      type: data.type,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });

  return event;
}

// ─── Log Multiple Events (batch) ────────────────────────────────────

export async function logEvents(
  sessionId: string,
  candidateId: string,
  data: LogEventsInput
) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: { id: true, candidateId: true, status: true },
  });

  if (!session || session.candidateId !== candidateId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  if (session.status !== "IN_PROGRESS") {
    return [];
  }

  const created = await prisma.examEvent.createMany({
    data: data.events.map((ev) => ({
      sessionId,
      type: ev.type,
      metadata: (ev.metadata as Prisma.InputJsonValue) ?? undefined,
      timestamp: ev.timestamp ? new Date(ev.timestamp) : new Date(),
    })),
  });

  return { count: created.count };
}

// ─── Get Event Summary ──────────────────────────────────────────────

export async function getEventSummary(tenantId: string, sessionId: string) {
  // Verify tenant access
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: {
      examSchedule: { select: { tenantId: true } },
    },
  });

  if (!session || session.examSchedule.tenantId !== tenantId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  const events = await prisma.examEvent.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" },
  });

  // Group by type
  const summary: Record<string, number> = {};
  for (const ev of events) {
    summary[ev.type] = (summary[ev.type] || 0) + 1;
  }

  const suspiciousCount =
    (summary["TAB_SWITCH"] || 0) +
    (summary["BLUR"] || 0) +
    (summary["COPY"] || 0) +
    (summary["PASTE"] || 0) +
    (summary["SCREENSHOT"] || 0) +
    (summary["FULLSCREEN_EXIT"] || 0);

  return {
    sessionId,
    totalEvents: events.length,
    summary,
    suspiciousCount,
    isSuspicious: suspiciousCount >= 5,
    events,
  };
}

// ─── Get Events for Session ─────────────────────────────────────────

export async function getEvents(tenantId: string, sessionId: string) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: {
      examSchedule: { select: { tenantId: true } },
    },
  });

  if (!session || session.examSchedule.tenantId !== tenantId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  const events = await prisma.examEvent.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" },
  });

  return events;
}
