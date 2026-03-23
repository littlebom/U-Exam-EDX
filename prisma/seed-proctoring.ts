/**
 * Seed proctoring mock data for dashboard demonstration
 * Run: npx tsx prisma/seed-proctoring.ts
 */
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Seeding proctoring mock data...\n");

  // ── Find existing data ──
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found. Run main seed first.");

  const schedules = await prisma.examSchedule.findMany({
    where: { tenantId: tenant.id },
    include: { exam: { select: { title: true, duration: true } } },
    take: 2,
  });
  if (schedules.length === 0) throw new Error("No exam schedules found.");

  // Find candidate user
  const candidateRole = await prisma.role.findFirst({ where: { name: "CANDIDATE" } });
  const candidates = await prisma.userTenant.findMany({
    where: { tenantId: tenant.id, roleId: candidateRole?.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 3,
  });

  // Find admin/proctor for incident creator
  const adminTenant = await prisma.userTenant.findFirst({
    where: { tenantId: tenant.id, role: { name: { in: ["TENANT_OWNER", "ADMIN", "PROCTOR"] } } },
    select: { userId: true },
  });
  const proctorId = adminTenant?.userId ?? candidates[0]?.userId;

  if (candidates.length === 0) throw new Error("No candidate users found.");

  const schedule = schedules[0];
  const now = new Date();

  console.log(`📋 Schedule: ${schedule.exam.title}`);
  console.log(`👥 Candidates: ${candidates.map((c) => c.user.name).join(", ")}\n`);

  // ── Create Exam Sessions (IN_PROGRESS) ──
  const sessions = [];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    // Check if session already exists
    const existing = await prisma.examSession.findFirst({
      where: {
        examScheduleId: schedule.id,
        candidateId: candidate.userId,
      },
    });

    if (existing) {
      // Update to IN_PROGRESS if not already
      const updated = await prisma.examSession.update({
        where: { id: existing.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(now.getTime() - (30 + i * 10) * 60000), // started 30-50 min ago
          timeRemaining: (schedule.exam.duration ?? 60) * 60 - (30 + i * 10) * 60,
        },
      });
      sessions.push(updated);
      console.log(`  ♻️  Reused ExamSession for ${candidate.user.name}`);
    } else {
      const session = await prisma.examSession.create({
        data: {
          examScheduleId: schedule.id,
          candidateId: candidate.userId,
          status: "IN_PROGRESS",
          startedAt: new Date(now.getTime() - (30 + i * 10) * 60000),
          timeRemaining: (schedule.exam.duration ?? 60) * 60 - (30 + i * 10) * 60,
          ipAddress: `192.168.1.${100 + i}`,
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
        },
      });
      sessions.push(session);
      console.log(`  ✅ Created ExamSession for ${candidate.user.name}`);
    }
  }

  // ── Create Proctoring Sessions ──
  const procSessions = [];
  const statuses = ["MONITORING", "FLAGGED", "MONITORING"];

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];

    // Check if proctoring session exists
    const existing = await prisma.proctoringSession.findFirst({
      where: { examSessionId: session.id },
    });

    if (existing) {
      const updated = await prisma.proctoringSession.update({
        where: { id: existing.id },
        data: { status: statuses[i] ?? "MONITORING" },
      });
      procSessions.push(updated);
      console.log(`  ♻️  Reused ProctoringSession (${statuses[i]})`);
    } else {
      const procSession = await prisma.proctoringSession.create({
        data: {
          examSessionId: session.id,
          status: statuses[i] ?? "MONITORING",
          webcamEnabled: true,
          screenShareEnabled: false,
        },
      });
      procSessions.push(procSession);
      console.log(`  ✅ Created ProctoringSession (${statuses[i]})`);
    }
  }

  // ── Create Proctoring Events ──
  console.log("\n📝 Creating proctoring events...");

  const eventTemplates = [
    // Session 0 — normal, a few events
    [
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 25 },
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 20 },
      { type: "TAB_SWITCH", severity: "MEDIUM", minsAgo: 15 },
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 10 },
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 5 },
    ],
    // Session 1 — flagged, multiple violations
    [
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 40 },
      { type: "FACE_NOT_DETECTED", severity: "HIGH", minsAgo: 35 },
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 30 },
      { type: "TAB_SWITCH", severity: "MEDIUM", minsAgo: 28 },
      { type: "MULTIPLE_FACES", severity: "HIGH", minsAgo: 22 },
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 20 },
      { type: "FULLSCREEN_EXIT", severity: "MEDIUM", minsAgo: 18 },
      { type: "FACE_NOT_DETECTED", severity: "HIGH", minsAgo: 15 },
      { type: "COPY_PASTE", severity: "HIGH", minsAgo: 10 },
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 5 },
      { type: "PROCTOR_MESSAGE", severity: "MEDIUM", minsAgo: 4 },
    ],
    // Session 2 — clean
    [
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 28 },
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 18 },
      { type: "SCREENSHOT_WEBCAM", severity: "LOW", minsAgo: 8 },
    ],
  ];

  for (let i = 0; i < procSessions.length; i++) {
    const procSession = procSessions[i];
    const events = eventTemplates[i] ?? [];

    // Delete old events first
    await prisma.proctoringEvent.deleteMany({
      where: { proctoringSessionId: procSession.id },
    });

    for (const evt of events) {
      await prisma.proctoringEvent.create({
        data: {
          proctoringSessionId: procSession.id,
          type: evt.type,
          severity: evt.severity,
          metadata: evt.type === "PROCTOR_MESSAGE"
            ? { message: "กรุณาอยู่หน้าจอและไม่สลับแท็บ" }
            : evt.type === "MULTIPLE_FACES"
            ? { faceCount: 2 }
            : evt.type === "FACE_NOT_DETECTED"
            ? { consecutiveMisses: 2 }
            : {},
          timestamp: new Date(now.getTime() - evt.minsAgo * 60000),
        },
      });
    }
    console.log(`  ✅ Created ${events.length} events for session ${i + 1}`);
  }

  // ── Create Incidents (for flagged session) ──
  console.log("\n🚨 Creating incidents...");

  if (procSessions[1] && proctorId) {
    // Delete old incidents first
    await prisma.incident.deleteMany({
      where: { proctoringSessionId: procSessions[1].id },
    });

    await prisma.incident.create({
      data: {
        proctoringSessionId: procSessions[1].id,
        type: "SUSPICIOUS_BEHAVIOR",
        description: "ตรวจพบหลายใบหน้าและสลับแท็บหลายครั้ง อาจมีบุคคลอื่นช่วยเหลือ",
        action: "WARNING",
        createdById: proctorId,
        createdAt: new Date(now.getTime() - 12 * 60000),
      },
    });

    await prisma.incident.create({
      data: {
        proctoringSessionId: procSessions[1].id,
        type: "POLICY_VIOLATION",
        description: "พยายามคัดลอกข้อความจากเว็บไซต์ภายนอก",
        action: "WARNING",
        createdById: proctorId,
        resolvedAt: new Date(now.getTime() - 8 * 60000),
        resolution: "ผู้สอบรับทราบคำเตือนและหยุดพฤติกรรม",
        createdAt: new Date(now.getTime() - 10 * 60000),
      },
    });

    console.log("  ✅ Created 2 incidents for flagged session");
  }

  console.log("\n✨ Proctoring mock data seeded successfully!");
  console.log("   Open http://localhost:3000/admin/proctoring to see the dashboard");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
