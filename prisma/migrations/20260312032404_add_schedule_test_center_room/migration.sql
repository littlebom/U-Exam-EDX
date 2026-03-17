-- AlterTable
ALTER TABLE "exam_schedules" ADD COLUMN     "room_id" UUID,
ADD COLUMN     "test_center_id" UUID;

-- CreateIndex
CREATE INDEX "exam_schedules_test_center_id_idx" ON "exam_schedules"("test_center_id");

-- CreateIndex
CREATE INDEX "exam_schedules_room_id_idx" ON "exam_schedules"("room_id");

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_test_center_id_fkey" FOREIGN KEY ("test_center_id") REFERENCES "test_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
