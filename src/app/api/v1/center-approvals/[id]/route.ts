import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  getApproval,
  startReview,
  approveCenter,
  rejectCenter,
} from "@/services/center-approval.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await context.params;
    const approval = await getApproval(session.tenantId, id);

    return NextResponse.json({ success: true, data: approval });
  } catch (error) {
    return handleApiError(error);
  }
}

const reviewSchema = z.object({
  action: z.enum(["start_review", "approve", "reject"]),
  comments: z.string().optional(),
  checklist: z
    .array(
      z.object({
        item: z.string(),
        passed: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await context.params;
    const body = await req.json();
    const data = reviewSchema.parse(body);

    let result;

    switch (data.action) {
      case "start_review":
        result = await startReview(session.tenantId, id, session.userId);
        break;
      case "approve":
        result = await approveCenter(session.tenantId, id, session.userId, {
          comments: data.comments,
          checklist: data.checklist,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        });
        break;
      case "reject":
        if (!data.comments) {
          return NextResponse.json(
            { success: false, error: { message: "กรุณาระบุเหตุผลในการปฏิเสธ" } },
            { status: 400 }
          );
        }
        result = await rejectCenter(session.tenantId, id, session.userId, {
          comments: data.comments,
          checklist: data.checklist,
        });
        break;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
