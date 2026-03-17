/*
  Warnings:

  - The primary key for the `question_media` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `question_media` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `question_media` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `question_media` table. All the data in the column will be lost.
  - Added the required column `media_file_id` to the `question_media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "question_media" DROP CONSTRAINT "question_media_pkey",
DROP COLUMN "id",
DROP COLUMN "type",
DROP COLUMN "url",
ADD COLUMN     "media_file_id" UUID NOT NULL,
ADD CONSTRAINT "question_media_pkey" PRIMARY KEY ("question_id", "media_file_id");

-- CreateTable
CREATE TABLE "media_files" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "type" VARCHAR(20) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" DOUBLE PRECISION,
    "provider" VARCHAR(20),
    "external_id" VARCHAR(100),
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_files_tenant_id_idx" ON "media_files"("tenant_id");

-- CreateIndex
CREATE INDEX "media_files_type_idx" ON "media_files"("type");

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_media" ADD CONSTRAINT "question_media_media_file_id_fkey" FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
