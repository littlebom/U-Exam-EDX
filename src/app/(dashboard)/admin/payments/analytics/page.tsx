"use client";

import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Undo2,
  Tag,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AnalyticsData {
  summary: {
    totalPayments: number;
    totalRevenue: number;
    totalRefunded: number;
    refundCount: number;
    totalCouponsUsed: number;
  };
  revenueByMonth: Array<{ month: string; revenue: number }>;
  paymentMethods: Array<{ method: string; count: number; amount: number }>;
  couponStats: Array<{
    code: string;
    usageCount: number;
    totalDiscount: number;
  }>;
}

const METHOD_LABELS: Record<string, string> = {
  PROMPTPAY: "PromptPay",
  CREDIT_CARD: "Credit Card",
  BANK_TRANSFER: "Bank Transfer",
  E_WALLET: "e-Wallet",
};

const PIE_COLORS = ["#741717", "#b91c1c", "#ef4444", "#f59e0b", "#3b82f6"];

const MONTH_LABELS: Record<string, string> = {
  "01": "ม.ค.",
  "02": "ก.พ.",
  "03": "มี.ค.",
  "04": "เม.ย.",
  "05": "พ.ค.",
  "06": "มิ.ย.",
  "07": "ก.ค.",
  "08": "ส.ค.",
  "09": "ก.ย.",
  "10": "ต.ค.",
  "11": "พ.ย.",
  "12": "ธ.ค.",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatShortMonth(monthStr: string) {
  const parts = monthStr.split("-");
  return MONTH_LABELS[parts[1]] || parts[1];
}

export default function PaymentAnalyticsPage() {
  const { data: result, isLoading } = useQuery<{
    success: boolean;
    data: AnalyticsData;
  }>({
    queryKey: ["payment-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/v1/payments/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
  });

  const analytics = result?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <p>ไม่สามารถโหลดข้อมูลได้</p>
      </div>
    );
  }

  const chartData = analytics.revenueByMonth.map((d) => ({
    ...d,
    label: formatShortMonth(d.month),
  }));

  const pieData = analytics.paymentMethods.map((d) => ({
    name: METHOD_LABELS[d.method] || d.method,
    value: d.count,
    amount: d.amount,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            สถิติการเงิน
          </h1>
          <p className="text-sm text-muted-foreground">
            ภาพรวมรายได้ วิธีชำระเงิน และการใช้คูปอง
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รายได้ทั้งหมด</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(analytics.summary.totalRevenue)}
                </p>
              </div>
              <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  จำนวนชำระสำเร็จ
                </p>
                <p className="text-2xl font-bold">
                  {analytics.summary.totalPayments}
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">คืนเงินแล้ว</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(analytics.summary.totalRefunded)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analytics.summary.refundCount} รายการ
                </p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/30">
                <Undo2 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  คูปองที่ใช้แล้ว
                </p>
                <p className="text-2xl font-bold">
                  {analytics.summary.totalCouponsUsed}
                </p>
              </div>
              <div className="rounded-lg bg-purple-100 p-2.5 dark:bg-purple-900/30">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">รายได้รายเดือน</CardTitle>
            <CardDescription>รายได้ย้อนหลัง 12 เดือน (บาท)</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                ยังไม่มีข้อมูล
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "รายได้",
                    ]}
                    labelFormatter={(label) => `เดือน ${label}`}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#741717"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สัดส่วนวิธีชำระ</CardTitle>
            <CardDescription>จำนวนครั้งตามวิธีชำระเงิน</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                ยังไม่มีข้อมูล
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} รายการ`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coupon Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">คูปองยอดนิยม</CardTitle>
          <CardDescription>
            10 คูปองที่ถูกใช้งานมากที่สุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.couponStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Tag className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีการใช้คูปอง</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.couponStats.map((coupon) => {
                const maxUsage = analytics.couponStats[0].usageCount;
                const pct =
                  maxUsage > 0 ? (coupon.usageCount / maxUsage) * 100 : 0;
                return (
                  <div key={coupon.code} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-medium">
                        {coupon.code}
                      </span>
                      <span className="text-muted-foreground">
                        {coupon.usageCount} ครั้ง · ลดรวม{" "}
                        {formatCurrency(coupon.totalDiscount)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
