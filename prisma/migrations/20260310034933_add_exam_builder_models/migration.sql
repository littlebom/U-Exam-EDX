-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "mode" VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    "total_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passing_score" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "settings" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_sections" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exam_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_section_questions" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "points" DOUBLE PRECISION,

    CONSTRAINT "exam_section_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_blueprints" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "difficulty" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "count" INTEGER NOT NULL DEFAULT 1,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "exam_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "registration_deadline" TIMESTAMPTZ,
    "max_candidates" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    "location" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exam_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_accesses" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "access_code" VARCHAR(50),
    "allowed_emails" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exam_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exams_tenant_id_idx" ON "exams"("tenant_id");

-- CreateIndex
CREATE INDEX "exams_tenant_id_status_idx" ON "exams"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "exam_sections_exam_id_idx" ON "exam_sections"("exam_id");

-- CreateIndex
CREATE INDEX "exam_section_questions_section_id_idx" ON "exam_section_questions"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_section_questions_section_id_question_id_key" ON "exam_section_questions"("section_id", "question_id");

-- CreateIndex
CREATE INDEX "exam_blueprints_exam_id_idx" ON "exam_blueprints"("exam_id");

-- CreateIndex
CREATE INDEX "exam_schedules_tenant_id_idx" ON "exam_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "exam_schedules_exam_id_idx" ON "exam_schedules"("exam_id");

-- CreateIndex
CREATE INDEX "exam_schedules_tenant_id_status_idx" ON "exam_schedules"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "exam_accesses_exam_id_idx" ON "exam_accesses"("exam_id");

-- CreateIndex
CREATE INDEX "exam_accesses_access_code_idx" ON "exam_accesses"("access_code");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sections" ADD CONSTRAINT "exam_sections_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_section_questions" ADD CONSTRAINT "exam_section_questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_section_questions" ADD CONSTRAINT "exam_section_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_blueprints" ADD CONSTRAINT "exam_blueprints_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_blueprints" ADD CONSTRAINT "exam_blueprints_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_accesses" ADD CONSTRAINT "exam_accesses_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
