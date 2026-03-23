"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Exam Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-semibold">เกิดข้อผิดพลาดในระบบสอบ</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message || "กรุณาลองใหม่อีกครั้ง หากปัญหายังคงอยู่ กรุณาติดต่อผู้ดูแลระบบ"}
      </p>
      <Button onClick={reset}>ลองใหม่</Button>
    </div>
  );
}
