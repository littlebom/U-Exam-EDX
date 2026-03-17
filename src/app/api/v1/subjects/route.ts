import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listSubjects, createSubject } from "@/services/subject.service";
import { createSubjectSchema } from "@/lib/validations/subject";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("question:list");
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") ?? undefined;

    const subjects = await listSubjects(session.tenantId, categoryId);

    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("question:create");
    const body = await request.json();
    const parsed = createSubjectSchema.parse(body);
    const subject = await createSubject(session.tenantId, parsed);

    return NextResponse.json(
      { success: true, data: subject },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
