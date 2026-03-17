import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type {
  CreateCouponInput,
  UpdateCouponInput,
  CouponFilter,
  ApplyCouponInput,
} from "@/lib/validations/payment";

// ─── List Coupons ───────────────────────────────────────────────────

export async function listCoupons(tenantId: string, filters: CouponFilter) {
  const { status, search, page, perPage } = filters;

  const where: Record<string, unknown> = { tenantId };

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Status filter
  const now = new Date();
  if (status === "ACTIVE") {
    where.isActive = true;
    where.validTo = { gte: now };
    where.validFrom = { lte: now };
  } else if (status === "EXPIRED") {
    where.validTo = { lt: now };
  } else if (status === "DISABLED") {
    where.isActive = false;
  }

  const [total, coupons] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: coupons,
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// ─── Get Coupon by ID ───────────────────────────────────────────────

export async function getCoupon(tenantId: string, id: string) {
  const coupon = await prisma.coupon.findFirst({
    where: { id, tenantId },
    include: {
      couponUsages: {
        include: {
          registration: {
            select: {
              id: true,
              candidate: { select: { id: true, name: true, email: true } },
              examSchedule: {
                select: {
                  exam: { select: { title: true } },
                },
              },
            },
          },
        },
        orderBy: { usedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!coupon) throw errors.notFound("ไม่พบคูปอง");
  return coupon;
}

// ─── Create Coupon ──────────────────────────────────────────────────

export async function createCoupon(
  tenantId: string,
  data: CreateCouponInput
) {
  // Check for duplicate code
  const existing = await prisma.coupon.findUnique({
    where: { code: data.code },
  });
  if (existing) throw errors.conflict("รหัสคูปองนี้ถูกใช้แล้ว");

  // Validate dates
  if (data.validTo <= data.validFrom) {
    throw errors.validation("วันสิ้นสุดต้องมาหลังวันเริ่มต้น");
  }

  return prisma.coupon.create({
    data: {
      tenantId,
      code: data.code,
      description: data.description,
      type: data.type,
      value: data.value,
      maxUses: data.maxUses,
      minAmount: data.minAmount,
      maxDiscount: data.maxDiscount,
      validFrom: data.validFrom,
      validTo: data.validTo,
    },
  });
}

// ─── Update Coupon ──────────────────────────────────────────────────

export async function updateCoupon(
  tenantId: string,
  id: string,
  data: UpdateCouponInput
) {
  const coupon = await prisma.coupon.findFirst({
    where: { id, tenantId },
  });

  if (!coupon) throw errors.notFound("ไม่พบคูปอง");

  // If changing code, check uniqueness
  if (data.code && data.code !== coupon.code) {
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code },
    });
    if (existing) throw errors.conflict("รหัสคูปองนี้ถูกใช้แล้ว");
  }

  return prisma.coupon.update({
    where: { id },
    data,
  });
}

// ─── Delete Coupon ──────────────────────────────────────────────────

export async function deleteCoupon(tenantId: string, id: string) {
  const coupon = await prisma.coupon.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { couponUsages: true } } },
  });

  if (!coupon) throw errors.notFound("ไม่พบคูปอง");

  if (coupon._count.couponUsages > 0) {
    throw errors.validation("ไม่สามารถลบคูปองที่มีการใช้งานแล้วได้ กรุณาปิดการใช้งานแทน");
  }

  return prisma.coupon.delete({ where: { id } });
}

// ─── Validate & Apply Coupon ────────────────────────────────────────

export async function applyCoupon(
  tenantId: string,
  data: ApplyCouponInput
) {
  const coupon = await prisma.coupon.findFirst({
    where: { code: data.code, tenantId },
  });

  if (!coupon) throw errors.notFound("ไม่พบคูปองนี้");

  const now = new Date();

  // Validate coupon
  if (!coupon.isActive) throw errors.validation("คูปองนี้ถูกปิดใช้งาน");
  if (now < coupon.validFrom) throw errors.validation("คูปองนี้ยังไม่เริ่มใช้งาน");
  if (now > coupon.validTo) throw errors.validation("คูปองนี้หมดอายุแล้ว");
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    throw errors.validation("คูปองนี้ถูกใช้ครบจำนวนแล้ว");
  }

  // Check registration exists
  const registration = await prisma.registration.findFirst({
    where: { id: data.registrationId, tenantId },
  });
  if (!registration) throw errors.notFound("ไม่พบการสมัครสอบ");

  // Check not already applied
  const existingUsage = await prisma.couponUsage.findUnique({
    where: {
      couponId_registrationId: {
        couponId: coupon.id,
        registrationId: data.registrationId,
      },
    },
  });
  if (existingUsage) throw errors.conflict("คูปองนี้ถูกใช้กับการสมัครนี้แล้ว");

  // Check min amount
  if (coupon.minAmount && registration.amount < coupon.minAmount) {
    throw errors.validation(
      `ยอดสมัครสอบต้องมากกว่า ${coupon.minAmount} บาท จึงจะใช้คูปองนี้ได้`
    );
  }

  // Calculate discount
  let discountAmount: number;
  if (coupon.type === "PERCENTAGE") {
    discountAmount = (registration.amount * coupon.value) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = Math.min(coupon.value, registration.amount);
  }

  // Apply in transaction
  return prisma.$transaction(async (tx) => {
    const usage = await tx.couponUsage.create({
      data: {
        couponId: coupon.id,
        registrationId: data.registrationId,
        discountAmount,
      },
    });

    // Increment used count
    await tx.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    return { usage, discountAmount, couponCode: coupon.code };
  });
}
