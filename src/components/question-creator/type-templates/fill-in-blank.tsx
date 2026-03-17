"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FillInBlankProps {
  blanks: string[];
  onBlanksChange: (blanks: string[]) => void;
}

export function FillInBlankTemplate({
  blanks,
  onBlanksChange,
}: FillInBlankProps) {
  const addBlank = () => onBlanksChange([...blanks, ""]);

  const removeBlank = (idx: number) => {
    if (blanks.length <= 1) return;
    onBlanksChange(blanks.filter((_, i) => i !== idx));
  };

  const updateBlank = (idx: number, value: string) => {
    onBlanksChange(blanks.map((b, i) => (i === idx ? value : b)));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> ใช้เครื่องหมาย{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">___</code>{" "}
          ในเนื้อหาคำถาม เพื่อแสดงตำแหน่งช่องว่าง
        </p>
      </div>

      <Label className="text-sm font-semibold">
        คำตอบแต่ละช่อง{" "}
        <span className="font-normal text-muted-foreground">
          (เรียงตามลำดับช่องว่างในคำถาม)
        </span>
      </Label>

      <div className="space-y-2">
        {blanks.map((blank, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <span className="flex h-7 shrink-0 items-center justify-center rounded-md bg-muted px-2 text-xs font-bold">
              ช่อง {idx + 1}
            </span>
            <Input
              placeholder={`คำตอบสำหรับช่องที่ ${idx + 1}`}
              value={blank}
              onChange={(e) => updateBlank(idx, e.target.value)}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            {blanks.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeBlank(idx)}
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
        onClick={addBlank}
      >
        <Plus className="h-3.5 w-3.5" />
        เพิ่มช่องว่าง
      </Button>
    </div>
  );
}
