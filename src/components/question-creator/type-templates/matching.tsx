"use client";

import { Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MatchPair {
  left: string;
  right: string;
}

interface MatchingProps {
  pairs: MatchPair[];
  onPairsChange: (pairs: MatchPair[]) => void;
}

export function MatchingTemplate({ pairs, onPairsChange }: MatchingProps) {
  const addPair = () => onPairsChange([...pairs, { left: "", right: "" }]);

  const removePair = (idx: number) => {
    if (pairs.length <= 2) return;
    onPairsChange(pairs.filter((_, i) => i !== idx));
  };

  const updatePair = (
    idx: number,
    side: "left" | "right",
    value: string
  ) => {
    onPairsChange(
      pairs.map((p, i) => (i === idx ? { ...p, [side]: value } : p))
    );
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">
        คู่จับคู่{" "}
        <span className="font-normal text-muted-foreground">
          (ลำดับแถว = คำตอบที่ถูกต้อง)
        </span>
      </Label>

      {/* Column Headers */}
      <div className="flex items-center gap-3 px-3">
        <span className="w-7 shrink-0" />
        <span className="flex-1 text-xs font-medium text-muted-foreground">
          รายการซ้าย
        </span>
        <span className="w-6 shrink-0" />
        <span className="flex-1 text-xs font-medium text-muted-foreground">
          รายการขวา
        </span>
        <span className="w-7 shrink-0" />
      </div>

      <div className="space-y-2">
        {pairs.map((pair, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
              {idx + 1}
            </span>
            <Input
              placeholder="รายการซ้าย"
              value={pair.left}
              onChange={(e) => updatePair(idx, "left", e.target.value)}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="รายการขวา"
              value={pair.right}
              onChange={(e) => updatePair(idx, "right", e.target.value)}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            {pairs.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removePair(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {pairs.length < 10 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={addPair}
        >
          <Plus className="h-3.5 w-3.5" />
          เพิ่มคู่
        </Button>
      )}
    </div>
  );
}
