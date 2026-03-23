import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// GET — Export questions as Excel
export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("question:list");
    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");

    const where: Record<string, unknown> = {
      tenantId: session.tenantId,
      status: { not: "ARCHIVED" },
    };
    if (subjectId) where.subjectId = subjectId;

    const questions = await prisma.question.findMany({
      where,
      include: {
        subject: { select: { code: true, name: true } },
        questionGroup: { select: { name: true } },
      },
      orderBy: [{ subject: { code: "asc" } }, { createdAt: "asc" }],
      take: 500,
    });

    // Build Excel data
    const rows = questions.map((q, i) => {
      const options = (q.options as Array<{ id?: string; text?: string }>) ?? [];
      const correctAnswer = q.correctAnswer as string | string[] | null;

      // Determine correct answer label
      let answerLabel = "";
      if (q.type === "MULTIPLE_CHOICE" && typeof correctAnswer === "string") {
        const idx = options.findIndex((o) => o.id === correctAnswer);
        answerLabel = idx >= 0 ? String.fromCharCode(65 + idx) : String(correctAnswer);
      } else if (q.type === "TRUE_FALSE") {
        answerLabel = String(correctAnswer);
      } else if (Array.isArray(correctAnswer)) {
        answerLabel = correctAnswer.join("|");
      } else {
        answerLabel = String(correctAnswer ?? "");
      }

      return {
        "#": i + 1,
        type: q.type,
        difficulty: q.difficulty,
        content: q.searchText ?? "",
        option_a: options[0]?.text ?? "",
        option_b: options[1]?.text ?? "",
        option_c: options[2]?.text ?? "",
        option_d: options[3]?.text ?? "",
        correct_answer: answerLabel,
        explanation: q.explanation ?? "",
        points: q.points,
        subject_code: q.subject?.code ?? "",
        subject_name: q.subject?.name ?? "",
        group: q.questionGroup?.name ?? "",
        status: q.status,
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    ws["!cols"] = [
      { wch: 4 }, // #
      { wch: 18 }, // type
      { wch: 10 }, // difficulty
      { wch: 60 }, // content
      { wch: 25 }, // option_a
      { wch: 25 }, // option_b
      { wch: 25 }, // option_c
      { wch: 25 }, // option_d
      { wch: 15 }, // correct_answer
      { wch: 40 }, // explanation
      { wch: 6 }, // points
      { wch: 10 }, // subject_code
      { wch: 25 }, // subject_name
      { wch: 20 }, // group
      { wch: 10 }, // status
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Questions");

    // Write to buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="questions-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
