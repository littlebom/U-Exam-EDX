"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface EssayProps {
  rubric: string;
  onRubricChange: (value: string) => void;
}

export function EssayTemplate({ rubric, onRubricChange }: EssayProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-4">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          ข้อสอบอัตนัยไม่มีตัวเลือก — ผู้สอบจะเขียนตอบแบบอิสระ
          ระบบจะส่งไปให้ผู้ตรวจตรวจให้คะแนน
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          แนวคำตอบ / เกณฑ์ตรวจ{" "}
          <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
        </Label>
        <Textarea
          placeholder="ระบุแนวคำตอบหรือเกณฑ์การให้คะแนน เพื่อช่วยผู้ตรวจ..."
          rows={4}
          value={rubric}
          onChange={(e) => onRubricChange(e.target.value)}
        />
      </div>
    </div>
  );
}
