"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShortAnswerProps {
  answers: string[];
  onAnswersChange: (answers: string[]) => void;
}

export function ShortAnswerTemplate({
  answers,
  onAnswersChange,
}: ShortAnswerProps) {
  const addAnswer = () => onAnswersChange([...answers, ""]);

  const removeAnswer = (idx: number) => {
    if (answers.length <= 1) return;
    onAnswersChange(answers.filter((_, i) => i !== idx));
  };

  const updateAnswer = (idx: number, value: string) => {
    onAnswersChange(answers.map((a, i) => (i === idx ? value : a)));
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">
        คำตอบที่ยอมรับ{" "}
        <span className="font-normal text-muted-foreground">
          (ระบบจะตรวจคำตอบทุกรูปแบบที่ระบุ)
        </span>
      </Label>

      <div className="space-y-2">
        {answers.map((ans, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
              {idx + 1}
            </span>
            <Input
              placeholder={
                idx === 0
                  ? "คำตอบหลัก"
                  : "คำตอบอื่นที่ยอมรับ (เช่น สะกดต่างกัน)"
              }
              value={ans}
              onChange={(e) => updateAnswer(idx, e.target.value)}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            {answers.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeAnswer(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={addAnswer}
      >
        <Plus className="h-3.5 w-3.5" />
        เพิ่มคำตอบอื่น
      </Button>
    </div>
  );
}
