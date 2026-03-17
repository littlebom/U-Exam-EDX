import {
  CheckCircle,
  HelpCircle,
  PenLine,
  AlignLeft,
  FileText,
  Link2,
  ListOrdered,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { QuestionType, DifficultyLevel, QuestionStatus } from "@/types/question-bank";

// ============================================================
// Label maps
// ============================================================

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "ปรนัย",
  TRUE_FALSE: "ถูก/ผิด",
  SHORT_ANSWER: "ตอบสั้น",
  ESSAY: "อัตนัย",
  FILL_IN_BLANK: "เติมคำ",
  MATCHING: "จับคู่",
  ORDERING: "เรียงลำดับ",
  IMAGE_BASED: "รูปภาพ",
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  EASY: "ง่าย",
  MEDIUM: "ปานกลาง",
  HARD: "ยาก",
};

export const STATUS_LABELS: Record<QuestionStatus, string> = {
  DRAFT: "แบบร่าง",
  ACTIVE: "เผยแพร่",
  ARCHIVED: "เก็บถาวร",
};

// ============================================================
// Badge renderers
// ============================================================

export function getDifficultyBadge(difficulty: DifficultyLevel) {
  switch (difficulty) {
    case "EASY":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          {DIFFICULTY_LABELS[difficulty]}
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          {DIFFICULTY_LABELS[difficulty]}
        </Badge>
      );
    case "HARD":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          {DIFFICULTY_LABELS[difficulty]}
        </Badge>
      );
  }
}

export function getStatusBadge(status: QuestionStatus) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>;
    case "ACTIVE":
      return <Badge>{STATUS_LABELS[status]}</Badge>;
    case "ARCHIVED":
      return <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>;
  }
}

export function getTypeIcon(type: QuestionType) {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return <CheckCircle className="h-3.5 w-3.5" />;
    case "TRUE_FALSE":
      return <HelpCircle className="h-3.5 w-3.5" />;
    case "SHORT_ANSWER":
      return <PenLine className="h-3.5 w-3.5" />;
    case "ESSAY":
      return <AlignLeft className="h-3.5 w-3.5" />;
    case "FILL_IN_BLANK":
      return <FileText className="h-3.5 w-3.5" />;
    case "MATCHING":
      return <Link2 className="h-3.5 w-3.5" />;
    case "ORDERING":
      return <ListOrdered className="h-3.5 w-3.5" />;
    case "IMAGE_BASED":
      return <ImageIcon className="h-3.5 w-3.5" />;
  }
}
