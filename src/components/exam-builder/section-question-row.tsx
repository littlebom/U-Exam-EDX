"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  QUESTION_TYPE_LABELS,
  getDifficultyBadge,
  getTypeIcon,
} from "@/lib/question-utils";
import { extractPlainText } from "@/lib/content-utils";
import type { QuestionType, DifficultyLevel } from "@/types/question-bank";

interface SectionQuestionRowProps {
  sectionQuestion: Record<string, unknown>;
  index: number;
  onRemove: () => void;
}

export function SectionQuestionRow({
  sectionQuestion,
  index,
  onRemove,
}: SectionQuestionRowProps) {
  const question = sectionQuestion.question as Record<string, unknown>;
  const overridePoints = sectionQuestion.points as number | null;
  const defaultPoints = (question?.points as number) ?? 1;
  const points = overridePoints ?? defaultPoints;

  const type = (question?.type as QuestionType) ?? "MULTIPLE_CHOICE";
  const difficulty = (question?.difficulty as DifficultyLevel) ?? "MEDIUM";
  const content = question?.content;

  // Extract plain text for preview
  const previewText = extractPlainText(content).trim();
  const truncated =
    previewText.length > 80 ? previewText.slice(0, 80) + "..." : previewText;

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          <span className="text-muted-foreground mt-0.5">
            {getTypeIcon(type)}
          </span>
          <span className="text-sm line-clamp-2">
            {truncated || "ไม่มีเนื้อหา"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {QUESTION_TYPE_LABELS[type] ?? type}
        </span>
      </TableCell>
      <TableCell>{getDifficultyBadge(difficulty)}</TableCell>
      <TableCell className="text-center font-medium">{points}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
