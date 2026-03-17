-- CreateTable
CREATE TABLE "registrations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "exam_schedule_id" UUID NOT NULL,
    "test_center_id" UUID,
    "seat_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seat_number" VARCHAR(20),
    "waiting_list_order" INTEGER,
    "notes" TEXT,
    "cancelled_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registrations_tenant_id_idx" ON "registrations"("tenant_id");

-- CreateIndex
CREATE INDEX "registrations_candidate_id_idx" ON "registrations"("candidate_id");

-- CreateIndex
CREATE INDEX "registrations_exam_schedule_id_idx" ON "registrations"("exam_schedule_id");

-- CreateIndex
CREATE INDEX "registrations_tenant_id_status_idx" ON "registrations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "registrations_exam_schedule_id_status_idx" ON "registrations"("exam_schedule_id", "status");

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_exam_schedule_id_fkey" FOREIGN KEY ("exam_schedule_id") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_test_center_id_fkey" FOREIGN KEY ("test_center_id") REFERENCES "test_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
