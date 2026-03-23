import { z } from "zod";

/**
 * Shared pagination fields for Zod filter schemas
 * Usage: z.object({ ...paginationFields, yourField: z.string() })
 */
export const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
};
