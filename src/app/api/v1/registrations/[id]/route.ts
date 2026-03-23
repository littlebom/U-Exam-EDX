import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getRegistration, updateRegistration, deleteRegistration } from "@/services/registration.service";
import { updateRegistrationSchema } from "@/lib/validations/registration";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;

    // First try: admin with permission
    try {
      const session = await requirePermission("registration:list");
      const registration = await getRegistration(session.tenantId, id);
      return NextResponse.json({ success: true, data: registration });
    } catch {
      // Not admin — check if candidate owns this registration
    }

    // Fallback: candidate accessing their own registration
    const userSession = await auth();
    if (!userSession?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const registration = await prisma.registration.findFirst({
      where: { id, candidateId: userSession.user.id },
      include: {
        candidate: { select: { id: true, name: true, email: true, phone: true } },
        examSchedule: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            location: true,
            exam: { select: { id: true, title: true, duration: true, passingScore: true } },
          },
        },
        testCenter: { select: { id: true, name: true, address: true } },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: { message: "ไม่พบการสมัครสอบ" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("registration:approve");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateRegistrationSchema.parse(body);
    const registration = await updateRegistration(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("registration:cancel");
    const { id } = await ctx.params;
    await deleteRegistration(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
