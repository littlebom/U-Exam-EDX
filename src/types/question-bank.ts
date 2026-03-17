// ============================================================
// Shared types for the Question Bank module
// ============================================================

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "FILL_IN_BLANK"
  | "MATCHING"
  | "ORDERING"
  | "IMAGE_BASED";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

export type QuestionStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  _count: { subjects: number };
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  questionCount: number;
  category: { id: string; name: string } | null;
}

export interface SubjectDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
}

export interface QuestionGroupItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  _count: { questions: number };
}

export interface TagItem {
  id: string;
  name: string;
  color: string | null;
  _count: { questionTags: number };
}

export interface QuestionRow {
  id: string;
  content: unknown;
  type: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  points: number;
  createdAt: string;
  subject: { id: string; code: string; name: string } | null;
  createdBy: { id: string; name: string; email: string };
  questionTags: { tag: { id: string; name: string; color: string | null } }[];
  questionGroup: { id: string; name: string; color: string | null } | null;
}
