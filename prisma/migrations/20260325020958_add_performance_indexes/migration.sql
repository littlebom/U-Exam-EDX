-- CreateIndex
CREATE INDEX "exam_sessions_candidate_id_status_idx" ON "exam_sessions"("candidate_id", "status");

-- CreateIndex
CREATE INDEX "grade_answers_grade_id_is_auto_graded_idx" ON "grade_answers"("grade_id", "is_auto_graded");

-- CreateIndex
CREATE INDEX "grades_tenant_id_status_percentage_idx" ON "grades"("tenant_id", "status", "percentage");
