-- DropForeignKey
ALTER TABLE "exam_blueprints" DROP CONSTRAINT "exam_blueprints_category_id_fkey";

-- AlterTable
ALTER TABLE "exam_blueprints" ADD COLUMN     "mode" VARCHAR(20) NOT NULL DEFAULT 'BLUEPRINT',
ADD COLUMN     "question_group_id" UUID,
ADD COLUMN     "section_id" UUID,
ADD COLUMN     "subject_id" UUID,
ALTER COLUMN "category_id" DROP NOT NULL,
ALTER COLUMN "difficulty" DROP NOT NULL,
ALTER COLUMN "difficulty" DROP DEFAULT;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "exam_id" UUID,
ADD COLUMN     "is_exam_only" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "exam_blueprints_section_id_idx" ON "exam_blueprints"("section_id");

-- CreateIndex
CREATE INDEX "questions_tenant_id_is_exam_only_idx" ON "questions"("tenant_id", "is_exam_only");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_blueprints" ADD CONSTRAINT "exam_blueprints_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_blueprints" ADD CONSTRAINT "exam_blueprints_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_blueprints" ADD CONSTRAINT "exam_blueprints_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_blueprints" ADD CONSTRAINT "exam_blueprints_question_group_id_fkey" FOREIGN KEY ("question_group_id") REFERENCES "question_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
