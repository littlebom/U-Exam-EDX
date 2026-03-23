import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────────────────

export interface ExamQuestion {
  id: string;
  type: string;
  content: unknown;
  options: unknown;
  points: number;
  difficulty: string;
  sectionTitle: string;
  sortOrder: number;
}

export interface ExamSessionData {
  id: string;
  status: string;
  startedAt: string | null;
  timeRemaining: number | null;
  examSchedule: {
    id: string;
    exam: {
      id: string;
      title: string;
      duration: number;
      totalPoints: number;
      passingScore: number;
      settings: Record<string, unknown> | null;
      sections: {
        id: string;
        title: string;
        sortOrder: number;
        questions: {
          id: string;
          sortOrder: number;
          points: number | null;
          question: {
            id: string;
            type: string;
            content: unknown;
            options: unknown;
            points: number;
            difficulty: string;
          };
        }[];
      }[];
    };
  };
}

interface ExamStore {
  // Session data
  session: ExamSessionData | null;
  questions: ExamQuestion[];
  isLoading: boolean;
  error: string | null;

  // Exam state
  currentIndex: number;
  answers: Record<string, unknown>;
  flagged: Set<string>;
  timeRemaining: number;
  isSubmitting: boolean;
  isSubmitted: boolean;

  // Auto-save tracking
  dirtyAnswers: Set<string>; // question IDs with unsaved changes
  lastSaveAt: number | null;

  // Actions
  setSession: (session: ExamSessionData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentIndex: (index: number) => void;
  setAnswer: (questionId: string, answer: unknown) => void;
  toggleFlag: (questionId: string) => void;
  decrementTimer: () => number;
  setSubmitting: (submitting: boolean) => void;
  setSubmitted: () => void;
  markSaved: () => void;
  reset: () => void;
}

// ─── Store ──────────────────────────────────────────────────────────

export const useExamStore = create<ExamStore>((set, get) => ({
  // Initial state
  session: null,
  questions: [],
  isLoading: true,
  error: null,
  currentIndex: 0,
  answers: {},
  flagged: new Set(),
  timeRemaining: 0,
  isSubmitting: false,
  isSubmitted: false,
  dirtyAnswers: new Set(),
  lastSaveAt: null,

  setSession: (session) => {
    // Flatten sections into a flat question list
    const questions: ExamQuestion[] = [];
    for (const section of session.examSchedule.exam.sections) {
      for (const sq of section.questions) {
        questions.push({
          id: sq.question.id,
          type: sq.question.type,
          content: sq.question.content,
          options: sq.question.options,
          points: sq.points ?? sq.question.points,
          difficulty: sq.question.difficulty,
          sectionTitle: section.title,
          sortOrder: questions.length,
        });
      }
    }

    set({
      session,
      questions,
      timeRemaining: session.timeRemaining || session.examSchedule.exam.duration * 60,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  setCurrentIndex: (currentIndex) => set({ currentIndex }),

  setAnswer: (questionId, answer) => {
    const { answers, dirtyAnswers } = get();
    const newDirty = new Set(dirtyAnswers);
    newDirty.add(questionId);
    set({
      answers: { ...answers, [questionId]: answer },
      dirtyAnswers: newDirty,
    });
  },

  toggleFlag: (questionId) => {
    const { flagged } = get();
    const next = new Set(flagged);
    if (next.has(questionId)) {
      next.delete(questionId);
    } else {
      next.add(questionId);
    }
    set({ flagged: next });
  },

  decrementTimer: () => {
    const { timeRemaining } = get();
    const next = Math.max(0, timeRemaining - 1);
    set({ timeRemaining: next });
    return next;
  },

  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmitted: () => set({ isSubmitted: true, isSubmitting: false }),

  markSaved: () => set({ dirtyAnswers: new Set(), lastSaveAt: Date.now() }),

  reset: () =>
    set({
      session: null,
      questions: [],
      isLoading: true,
      error: null,
      currentIndex: 0,
      answers: {},
      flagged: new Set(),
      timeRemaining: 0,
      isSubmitting: false,
      isSubmitted: false,
      dirtyAnswers: new Set(),
      lastSaveAt: null,
    }),
}));
