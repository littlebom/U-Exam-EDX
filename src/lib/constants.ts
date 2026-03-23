/**
 * Shared constants across the application
 */

export const STAFF_ROLES = [
  "ADMIN",
  "EXAM_CREATOR",
  "GRADER",
  "PROCTOR",
  "CENTER_MANAGER",
  "CENTER_STAFF",
] as const;

export const ADMIN_ROLES = [
  "PLATFORM_ADMIN",
  "TENANT_OWNER",
  ...STAFF_ROLES,
] as const;

export const CANDIDATE_ROLES = ["CANDIDATE"] as const;
