-- CreateTable
CREATE TABLE "lti_course_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "resource_link_id" VARCHAR(500),
    "context_id" VARCHAR(500),
    "context_title" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lti_course_mappings_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add course_mapping_id to lti_user_links
ALTER TABLE "lti_user_links" ADD COLUMN "course_mapping_id" UUID;

-- Drop old unique constraint and create new one
ALTER TABLE "lti_user_links" DROP CONSTRAINT IF EXISTS "lti_user_links_platform_id_lti_user_id_key";
CREATE UNIQUE INDEX "lti_user_links_platform_id_lti_user_id_course_mapping_id_key" ON "lti_user_links"("platform_id", "lti_user_id", "course_mapping_id");

-- CreateIndex
CREATE UNIQUE INDEX "lti_course_mappings_platform_id_exam_id_key" ON "lti_course_mappings"("platform_id", "exam_id");
CREATE INDEX "lti_course_mappings_platform_id_idx" ON "lti_course_mappings"("platform_id");
CREATE INDEX "lti_course_mappings_exam_id_idx" ON "lti_course_mappings"("exam_id");
CREATE INDEX "lti_user_links_course_mapping_id_idx" ON "lti_user_links"("course_mapping_id");

-- AddForeignKey
ALTER TABLE "lti_course_mappings" ADD CONSTRAINT "lti_course_mappings_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "lti_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lti_course_mappings" ADD CONSTRAINT "lti_course_mappings_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lti_user_links" ADD CONSTRAINT "lti_user_links_course_mapping_id_fkey" FOREIGN KEY ("course_mapping_id") REFERENCES "lti_course_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
