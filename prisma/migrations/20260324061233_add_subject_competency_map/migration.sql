-- CreateTable
CREATE TABLE "subject_competency_maps" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "competency_area_id" UUID NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subject_competency_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subject_competency_maps_subject_id_idx" ON "subject_competency_maps"("subject_id");

-- CreateIndex
CREATE INDEX "subject_competency_maps_competency_area_id_idx" ON "subject_competency_maps"("competency_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_competency_maps_subject_id_competency_area_id_key" ON "subject_competency_maps"("subject_id", "competency_area_id");

-- AddForeignKey
ALTER TABLE "subject_competency_maps" ADD CONSTRAINT "subject_competency_maps_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_competency_maps" ADD CONSTRAINT "subject_competency_maps_competency_area_id_fkey" FOREIGN KEY ("competency_area_id") REFERENCES "competency_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
