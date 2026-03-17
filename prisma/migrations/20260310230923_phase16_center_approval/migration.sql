-- CreateTable
CREATE TABLE "center_approvals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "test_center_id" UUID NOT NULL,
    "reviewed_by_id" UUID,
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "checklist" JSONB,
    "documents" JSONB,
    "expires_at" TIMESTAMPTZ,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "center_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "center_approvals_tenant_id_idx" ON "center_approvals"("tenant_id");

-- CreateIndex
CREATE INDEX "center_approvals_test_center_id_idx" ON "center_approvals"("test_center_id");

-- CreateIndex
CREATE INDEX "center_approvals_status_idx" ON "center_approvals"("status");

-- AddForeignKey
ALTER TABLE "center_approvals" ADD CONSTRAINT "center_approvals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_approvals" ADD CONSTRAINT "center_approvals_test_center_id_fkey" FOREIGN KEY ("test_center_id") REFERENCES "test_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_approvals" ADD CONSTRAINT "center_approvals_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
