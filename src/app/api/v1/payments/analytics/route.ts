import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionTenant } from "@/lib/get-session";
import { requirePermission } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getSessionTenant();
    await requirePermission(session, "payment:read");
    const tenantId = session.tenantId;

    // Monthly revenue for the last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthlyPayments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        paidAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, paidAt: true },
    });

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue[key] = 0;
    }
    for (const p of monthlyPayments) {
      if (!p.paidAt) continue;
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyRevenue) {
        monthlyRevenue[key] += p.amount;
      }
    }

    const revenueByMonth = Object.entries(monthlyRevenue).map(
      ([month, revenue]) => ({ month, revenue })
    );

    // Payment method distribution
    const allCompleted = await prisma.payment.findMany({
      where: { tenantId, status: "COMPLETED" },
      select: { method: true, amount: true },
    });

    const methodMap: Record<string, { count: number; amount: number }> = {};
    for (const p of allCompleted) {
      if (!methodMap[p.method]) methodMap[p.method] = { count: 0, amount: 0 };
      methodMap[p.method].count++;
      methodMap[p.method].amount += p.amount;
    }
    const paymentMethods = Object.entries(methodMap).map(
      ([method, data]) => ({ method, ...data })
    );

    // Coupon usage stats
    const couponUsages = await prisma.couponUsage.findMany({
      where: { coupon: { tenantId } },
      include: {
        coupon: { select: { code: true, type: true, value: true } },
      },
    });

    const couponMap: Record<
      string,
      { code: string; usageCount: number; totalDiscount: number }
    > = {};
    for (const u of couponUsages) {
      const code = u.coupon.code;
      if (!couponMap[code])
        couponMap[code] = { code, usageCount: 0, totalDiscount: 0 };
      couponMap[code].usageCount++;
      couponMap[code].totalDiscount += u.discountAmount;
    }
    const couponStats = Object.values(couponMap)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Summary stats
    const [totalPayments, totalRevenue, totalRefunds, totalCouponsUsed] =
      await Promise.all([
        prisma.payment.count({ where: { tenantId, status: "COMPLETED" } }),
        prisma.payment.aggregate({
          where: { tenantId, status: "COMPLETED" },
          _sum: { amount: true },
        }),
        prisma.refund.aggregate({
          where: { tenantId, status: "PROCESSED" },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.couponUsage.count({ where: { coupon: { tenantId } } }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPayments,
          totalRevenue: totalRevenue._sum.amount ?? 0,
          totalRefunded: totalRefunds._sum.amount ?? 0,
          refundCount: totalRefunds._count ?? 0,
          totalCouponsUsed,
        },
        revenueByMonth,
        paymentMethods,
        couponStats,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
