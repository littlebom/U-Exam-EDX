"use client";

import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrderingProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
}

export function OrderingTemplate({ items, onItemsChange }: OrderingProps) {
  const addItem = () => onItemsChange([...items, ""]);

  const removeItem = (idx: number) => {
    if (items.length <= 2) return;
    onItemsChange(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, value: string) => {
    onItemsChange(items.map((item, i) => (i === idx ? value : item)));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onItemsChange(next);
  };

  const moveDown = (idx: number) => {
    if (idx === items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onItemsChange(next);
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">
        รายการ{" "}
        <span className="font-normal text-muted-foreground">
          (เรียงตามลำดับที่ถูกต้อง ใช้ปุ่มลูกศรเพื่อจัดลำดับ)
        </span>
      </Label>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-lg border bg-card p-3"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              {idx + 1}
            </span>
            <Input
              placeholder={`รายการที่ ${idx + 1}`}
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <div className="flex shrink-0 flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground"
                disabled={idx === 0}
                onClick={() => moveUp(idx)}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground"
                disabled={idx === items.length - 1}
                onClick={() => moveDown(idx)}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            {items.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(idx)}
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
        onClick={addItem}
      >
        <Plus className="h-3.5 w-3.5" />
        เพิ่มรายการ
      </Button>
    </div>
  );
}
