-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "competency_framework_id" UUID;

-- CreateTable
CREATE TABLE "competency_frameworks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "competency_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competency_areas" (
    "id" UUID NOT NULL,
    "framework_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "competency_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_competency_maps" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "competency_area_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_competency_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competency_frameworks_tenant_id_idx" ON "competency_frameworks"("tenant_id");

-- CreateIndex
CREATE INDEX "competency_frameworks_tenant_id_is_active_idx" ON "competency_frameworks"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "competency_areas_framework_id_idx" ON "competency_areas"("framework_id");

-- CreateIndex
CREATE INDEX "competency_areas_framework_id_order_idx" ON "competency_areas"("framework_id", "order");

-- CreateIndex
CREATE INDEX "question_competency_maps_question_id_idx" ON "question_competency_maps"("question_id");

-- CreateIndex
CREATE INDEX "question_competency_maps_competency_area_id_idx" ON "question_competency_maps"("competency_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_competency_maps_question_id_competency_area_id_key" ON "question_competency_maps"("question_id", "competency_area_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "exam_answers_session_id_is_flagged_idx" ON "exam_answers"("session_id", "is_flagged");

-- CreateIndex
CREATE INDEX "grades_tenant_id_published_at_idx" ON "grades"("tenant_id", "published_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_competency_framework_id_fkey" FOREIGN KEY ("competency_framework_id") REFERENCES "competency_frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_frameworks" ADD CONSTRAINT "competency_frameworks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_areas" ADD CONSTRAINT "competency_areas_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "competency_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_competency_maps" ADD CONSTRAINT "question_competency_maps_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_competency_maps" ADD CONSTRAINT "question_competency_maps_competency_area_id_fkey" FOREIGN KEY ("competency_area_id") REFERENCES "competency_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
