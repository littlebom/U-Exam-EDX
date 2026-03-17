-- CreateIndex
CREATE INDEX "registrations_seat_id_idx" ON "registrations"("seat_id");

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
