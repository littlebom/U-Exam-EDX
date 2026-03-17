-- CreateTable
CREATE TABLE "seats" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "seat_number" VARCHAR(20) NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    "type" VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL,
    "test_center_id" UUID NOT NULL,
    "room_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "serial_number" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'WORKING',
    "last_checked" TIMESTAMPTZ,
    "description" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seats_room_id_idx" ON "seats"("room_id");

-- CreateIndex
CREATE INDEX "seats_room_id_status_idx" ON "seats"("room_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "seats_room_id_seat_number_key" ON "seats"("room_id", "seat_number");

-- CreateIndex
CREATE INDEX "equipment_test_center_id_idx" ON "equipment"("test_center_id");

-- CreateIndex
CREATE INDEX "equipment_test_center_id_status_idx" ON "equipment"("test_center_id", "status");

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_test_center_id_fkey" FOREIGN KEY ("test_center_id") REFERENCES "test_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
