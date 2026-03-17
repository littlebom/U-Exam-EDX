"use client";

import { Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TrueFalseProps {
  correctAnswer: "true" | "false" | "";
  onCorrectChange: (value: "true" | "false") => void;
}

export function TrueFalseTemplate({
  correctAnswer,
  onCorrectChange,
}: TrueFalseProps) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">
        เลือกคำตอบที่ถูกต้อง
      </Label>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 rounded-lg border-2 p-4 transition-all hover:shadow-sm",
            correctAnswer === "true"
              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
              : "border-muted hover:border-green-300"
          )}
          onClick={() => onCorrectChange("true")}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              correctAnswer === "true"
                ? "bg-green-500 text-white"
                : "bg-green-100 text-green-600 dark:bg-green-900/30"
            )}
          >
            <Check className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="font-semibold">ถูก (True)</div>
            <div className="text-xs text-muted-foreground">ข้อความเป็นจริง</div>
          </div>
        </button>

        <button
          type="button"
          className={cn(
            "flex items-center gap-3 rounded-lg border-2 p-4 transition-all hover:shadow-sm",
            correctAnswer === "false"
              ? "border-red-500 bg-red-50 dark:bg-red-950/20"
              : "border-muted hover:border-red-300"
          )}
          onClick={() => onCorrectChange("false")}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              correctAnswer === "false"
                ? "bg-red-500 text-white"
                : "bg-red-100 text-red-600 dark:bg-red-900/30"
            )}
          >
            <X className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="font-semibold">ผิด (False)</div>
            <div className="text-xs text-muted-foreground">ข้อความเป็นเท็จ</div>
          </div>
        </button>
      </div>
    </div>
  );
}
