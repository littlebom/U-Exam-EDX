-- CreateTable
CREATE TABLE "lti_platforms" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "issuer" VARCHAR(500) NOT NULL,
    "client_id" VARCHAR(200) NOT NULL,
    "deployment_id" VARCHAR(50) NOT NULL DEFAULT '1',
    "auth_login_url" VARCHAR(500) NOT NULL,
    "auth_token_url" VARCHAR(500) NOT NULL,
    "jwks_url" VARCHAR(500) NOT NULL,
    "public_key" TEXT NOT NULL,
    "private_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lti_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lti_user_links" (
    "id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lti_user_id" VARCHAR(500) NOT NULL,
    "lti_email" VARCHAR(300),
    "lti_name" VARCHAR(300),
    "lineitem_url" TEXT,
    "resource_link_id" VARCHAR(500),
    "context_id" VARCHAR(500),
    "context_title" VARCHAR(500),
    "linked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lti_user_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lti_launch_logs" (
    "id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "user_id" UUID,
    "lti_user_id" VARCHAR(500),
    "action" VARCHAR(50) NOT NULL,
    "detail" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lti_launch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lti_platforms_tenant_id_idx" ON "lti_platforms"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "lti_platforms_tenant_id_client_id_key" ON "lti_platforms"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "lti_user_links_user_id_idx" ON "lti_user_links"("user_id");

-- CreateIndex
CREATE INDEX "lti_user_links_platform_id_idx" ON "lti_user_links"("platform_id");

-- CreateIndex
CREATE UNIQUE INDEX "lti_user_links_platform_id_lti_user_id_key" ON "lti_user_links"("platform_id", "lti_user_id");

-- CreateIndex
CREATE INDEX "lti_launch_logs_platform_id_created_at_idx" ON "lti_launch_logs"("platform_id", "created_at");

-- CreateIndex
CREATE INDEX "lti_launch_logs_user_id_idx" ON "lti_launch_logs"("user_id");

-- AddForeignKey
ALTER TABLE "lti_platforms" ADD CONSTRAINT "lti_platforms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lti_user_links" ADD CONSTRAINT "lti_user_links_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "lti_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lti_user_links" ADD CONSTRAINT "lti_user_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lti_launch_logs" ADD CONSTRAINT "lti_launch_logs_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "lti_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lti_launch_logs" ADD CONSTRAINT "lti_launch_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
