-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "question_group_id" UUID;

-- CreateTable
CREATE TABLE "question_groups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "color" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "question_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_groups_tenant_id_idx" ON "question_groups"("tenant_id");

-- CreateIndex
CREATE INDEX "question_groups_subject_id_idx" ON "question_groups"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_groups_subject_id_name_key" ON "question_groups"("subject_id", "name");

-- CreateIndex
CREATE INDEX "questions_tenant_id_question_group_id_idx" ON "questions"("tenant_id", "question_group_id");

-- AddForeignKey
ALTER TABLE "question_groups" ADD CONSTRAINT "question_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_groups" ADD CONSTRAINT "question_groups_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_group_id_fkey" FOREIGN KEY ("question_group_id") REFERENCES "question_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
