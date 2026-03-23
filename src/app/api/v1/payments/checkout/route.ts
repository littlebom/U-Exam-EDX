import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured, getBaseUrl } from "@/lib/stripe";
import { createCheckoutSessionSchema } from "@/lib/validations/payment";
import { createPayment, updatePaymentGatewayRef } from "@/services/payment.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate candidate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    // 2. Check Stripe is configured
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { success: false, error: { message: "ระบบชำระเงินยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ" } },
        { status: 503 }
      );
    }

    // 3. Validate input
    const body = await req.json();
    const data = createCheckoutSessionSchema.parse(body);

    // 4. Load registration and verify ownership
    const registration = await prisma.registration.findFirst({
      where: {
        id: data.registrationId,
        candidateId: session.user.id,
      },
      include: {
        examSchedule: {
          select: {
            id: true,
            tenantId: true,
            startDate: true,
            exam: { select: { title: true } },
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: { message: "ไม่พบการสมัครสอบ" } },
        { status: 404 }
      );
    }

    if (registration.paymentStatus === "PAID" || registration.paymentStatus === "WAIVED") {
      return NextResponse.json(
        { success: false, error: { message: "การสมัครนี้ชำระเงินแล้ว" } },
        { status: 422 }
      );
    }

    const tenantId = registration.examSchedule.tenantId;

    // 5. Calculate final amount (after coupon discounts)
    let finalAmount = registration.amount;
    const couponUsages = await prisma.couponUsage.findMany({
      where: { registrationId: registration.id },
    });
    const totalDiscount = couponUsages.reduce((sum, cu) => sum + cu.discountAmount, 0);
    finalAmount = Math.max(finalAmount - totalDiscount, 0);

    if (finalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: { message: "ยอดชำระเป็น 0 ไม่จำเป็นต้องชำระผ่าน Stripe" } },
        { status: 422 }
      );
    }

    // 6. Create Payment record (PENDING)
    const payment = await createPayment(tenantId, {
      registrationId: registration.id,
      amount: finalAmount,
      method: data.method,
      description: `ค่าสมัครสอบ: ${registration.examSchedule.exam.title}`,
    });

    // 7. Map method to Stripe payment_method_types
    const paymentMethodTypes: ("card" | "promptpay")[] =
      data.method === "PROMPTPAY" ? ["promptpay"] : ["card"];

    // 8. Create Stripe Checkout Session
    const baseUrl = getBaseUrl();
    const examTitle = registration.examSchedule.exam.title;
    const examDate = new Date(registration.examSchedule.startDate).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: `ค่าสมัครสอบ: ${examTitle}`,
              description: `รอบสอบ: ${examDate}`,
            },
            unit_amount: Math.round(finalAmount * 100), // THB → satang
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        paymentId: payment.id,
        registrationId: registration.id,
        tenantId,
        candidateId: session.user.id,
      },
      success_url: `${baseUrl}/profile/registrations/${registration.id}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/profile/registrations/${registration.id}/payment?cancelled=true`,
      locale: "th",
    });

    // 9. Store Stripe session ID on payment record
    await updatePaymentGatewayRef(payment.id, checkoutSession.id);

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkoutSession.url,
        paymentId: payment.id,
        sessionId: checkoutSession.id,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
