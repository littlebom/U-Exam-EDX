import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import {
  parseImportFile,
  validateRows,
  importQuestions,
} from "@/services/question-import.service";

// POST — Import questions from Excel/CSV
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("question:create");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subjectId = formData.get("subjectId") as string | null;
    const mode = formData.get("mode") as string | null; // "preview" or "import"

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาอัปโหลดไฟล์" } },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseImportFile(buffer, file.name);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "ไฟล์ไม่มีข้อมูล" } },
        { status: 400 }
      );
    }

    // Validate
    const { valid, errors } = validateRows(rows);

    // Preview mode — return validation result without importing
    if (mode === "preview") {
      return NextResponse.json({
        success: true,
        data: {
          totalRows: rows.length,
          validRows: valid.length,
          errorRows: errors.length,
          preview: valid.slice(0, 10).map((r) => ({
            row: r.rowNum,
            type: r.type,
            difficulty: r.difficulty,
            content: r.content.substring(0, 100),
            correctAnswer: r.correctAnswer,
            points: r.points,
            subjectCode: r.subjectCode,
          })),
          errors,
        },
      });
    }

    // Import mode — save to database
    const result = await importQuestions(
      session.tenantId,
      session.userId,
      valid,
      subjectId ?? undefined
    );

    // Merge validation errors with import errors
    result.errors = [...errors, ...result.errors];
    result.total = rows.length;

    // Fire-and-forget audit log
    import("@/services/audit-log.service").then(({ logAdminAction }) =>
      logAdminAction("QUESTION_IMPORT", {
        userId: session.userId,
        tenantId: session.tenantId,
        target: subjectId ?? undefined,
        detail: {
          fileName: file.name,
          totalRows: rows.length,
          imported: result.imported,
          errorCount: result.errors.length,
        },
      })
    ).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
