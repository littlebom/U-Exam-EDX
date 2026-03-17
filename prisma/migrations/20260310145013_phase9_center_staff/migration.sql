-- CreateTable
CREATE TABLE "center_staff" (
    "id" UUID NOT NULL,
    "test_center_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "position" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "phone" VARCHAR(20),
    "certifications" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "center_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_shifts" (
    "id" UUID NOT NULL,
    "center_staff_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exam_schedule_id" UUID,
    "date" DATE NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "staff_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "center_staff_test_center_id_idx" ON "center_staff"("test_center_id");

-- CreateIndex
CREATE INDEX "center_staff_user_id_idx" ON "center_staff"("user_id");

-- CreateIndex
CREATE INDEX "center_staff_test_center_id_status_idx" ON "center_staff"("test_center_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "center_staff_test_center_id_user_id_key" ON "center_staff"("test_center_id", "user_id");

-- CreateIndex
CREATE INDEX "staff_shifts_center_staff_id_idx" ON "staff_shifts"("center_staff_id");

-- CreateIndex
CREATE INDEX "staff_shifts_user_id_idx" ON "staff_shifts"("user_id");

-- CreateIndex
CREATE INDEX "staff_shifts_exam_schedule_id_idx" ON "staff_shifts"("exam_schedule_id");

-- CreateIndex
CREATE INDEX "staff_shifts_date_idx" ON "staff_shifts"("date");

-- AddForeignKey
ALTER TABLE "center_staff" ADD CONSTRAINT "center_staff_test_center_id_fkey" FOREIGN KEY ("test_center_id") REFERENCES "test_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_staff" ADD CONSTRAINT "center_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_center_staff_id_fkey" FOREIGN KEY ("center_staff_id") REFERENCES "center_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_exam_schedule_id_fkey" FOREIGN KEY ("exam_schedule_id") REFERENCES "exam_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
