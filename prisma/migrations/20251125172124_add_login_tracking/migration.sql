-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_account_user" (
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
    "last_login" DATETIME,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "created_account_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_account_user" ("account_id", "active", "address", "birth_date", "created_account_at", "created_at", "department", "email", "full_name_en", "full_name_th", "hospital_code", "id", "level", "organization", "position", "provider_id", "role", "updated_at") SELECT "account_id", "active", "address", "birth_date", "created_account_at", "created_at", "department", "email", "full_name_en", "full_name_th", "hospital_code", "id", "level", "organization", "position", "provider_id", "role", "updated_at" FROM "account_user";
DROP TABLE "account_user";
ALTER TABLE "new_account_user" RENAME TO "account_user";
CREATE UNIQUE INDEX "account_user_provider_id_key" ON "account_user"("provider_id");
CREATE INDEX "account_user_account_id_idx" ON "account_user"("account_id");
CREATE INDEX "account_user_email_idx" ON "account_user"("email");
CREATE INDEX "account_user_hospital_code_idx" ON "account_user"("hospital_code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
