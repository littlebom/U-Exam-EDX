import { describe, it, expect } from "vitest";
import { AppError, errors } from "./errors";

describe("AppError", () => {
  it("should create an error with code and message", () => {
    const error = new AppError("TEST_ERROR", "Something went wrong", 400);
    expect(error.code).toBe("TEST_ERROR");
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(400);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("errors helpers", () => {
  it("unauthorized should return 401", () => {
    const err = errors.unauthorized("ไม่ได้เข้าสู่ระบบ");
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("forbidden should return 403", () => {
    const err = errors.forbidden("ไม่มีสิทธิ์");
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("notFound should return 404", () => {
    const err = errors.notFound("ไม่พบข้อมูล");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("conflict should return 409", () => {
    const err = errors.conflict("ข้อมูลซ้ำ");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("badRequest should return 400", () => {
    const err = errors.badRequest("ข้อมูลไม่ถูกต้อง");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
  });
});
