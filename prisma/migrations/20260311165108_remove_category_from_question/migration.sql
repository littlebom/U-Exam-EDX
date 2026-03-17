-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "questions_category_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "questions_category_id_idx";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN IF EXISTS "category_id";
