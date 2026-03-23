import { z } from "zod";

// ─── Shared date filter ─────────────────────────────────────────────

const dateFilter = {
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
};

// ─── Analytics Filters ─────────────────────────────────────────────

export const overviewFilterSchema = z.object({
  examId: z.string().optional(),
  ...dateFilter,
});

export const scoreDistributionFilterSchema = z.object({
  examId: z.string().optional(),
  buckets: z.coerce.number().int().min(5).max(20).default(10),
  ...dateFilter,
});

export const itemAnalysisFilterSchema = z.object({
  examId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
  ...dateFilter,
});

export const trendFilterSchema = z.object({
  examId: z.string().optional(),
  months: z.coerce.number().int().min(3).max(24).default(12),
  ...dateFilter,
});

export const exportFilterSchema = z.object({
  format: z.enum(["csv", "xlsx", "pdf"]),
  examId: z.string().optional(),
  ...dateFilter,
});

// ─── Types ──────────────────────────────────────────────────────────

export type OverviewFilter = z.infer<typeof overviewFilterSchema>;
export type ScoreDistributionFilter = z.infer<typeof scoreDistributionFilterSchema>;
export type ItemAnalysisFilter = z.infer<typeof itemAnalysisFilterSchema>;
export type TrendFilter = z.infer<typeof trendFilterSchema>;
export type ExportFilter = z.infer<typeof exportFilterSchema>;
