import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listExams, createExam } from "@/services/exam.service";
import { examFilterSchema, createExamSchema } from "@/lib/validations/exam";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("exam:list");
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = examFilterSchema.parse(params);
    const result = await listExams(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("exam:create");
    const body = await request.json();
    const parsed = createExamSchema.parse(body);

    const exam = await createExam(
      session.tenantId,
      session.userId,
      parsed
    );

    const { logAdminAction } = await import("@/services/audit-log.service");
    logAdminAction("EXAM_CREATE", { userId: session.userId, tenantId: session.tenantId, target: exam.id, detail: { title: parsed.title } });

    return NextResponse.json({ success: true, data: exam }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
