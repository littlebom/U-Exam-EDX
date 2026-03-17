-- Remove title column from questions (replaced by content field)
ALTER TABLE "questions" DROP COLUMN IF EXISTS "title";
