"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  CheckCircle2,
  Tag,
  QrCode,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { applyCouponAction } from "@/actions/payment.actions";
import { cn } from "@/lib/utils";

interface RegistrationDetail {
  id: string;
  amount: number;
  status: string;
  paymentStatus: string;
  examSchedule: {
    id: string;
    startDate: string;
    exam: { id: string; title: string };
    testCenter?: { id: string; name: string } | null;
  };
  seatNumber: string | null;
  couponUsages?: Array<{
    id: string;
    discountAmount: number;
    coupon: { code: string; type: string; value: number };
  }>;
}

const PAYMENT_METHODS = [
  {
    value: "PROMPTPAY",
    label: "PromptPay",
    icon: QrCode,
    description: "สแกน QR Code ชำระทันที",
  },
  {
    value: "CREDIT_CARD",
    label: "Credit / Debit Card",
    icon: CreditCard,
    description: "Visa, Mastercard, JCB",
  },
] as const;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const registrationId = params.id as string;
  const wasCancelled = searchParams.get("cancelled") === "true";

  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: regResult, isLoading } = useQuery<{
    success: boolean;
    data: RegistrationDetail;
  }>({
    queryKey: ["registration-payment", registrationId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/registrations/${registrationId}`);
      if (!res.ok) throw new Error("Failed to load registration");
      return res.json();
    },
  });

  const registration = regResult?.data;
  const originalAmount = registration?.amount ?? 0;

  // Load existing coupon usages
  useEffect(() => {
    if (registration?.couponUsages?.length) {
      const totalDiscount = registration.couponUsages.reduce(
        (sum, cu) => sum + cu.discountAmount,
        0
      );
      setAppliedDiscount(totalDiscount);
      setAppliedCouponCode(registration.couponUsages[0]?.coupon.code ?? null);
    }
  }, [registration]);

  const finalAmount = Math.max(0, originalAmount - appliedDiscount);

  // Show cancelled toast on mount
  useEffect(() => {
    if (wasCancelled) {
      toast.error("การชำระเงินถูกยกเลิก คุณสามารถลองอีกครั้งได้");
    }
  }, [wasCancelled]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const result = await applyCouponAction({
        code: couponCode.trim().toUpperCase(),
        registrationId,
      });
      if (result.success) {
        const data = result.data as { discountAmount: number };
        setAppliedDiscount(data.discountAmount);
        setAppliedCouponCode(couponCode.trim().toUpperCase());
        toast.success(`ใช้คูปองสำเร็จ ลด ${formatCurrency(data.discountAmount)}`);
      } else {
        toast.error(result.error || "ไม่สามารถใช้คูปองได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error("กรุณาเลือกวิธีชำระเงิน");
      return;
    }
    if (finalAmount <= 0) {
      toast.error("จำนวนเงินไม่ถูกต้อง");
      return;
    }

    setIsProcessing(true);
    try {
      // Create Stripe Checkout Session
      const res = await fetch("/api/v1/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          method: selectedMethod,
        }),
      });

      const json = await res.json();

      if (json.success && json.data?.checkoutUrl) {
        toast.success("กำลังนำไปยังหน้าชำระเงิน...");
        // Redirect to Stripe Checkout
        window.location.href = json.data.checkoutUrl;
      } else {
        toast.error(json.error?.message || json.error || "ไม่สามารถสร้างรายการชำระเงินได้");
        setIsProcessing(false);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not found
  if (!registration) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p className="font-medium">ไม่พบข้อมูลการสมัครสอบ</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/profile/registrations">กลับไปรายการสมัคร</Link>
        </Button>
      </div>
    );
  }

  // Already paid
  if (registration.paymentStatus === "PAID" || registration.paymentStatus === "WAIVED") {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold">ชำระเงินแล้ว</h2>
        <p className="text-muted-foreground mt-1">
          รายการนี้ได้รับการชำระเงินเรียบร้อยแล้ว
        </p>
        <Button className="mt-6" asChild>
          <Link href="/profile/registrations">กลับไปรายการสมัคร</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="gap-1.5">
        <Link href="/profile/registrations">
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">ชำระเงิน</h1>
        <p className="text-sm text-muted-foreground">
          ชำระค่าสมัครสอบเพื่อยืนยันการลงทะเบียน
        </p>
      </div>

      {/* Cancelled Notice */}
      {wasCancelled && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-400">
            การชำระเงินถูกยกเลิก คุณสามารถเลือกวิธีชำระเงินและลองใหม่ได้
          </span>
        </div>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">สรุปรายการ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">ข้อสอบ</span>
            <span className="text-sm font-medium">
              {registration.examSchedule.exam.title}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">วันสอบ</span>
            <span className="text-sm">
              {formatDate(registration.examSchedule.startDate)}
            </span>
          </div>
          {registration.examSchedule.testCenter && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ศูนย์สอบ</span>
              <span className="text-sm">
                {registration.examSchedule.testCenter.name}
              </span>
            </div>
          )}
          {registration.seatNumber && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ที่นั่ง</span>
              <span className="text-sm font-mono">{registration.seatNumber}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">ค่าสมัครสอบ</span>
            <span className="text-sm">{formatCurrency(originalAmount)}</span>
          </div>

          {appliedDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="text-sm flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                ส่วนลด ({appliedCouponCode})
              </span>
              <span className="text-sm">-{formatCurrency(appliedDiscount)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between">
            <span className="font-semibold">ยอดชำระทั้งสิ้น</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(finalAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Coupon */}
      {!appliedCouponCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              คูปองส่วนลด
            </CardTitle>
            <CardDescription>กรอกรหัสคูปองเพื่อรับส่วนลด (ถ้ามี)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="กรอกรหัสคูปอง"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="font-mono"
                disabled={isApplyingCoupon}
              />
              <Button
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || isApplyingCoupon}
              >
                {isApplyingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ใช้คูปอง
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {appliedCouponCode && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-400">
            ใช้คูปอง{" "}
            <span className="font-mono font-semibold">{appliedCouponCode}</span> แล้ว ลด{" "}
            {formatCurrency(appliedDiscount)}
          </span>
        </div>
      )}

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">เลือกวิธีชำระเงิน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.value;
              return (
                <button
                  key={method.value}
                  onClick={() => setSelectedMethod(method.value)}
                  disabled={isProcessing}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pay Button */}
      <Button
        size="lg"
        className="w-full gap-2 text-base"
        onClick={handlePayment}
        disabled={!selectedMethod || isProcessing || finalAmount <= 0}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            กำลังนำไปยังหน้าชำระเงิน...
          </>
        ) : (
          <>
            <ExternalLink className="h-5 w-5" />
            ชำระเงิน {formatCurrency(finalAmount)}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        คุณจะถูกนำไปยังหน้าชำระเงินที่ปลอดภัยของ Stripe
      </p>
    </div>
  );
}
