import { NextRequest, NextResponse } from "next/server";
import { getSessionTenant } from "@/lib/get-session";
import { listUsers, createUser } from "@/services/user.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";

// 10 user creations per minute per IP
const createUserLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionTenant();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "20", 10);
    const search = searchParams.get("search") || undefined;

    const result = await listUsers(session.tenantId, { page, perPage, search });

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const createUserSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  roleId: z.string().min(1, "กรุณาเลือก Role"),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateResult = createUserLimiter.check(req);
  if (!rateResult.success) return rateResult.response!;

  try {
    const session = await getSessionTenant();

    // Check permission
    const hasPermission =
      session.roleName === "PLATFORM_ADMIN" ||
      session.roleName === "TENANT_OWNER" ||
      session.permissions.includes("user:create");

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { message: "ไม่มีสิทธิ์สร้างผู้ใช้" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createUserSchema.parse(body);

    const user = await createUser({
      tenantId: session.tenantId,
      ...data,
    });

    return NextResponse.json({ success: true, data: { id: user.id } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
