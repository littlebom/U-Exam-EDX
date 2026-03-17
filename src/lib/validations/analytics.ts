import { z } from "zod";

// ─── Analytics Filters ─────────────────────────────────────────────

export const overviewFilterSchema = z.object({
  examId: z.string().optional(),
});

export const scoreDistributionFilterSchema = z.object({
  examId: z.string().optional(),
  buckets: z.coerce.number().int().min(5).max(20).default(10),
});

export const itemAnalysisFilterSchema = z.object({
  examId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export const trendFilterSchema = z.object({
  months: z.coerce.number().int().min(3).max(24).default(12),
});

// ─── Types ──────────────────────────────────────────────────────────

export type OverviewFilter = z.infer<typeof overviewFilterSchema>;
export type ScoreDistributionFilter = z.infer<typeof scoreDistributionFilterSchema>;
export type ItemAnalysisFilter = z.infer<typeof itemAnalysisFilterSchema>;
export type TrendFilter = z.infer<typeof trendFilterSchema>;
