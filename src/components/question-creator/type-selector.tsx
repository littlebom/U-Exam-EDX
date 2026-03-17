"use client";

import {
  CheckCircle,
  ToggleLeft,
  PenLine,
  AlignLeft,
  TextCursorInput,
  Link2,
  ListOrdered,
  ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "FILL_IN_BLANK"
  | "MATCHING"
  | "ORDERING"
  | "IMAGE_BASED";

interface TypeOption {
  type: QuestionType;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: "MULTIPLE_CHOICE",
    icon: CheckCircle,
    label: "ปรนัย",
    description: "เลือกคำตอบที่ถูกต้อง 1 ข้อ",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  },
  {
    type: "TRUE_FALSE",
    icon: ToggleLeft,
    label: "ถูก/ผิด",
    description: "ตอบถูกหรือผิด",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    type: "SHORT_ANSWER",
    icon: PenLine,
    label: "ตอบสั้น",
    description: "พิมพ์คำตอบสั้นๆ",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  },
  {
    type: "ESSAY",
    icon: AlignLeft,
    label: "อัตนัย",
    description: "เขียนตอบยาว ตรวจด้วยคน",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  },
  {
    type: "FILL_IN_BLANK",
    icon: TextCursorInput,
    label: "เติมคำ",
    description: "เติมคำในช่องว่าง",
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30",
  },
  {
    type: "MATCHING",
    icon: Link2,
    label: "จับคู่",
    description: "จับคู่รายการซ้าย-ขวา",
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
  },
  {
    type: "ORDERING",
    icon: ListOrdered,
    label: "เรียงลำดับ",
    description: "เรียงรายการให้ถูกต้อง",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  },
  {
    type: "IMAGE_BASED",
    icon: ImageIcon,
    label: "รูปภาพ",
    description: "ตอบคำถามจากรูปภาพ",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30",
  },
];

interface TypeSelectorProps {
  selected: QuestionType | null;
  onSelect: (type: QuestionType) => void;
}

export function TypeSelector({ selected, onSelect }: TypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TYPE_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = selected === opt.type;
        return (
          <Card
            key={opt.type}
            className={cn(
              "group relative cursor-pointer p-4 transition-all hover:shadow-md",
              isSelected
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "hover:border-primary/30"
            )}
            onClick={() => onSelect(opt.type)}
          >
            <div
              className={cn(
                "mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg",
                opt.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{opt.label}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {opt.description}
            </p>
            {isSelected && (
              <div className="absolute right-3 top-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <CheckCircle className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export { TYPE_OPTIONS };
