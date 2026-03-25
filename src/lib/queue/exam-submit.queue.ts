import { Queue, Worker, QueueEvents } from "bullmq";
import { prisma } from "@/lib/prisma";
import { autoGradeSession } from "@/services/auto-grading.service";

// ─── Redis Connection ────────────────────────────────────────────

function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || "6379"),
      password: parsed.password || undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
    };
  } catch {
    return null;
  }
}

const connection = getRedisConnection();

// ─── Queue ───────────────────────────────────────────────────────

const QUEUE_NAME = "exam-auto-submit";

export const examSubmitQueue = connection
  ? new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: { count: 1000 }, // keep last 1000 completed
        removeOnFail: { count: 500 },
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    })
  : null;

// ─── Schedule Auto-Submit Job ────────────────────────────────────

export async function scheduleAutoSubmit(
  sessionId: string,
  delayMs: number
) {
  if (!examSubmitQueue) {
    console.warn("[auto-submit] Redis not configured — skipping job schedule");
    return null;
  }

  const jobId = `auto-submit-${sessionId}`;

  // Remove existing job if re-scheduling (e.g., time extension)
  const existing = await examSubmitQueue.getJob(jobId);
  if (existing) {
    await existing.remove();
  }

  const job = await examSubmitQueue.add(
    "auto-submit",
    { sessionId },
    {
      jobId,
      delay: Math.max(0, delayMs),
    }
  );

  return job;
}

// ─── Cancel Auto-Submit Job ──────────────────────────────────────

export async function cancelAutoSubmit(sessionId: string) {
  if (!examSubmitQueue) return;

  const jobId = `auto-submit-${sessionId}`;
  const job = await examSubmitQueue.getJob(jobId);
  if (job) {
    const state = await job.getState();
    if (state === "delayed" || state === "waiting") {
      await job.remove();
    }
  }
}

// ─── Worker (processes auto-submit jobs) ─────────────────────────

let workerInstance: Worker | null = null;

export function startAutoSubmitWorker() {
  if (!connection || workerInstance) return;

  workerInstance = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { sessionId } = job.data as { sessionId: string };

      // Check if session still needs auto-submit
      const session = await prisma.examSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          status: true,
          candidateId: true,
          examSchedule: {
            select: { exam: { select: { title: true } } },
          },
        },
      });

      if (!session) {
        return { skipped: true, reason: "Session not found" };
      }

      // Only submit if still IN_PROGRESS
      if (session.status !== "IN_PROGRESS") {
        return {
          skipped: true,
          reason: `Session already ${session.status}`,
        };
      }

      // Auto-submit: change status to TIMED_OUT
      await prisma.examSession.update({
        where: { id: sessionId },
        data: {
          status: "TIMED_OUT",
          submittedAt: new Date(),
        },
      });

      // Log timeout event
      const { logExamEvent } = await import("@/services/audit-log.service");
      logExamEvent("EXAM_TIMEOUT", {
        userId: session.candidateId,
        target: sessionId,
        detail: { exam: session.examSchedule.exam.title, scheduleId: session.examScheduleId },
      });

      // Trigger auto-grading
      try {
        await autoGradeSession(sessionId);
      } catch {
        // Grading can be retried later — don't fail the job
      }

      return {
        submitted: true,
        sessionId,
        exam: session.examSchedule.exam.title,
      };
    },
    {
      connection,
      concurrency: 10, // Process up to 10 submissions simultaneously
    }
  );

  workerInstance.on("completed", (job, result) => {
    if (result?.submitted) {
      // Log only actual submissions, not skips
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[auto-submit] Session ${result.sessionId} → TIMED_OUT (${result.exam})`
        );
      }
    }
  });

  workerInstance.on("failed", (job, err) => {
    console.error(
      `[auto-submit] Job ${job?.id} failed:`,
      err.message
    );
  });

  return workerInstance;
}
