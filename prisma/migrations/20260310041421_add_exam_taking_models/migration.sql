-- CreateTable
CREATE TABLE "exam_sessions" (
    "id" UUID NOT NULL,
    "exam_schedule_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMPTZ,
    "submitted_at" TIMESTAMPTZ,
    "time_remaining" INTEGER,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_answers" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer" JSONB,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "answered_at" TIMESTAMPTZ,
    "time_spent" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exam_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_events" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_sessions_exam_schedule_id_idx" ON "exam_sessions"("exam_schedule_id");

-- CreateIndex
CREATE INDEX "exam_sessions_candidate_id_idx" ON "exam_sessions"("candidate_id");

-- CreateIndex
CREATE INDEX "exam_sessions_status_idx" ON "exam_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_sessions_exam_schedule_id_candidate_id_key" ON "exam_sessions"("exam_schedule_id", "candidate_id");

-- CreateIndex
CREATE INDEX "exam_answers_session_id_idx" ON "exam_answers"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_answers_session_id_question_id_key" ON "exam_answers"("session_id", "question_id");

-- CreateIndex
CREATE INDEX "exam_events_session_id_idx" ON "exam_events"("session_id");

-- CreateIndex
CREATE INDEX "exam_events_session_id_type_idx" ON "exam_events"("session_id", "type");

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_exam_schedule_id_fkey" FOREIGN KEY ("exam_schedule_id") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_events" ADD CONSTRAINT "exam_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
