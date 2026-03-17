import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  unauthorized: (message = "กรุณาเข้าสู่ระบบ") =>
    new AppError("UNAUTHORIZED", message, 401),
  forbidden: (message = "ไม่มีสิทธิ์ดำเนินการ") =>
    new AppError("FORBIDDEN", message, 403),
  notFound: (message = "ไม่พบข้อมูล") =>
    new AppError("NOT_FOUND", message, 404),
  conflict: (message = "ข้อมูลซ้ำ") =>
    new AppError("CONFLICT", message, 409),
  badRequest: (message = "คำขอไม่ถูกต้อง") =>
    new AppError("BAD_REQUEST", message, 400),
  validation: (message = "ข้อมูลไม่ถูกต้อง") =>
    new AppError("VALIDATION_ERROR", message, 422),
};

export function handleApiError(error: unknown): NextResponse {
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> };
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "ข้อมูลไม่ถูกต้อง",
          details: zodError.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      },
      { status: 422 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: error.code, message: error.message },
      },
      { status: error.statusCode }
    );
  }

  console.error("Unhandled error:", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "เกิดข้อผิดพลาดภายในระบบ",
      },
    },
    { status: 500 }
  );
}
