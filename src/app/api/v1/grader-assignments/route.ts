import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import {
  listGraderAssignments,
  createGraderAssignment,
} from "@/services/grader-assignment.service";
import { z } from "zod";

const createSchema = z.object({
  examId: z.string().uuid(),
  userId: z.string().uuid(),
  scope: z.enum(["ALL", "SECTION"]).optional(),
  sectionId: z.string().uuid().optional(),
});

const filterSchema = z.object({
  examId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("grading:list");
    const { searchParams } = new URL(request.url);
    const filters = filterSchema.parse(Object.fromEntries(searchParams));
    const result = await listGraderAssignments(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("grading:grade");
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const result = await createGraderAssignment(session.tenantId, parsed);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
