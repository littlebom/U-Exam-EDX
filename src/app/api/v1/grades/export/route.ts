import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("grading:list");
    const { searchParams } = new URL(request.url);

    const examId = searchParams.get("examId") || undefined;
    const status = searchParams.get("status") || undefined;
    const isPassed = searchParams.get("isPassed");

    // Build where
    const where: Prisma.GradeWhereInput = {
      tenantId: session.tenantId,
      ...(status && { status }),
      ...(isPassed !== null && isPassed !== undefined && {
        isPassed: isPassed === "true",
      }),
      ...(examId && {
        session: { examSchedule: { examId } },
      }),
    };

    // Fetch all grades matching filters
    const grades = await prisma.grade.findMany({
      where,
      include: {
        session: {
          include: {
            candidate: { select: { name: true, email: true } },
            examSchedule: {
              include: {
                exam: { select: { title: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const BOM = "\uFEFF"; // UTF-8 BOM for Excel Thai support
    const headers = [
      "ชื่อผู้สอบ",
      "Email",
      "ชุดสอบ",
      "คะแนน",
      "คะแนนเต็ม",
      "เปอร์เซ็นต์",
      "ผ่าน/ไม่ผ่าน",
      "สถานะ",
      "วันที่ตรวจ",
      "วันที่เผยแพร่",
    ];

    const statusLabels: Record<string, string> = {
      DRAFT: "ร่าง",
      GRADING: "กำลังตรวจ",
      COMPLETED: "ตรวจแล้ว",
      PUBLISHED: "เผยแพร่แล้ว",
    };

    const escapeCSV = (value: string): string => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const rows = grades.map((grade) => {
      const candidate = grade.session.candidate;
      const exam = grade.session.examSchedule.exam;
      return [
        escapeCSV(candidate.name || "—"),
        escapeCSV(candidate.email),
        escapeCSV(exam.title),
        grade.totalScore?.toString() ?? "—",
        grade.maxScore?.toString() ?? "—",
        grade.percentage != null ? `${Math.round(grade.percentage)}%` : "—",
        grade.isPassed === true ? "ผ่าน" : grade.isPassed === false ? "ไม่ผ่าน" : "—",
        statusLabels[grade.status] || grade.status,
        grade.gradedAt
          ? new Date(grade.gradedAt).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
        grade.publishedAt
          ? new Date(grade.publishedAt).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
      ].join(",");
    });

    const csv = BOM + headers.join(",") + "\n" + rows.join("\n");

    const filename = `grades_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
