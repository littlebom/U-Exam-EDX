-- CreateTable
CREATE TABLE "ewallet_connections" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "api_url" VARCHAR(500) NOT NULL,
    "api_key" VARCHAR(500) NOT NULL,
    "api_secret" VARCHAR(500) NOT NULL,
    "webhook_secret" VARCHAR(500) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ewallet_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ewallet_transactions" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "external_transaction_id" VARCHAR(255),
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'THB',
    "metadata" JSONB,
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ewallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ewallet_connections_tenant_id_key" ON "ewallet_connections"("tenant_id");

-- CreateIndex
CREATE INDEX "ewallet_transactions_payment_id_idx" ON "ewallet_transactions"("payment_id");

-- CreateIndex
CREATE INDEX "ewallet_transactions_external_transaction_id_idx" ON "ewallet_transactions"("external_transaction_id");

-- CreateIndex
CREATE INDEX "ewallet_transactions_status_idx" ON "ewallet_transactions"("status");

-- AddForeignKey
ALTER TABLE "ewallet_connections" ADD CONSTRAINT "ewallet_connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewallet_transactions" ADD CONSTRAINT "ewallet_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
