import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listRegistrations, createRegistration } from "@/services/registration.service";
import { registrationFilterSchema, createRegistrationSchema } from "@/lib/validations/registration";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("registration:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = registrationFilterSchema.parse(params);
    const result = await listRegistrations(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("registration:approve");
    const body = await req.json();
    const data = createRegistrationSchema.parse(body);
    const registration = await createRegistration(session.tenantId, data);

    return NextResponse.json({ success: true, data: registration }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
