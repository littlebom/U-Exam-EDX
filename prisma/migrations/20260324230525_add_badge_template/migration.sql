-- AlterTable
ALTER TABLE "digital_badges" ADD COLUMN     "badge_template_id" UUID,
ADD COLUMN     "grade_id" UUID,
ADD COLUMN     "user_id" UUID,
ALTER COLUMN "certificate_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "badge_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "min_score" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "badge_color" VARCHAR(20) NOT NULL DEFAULT '#FFD700',
    "badge_icon" VARCHAR(50) NOT NULL DEFAULT 'trophy',
    "badge_label" VARCHAR(50) NOT NULL DEFAULT 'CERTIFIED',
    "exam_id" UUID,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "badge_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "badge_templates" ADD CONSTRAINT "badge_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_templates" ADD CONSTRAINT "badge_templates_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_badges" ADD CONSTRAINT "digital_badges_badge_template_id_fkey" FOREIGN KEY ("badge_template_id") REFERENCES "badge_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_badges" ADD CONSTRAINT "digital_badges_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_badges" ADD CONSTRAINT "digital_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
