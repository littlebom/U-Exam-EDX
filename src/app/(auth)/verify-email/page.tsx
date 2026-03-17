"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("ไม่พบ token สำหรับยืนยันอีเมล");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `/api/v1/profile/email-change/verify?token=${encodeURIComponent(token)}`,
          { redirect: "manual" }
        );

        // The API redirects on success (302)
        if (res.type === "opaqueredirect" || res.status === 302 || res.ok) {
          setStatus("success");
        } else {
          const data = await res.json().catch(() => null);
          setStatus("error");
          setErrorMessage(
            data?.error?.message || "ไม่สามารถยืนยันอีเมลได้ กรุณาลองใหม่"
          );
        }
      } catch {
        setStatus("error");
        setErrorMessage("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">U-Exam</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>ยืนยันอีเมล</CardTitle>
            <CardDescription>
              {status === "loading" && "กำลังตรวจสอบลิงก์ยืนยัน..."}
              {status === "success" && "เปลี่ยนอีเมลสำเร็จ"}
              {status === "error" && "ไม่สามารถยืนยันอีเมลได้"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            )}

            {status === "success" && (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  อีเมลของคุณได้รับการเปลี่ยนแปลงเรียบร้อยแล้ว
                  กรุณาเข้าสู่ระบบใหม่ด้วยอีเมลใหม่
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link href="/profile">กลับไปโปรไฟล์</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/login">เข้าสู่ระบบ</Link>
                  </Button>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {errorMessage}
                </p>
                <Button asChild variant="outline">
                  <Link href="/profile">กลับไปโปรไฟล์</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
