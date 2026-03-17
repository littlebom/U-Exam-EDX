-- CreateTable
CREATE TABLE "exam_day_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "exam_schedule_id" UUID NOT NULL,
    "test_center_id" UUID,
    "created_by_id" UUID,
    "type" VARCHAR(30) NOT NULL,
    "description" TEXT,
    "severity" VARCHAR(20),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_day_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_day_logs_tenant_id_idx" ON "exam_day_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "exam_day_logs_exam_schedule_id_idx" ON "exam_day_logs"("exam_schedule_id");

-- CreateIndex
CREATE INDEX "exam_day_logs_exam_schedule_id_type_idx" ON "exam_day_logs"("exam_schedule_id", "type");

-- AddForeignKey
ALTER TABLE "exam_day_logs" ADD CONSTRAINT "exam_day_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_day_logs" ADD CONSTRAINT "exam_day_logs_exam_schedule_id_fkey" FOREIGN KEY ("exam_schedule_id") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_day_logs" ADD CONSTRAINT "exam_day_logs_test_center_id_fkey" FOREIGN KEY ("test_center_id") REFERENCES "test_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_day_logs" ADD CONSTRAINT "exam_day_logs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
