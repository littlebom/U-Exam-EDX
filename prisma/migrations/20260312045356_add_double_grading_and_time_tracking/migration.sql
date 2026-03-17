-- AlterTable
ALTER TABLE "grade_answers" ADD COLUMN     "grading_duration_ms" INTEGER,
ADD COLUMN     "grading_round" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "grading_started_at" TIMESTAMPTZ,
ADD COLUMN     "moderated_at" TIMESTAMPTZ,
ADD COLUMN     "moderated_by_id" UUID,
ADD COLUMN     "moderated_score" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "grader_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scope" VARCHAR(20) NOT NULL DEFAULT 'ALL',
    "section_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "grader_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grader_assignments_tenant_id_idx" ON "grader_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "grader_assignments_exam_id_idx" ON "grader_assignments"("exam_id");

-- CreateIndex
CREATE INDEX "grader_assignments_user_id_idx" ON "grader_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "grader_assignments_exam_id_user_id_section_id_key" ON "grader_assignments"("exam_id", "user_id", "section_id");

-- AddForeignKey
ALTER TABLE "grade_answers" ADD CONSTRAINT "grade_answers_moderated_by_id_fkey" FOREIGN KEY ("moderated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grader_assignments" ADD CONSTRAINT "grader_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grader_assignments" ADD CONSTRAINT "grader_assignments_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grader_assignments" ADD CONSTRAINT "grader_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grader_assignments" ADD CONSTRAINT "grader_assignments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
