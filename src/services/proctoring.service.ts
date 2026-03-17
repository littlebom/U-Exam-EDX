import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { Prisma } from "@/generated/prisma";

// ─── Start Proctoring Session ────────────────────────────────────────

export async function startProctoringSession(
  examSessionId: string,
  options: { webcamEnabled?: boolean; screenShareEnabled?: boolean } = {}
) {
  // Check if session already exists
  const existing = await prisma.proctoringSession.findUnique({
    where: { examSessionId },
  });
  if (existing) return existing;

  return prisma.proctoringSession.create({
    data: {
      examSessionId,
      webcamEnabled: options.webcamEnabled ?? false,
      screenShareEnabled: options.screenShareEnabled ?? false,
      status: "MONITORING",
    },
  });
}

// ─── Get Active Proctoring Sessions ──────────────────────────────────

export async function getActiveProctoringeSessions(
  filters: {
    status?: string;
    page?: number;
    perPage?: number;
  } = {}
) {
  const { status, page = 1, perPage = 20 } = filters;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  // Only show sessions that are active (exam in progress)
  where.examSession = { status: "IN_PROGRESS" };

  const [total, sessions] = await Promise.all([
    prisma.proctoringSession.count({ where }),
    prisma.proctoringSession.findMany({
      where,
      include: {
        examSession: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            candidate: { select: { id: true, name: true, email: true } },
            examSchedule: {
              select: {
                exam: { select: { id: true, title: true } },
                startDate: true,
              },
            },
          },
        },
        _count: {
          select: { proctoringEvents: true, incidents: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: sessions.map((s) => ({
      id: s.id,
      examSessionId: s.examSessionId,
      status: s.status,
      webcamEnabled: s.webcamEnabled,
      screenShareEnabled: s.screenShareEnabled,
      candidateName: s.examSession.candidate.name,
      candidateEmail: s.examSession.candidate.email,
      examTitle: s.examSession.examSchedule.exam.title,
      startedAt: s.examSession.startedAt,
      eventCount: s._count.proctoringEvents,
      incidentCount: s._count.incidents,
    })),
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}

// ─── Log Proctoring Event ────────────────────────────────────────────

export async function logProctoringEvent(
  proctoringSessionId: string,
  data: {
    type: string;
    severity?: string;
    screenshot?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const session = await prisma.proctoringSession.findUnique({
    where: { id: proctoringSessionId },
  });
  if (!session) throw errors.notFound("ไม่พบ Proctoring Session");

  const event = await prisma.proctoringEvent.create({
    data: {
      proctoringSessionId,
      type: data.type,
      severity: data.severity ?? "LOW",
      screenshot: data.screenshot,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });

  // Auto-flag session if high severity events accumulate
  const highEvents = await prisma.proctoringEvent.count({
    where: { proctoringSessionId, severity: "HIGH" },
  });

  if (highEvents >= 3 && session.status === "MONITORING") {
    await prisma.proctoringSession.update({
      where: { id: proctoringSessionId },
      data: { status: "FLAGGED" },
    });
  }

  return event;
}

// ─── Get Proctoring Events ───────────────────────────────────────────

export async function getProctoringEvents(
  proctoringSessionId: string,
  filters: { type?: string; severity?: string; page?: number; perPage?: number } = {}
) {
  const { type, severity, page = 1, perPage = 50 } = filters;

  const where: Record<string, unknown> = { proctoringSessionId };
  if (type) where.type = type;
  if (severity) where.severity = severity;

  const [total, events] = await Promise.all([
    prisma.proctoringEvent.count({ where }),
    prisma.proctoringEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: events,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}

// ─── Create Incident ─────────────────────────────────────────────────

export async function createIncident(
  proctoringSessionId: string,
  data: {
    type: string;
    description: string;
    action: string;
  },
  createdById: string
) {
  const session = await prisma.proctoringSession.findUnique({
    where: { id: proctoringSessionId },
  });
  if (!session) throw errors.notFound("ไม่พบ Proctoring Session");

  return prisma.$transaction(async (tx) => {
    const incident = await tx.incident.create({
      data: {
        proctoringSessionId,
        type: data.type,
        description: data.description,
        action: data.action,
        createdById,
      },
    });

    // Flag the proctoring session
    if (session.status === "MONITORING") {
      await tx.proctoringSession.update({
        where: { id: proctoringSessionId },
        data: { status: "FLAGGED" },
      });
    }

    // If action is TERMINATE, also end the exam session
    if (data.action === "TERMINATE") {
      await tx.examSession.update({
        where: { id: session.examSessionId },
        data: { status: "TIMED_OUT", submittedAt: new Date() },
      });
    }

    return incident;
  });
}

// ─── List Incidents ──────────────────────────────────────────────────

export async function listIncidents(
  filters: {
    type?: string;
    page?: number;
    perPage?: number;
  } = {}
) {
  const { type, page = 1, perPage = 20 } = filters;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;

  const [total, incidents] = await Promise.all([
    prisma.incident.count({ where }),
    prisma.incident.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        proctoringSession: {
          select: {
            examSession: {
              select: {
                candidate: { select: { id: true, name: true } },
                examSchedule: {
                  select: {
                    exam: { select: { title: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: incidents.map((i) => ({
      id: i.id,
      type: i.type,
      description: i.description,
      action: i.action,
      candidateName: i.proctoringSession.examSession.candidate.name,
      examTitle: i.proctoringSession.examSession.examSchedule.exam.title,
      createdBy: i.createdBy.name,
      resolvedAt: i.resolvedAt,
      resolution: i.resolution,
      createdAt: i.createdAt,
    })),
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}

// ─── Resolve Incident ────────────────────────────────────────────────

export async function resolveIncident(id: string, resolution: string) {
  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) throw errors.notFound("ไม่พบ Incident");
  if (incident.resolvedAt) throw errors.validation("Incident นี้ถูกแก้ไขแล้ว");

  return prisma.incident.update({
    where: { id },
    data: {
      resolvedAt: new Date(),
      resolution,
    },
  });
}

// ─── Update Session Status ───────────────────────────────────────────

export async function updateProctoringStatus(
  id: string,
  status: "MONITORING" | "FLAGGED" | "REVIEWED"
) {
  return prisma.proctoringSession.update({
    where: { id },
    data: { status },
  });
}
