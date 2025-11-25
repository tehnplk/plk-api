-- CreateTable
CREATE TABLE "account_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "full_name_th" TEXT NOT NULL,
    "full_name_en" TEXT,
    "email" TEXT,
    "birth_date" DATETIME,
    "position" TEXT,
    "role" TEXT,
    "department" TEXT,
    "level" TEXT,
    "organization" TEXT,
    "hospital_code" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_account_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "account_user_provider_id_key" ON "account_user"("provider_id");

-- CreateIndex
CREATE INDEX "account_user_account_id_idx" ON "account_user"("account_id");

-- CreateIndex
CREATE INDEX "account_user_email_idx" ON "account_user"("email");

-- CreateIndex
CREATE INDEX "account_user_hospital_code_idx" ON "account_user"("hospital_code");
