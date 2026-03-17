-- CreateTable
CREATE TABLE "proctoring_sessions" (
    "id" UUID NOT NULL,
    "exam_session_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'MONITORING',
    "webcam_enabled" BOOLEAN NOT NULL DEFAULT false,
    "screen_share_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "proctoring_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proctoring_events" (
    "id" UUID NOT NULL,
    "proctoring_session_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "severity" VARCHAR(10) NOT NULL DEFAULT 'LOW',
    "screenshot" VARCHAR(500),
    "metadata" JSONB,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proctoring_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "proctoring_session_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "description" TEXT NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "created_by_id" UUID NOT NULL,
    "resolved_at" TIMESTAMPTZ,
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proctoring_sessions_exam_session_id_key" ON "proctoring_sessions"("exam_session_id");

-- CreateIndex
CREATE INDEX "proctoring_sessions_status_idx" ON "proctoring_sessions"("status");

-- CreateIndex
CREATE INDEX "proctoring_events_proctoring_session_id_idx" ON "proctoring_events"("proctoring_session_id");

-- CreateIndex
CREATE INDEX "proctoring_events_type_idx" ON "proctoring_events"("type");

-- CreateIndex
CREATE INDEX "proctoring_events_severity_idx" ON "proctoring_events"("severity");

-- CreateIndex
CREATE INDEX "incidents_proctoring_session_id_idx" ON "incidents"("proctoring_session_id");

-- CreateIndex
CREATE INDEX "incidents_type_idx" ON "incidents"("type");

-- AddForeignKey
ALTER TABLE "proctoring_sessions" ADD CONSTRAINT "proctoring_sessions_exam_session_id_fkey" FOREIGN KEY ("exam_session_id") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_events" ADD CONSTRAINT "proctoring_events_proctoring_session_id_fkey" FOREIGN KEY ("proctoring_session_id") REFERENCES "proctoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_proctoring_session_id_fkey" FOREIGN KEY ("proctoring_session_id") REFERENCES "proctoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
