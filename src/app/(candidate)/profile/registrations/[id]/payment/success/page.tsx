"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const params = useParams();
  const registrationId = params.id as string;

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 30; // 30 × 2s = 60 seconds max wait

  // Poll for payment confirmation
  useEffect(() => {
    if (paymentConfirmed) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/registrations/${registrationId}`);
        if (res.ok) {
          const json = await res.json();
          if (
            json.data?.paymentStatus === "PAID" ||
            json.data?.paymentStatus === "WAIVED"
          ) {
            setPaymentConfirmed(true);
            clearInterval(interval);
            return;
          }
        }
      } catch {
        // Ignore errors, keep polling
      }

      setPollCount((c) => {
        if (c + 1 >= maxPolls) {
          clearInterval(interval);
        }
        return c + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [registrationId, paymentConfirmed]);

  if (paymentConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mt-6">ชำระเงินสำเร็จ!</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          การชำระเงินเสร็จสมบูรณ์แล้ว การสมัครสอบของคุณได้รับการยืนยัน
        </p>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" asChild>
            <Link href="/profile/registrations">ดูรายการสมัคร</Link>
          </Button>
          <Button asChild>
            <Link href="/profile/wallet">ดูประวัติชำระเงิน</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Waiting for confirmation
  if (pollCount >= maxPolls) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
          <Clock className="h-16 w-16 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold mt-6">รอการยืนยัน</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          ระบบยังไม่ได้รับการยืนยันจากธนาคาร อาจใช้เวลาสักครู่
          กรุณาตรวจสอบอีกครั้งในรายการสมัครสอบ
        </p>
        <Button className="mt-8" asChild>
          <Link href="/profile/registrations">ดูรายการสมัคร</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
      <h2 className="text-xl font-bold">กำลังตรวจสอบการชำระเงิน</h2>
      <p className="text-muted-foreground mt-2 text-center max-w-md">
        กรุณารอสักครู่ ระบบกำลังยืนยันการชำระเงินของคุณ...
      </p>
      <p className="text-xs text-muted-foreground mt-4">
        สำหรับ PromptPay อาจใช้เวลา 1-2 นาทีในการยืนยัน
      </p>
    </div>
  );
}
