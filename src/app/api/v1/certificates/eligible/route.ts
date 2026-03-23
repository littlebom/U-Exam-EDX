import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

// GET /api/v1/certificates/eligible?candidateQuery=...&examQuery=...&candidateId=...&examId=...
// Step 1: ค้นหาผู้สอบ (candidateQuery)
// Step 2: ค้นหาวิชา (examQuery)
// Step 3: ดึง sessions ที่สอบผ่าน (candidateId + examId)

export async function GET(req: NextRequest) {
  try {
    const ctx = await requirePermission("certificate:create");
    const url = new URL(req.url);

    const candidateQuery = url.searchParams.get("candidateQuery") ?? "";
    const examQuery = url.searchParams.get("examQuery") ?? "";
    const candidateId = url.searchParams.get("candidateId") ?? "";
    const examId = url.searchParams.get("examId") ?? "";

    // ─── Step 1: Search candidates ─────────────────────────────────
    if (candidateQuery && candidateQuery.length >= 2) {
      const candidates = await prisma.user.findMany({
        where: {
          userTenants: { some: { tenantId: ctx.tenantId } },
          OR: [
            { name: { contains: candidateQuery, mode: "insensitive" } },
            { email: { contains: candidateQuery, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, email: true },
        take: 10,
      });

      return NextResponse.json({ success: true, data: { candidates } });
    }

    // ─── Step 2: Search exams ──────────────────────────────────────
    if (examQuery && examQuery.length >= 2) {
      const exams = await prisma.exam.findMany({
        where: {
          tenantId: ctx.tenantId,
          title: { contains: examQuery, mode: "insensitive" },
        },
        select: { id: true, title: true },
        take: 10,
      });

      return NextResponse.json({ success: true, data: { exams } });
    }

    // ─── Step 3: Get eligible sessions (passed + no cert yet) ──────
    if (candidateId && examId) {
      // Sessions ที่สอบผ่านแล้ว
      const grades = await prisma.grade.findMany({
        where: {
          tenantId: ctx.tenantId,
          isPassed: true,
          status: "CONFIRMED",
          session: {
            candidateId,
            examSchedule: { examId },
          },
          // ยังไม่มีใบรับรอง
          certificates: { none: {} },
        },
        select: {
          id: true,
          totalScore: true,
          maxScore: true,
          percentage: true,
          gradedAt: true,
          session: {
            select: {
              id: true,
              examSchedule: {
                select: {
                  id: true,
                  startDate: true,
                  exam: { select: { title: true } },
                },
              },
            },
          },
        },
        orderBy: { gradedAt: "desc" },
      });

      const sessions = grades.map((g) => ({
        gradeId: g.id,
        sessionId: g.session.id,
        scheduleId: g.session.examSchedule.id,
        examTitle: g.session.examSchedule.exam.title,
        examDate: g.session.examSchedule.startDate,
        totalScore: g.totalScore,
        maxScore: g.maxScore,
        percentage: g.percentage,
        gradedAt: g.gradedAt,
      }));

      return NextResponse.json({ success: true, data: { sessions } });
    }

    return NextResponse.json({
      success: true,
      data: { candidates: [], exams: [], sessions: [] },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
