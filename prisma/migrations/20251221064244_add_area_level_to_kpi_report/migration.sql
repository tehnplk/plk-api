/*
  Warnings:

  - The primary key for the `account_user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `account_user` table. All the data in the column will be lost.
  - You are about to drop the column `birth_date` on the `account_user` table. All the data in the column will be lost.
  - You are about to drop the column `hospital_code` on the `account_user` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `account_user` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `account_user` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `account_user` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- AlterTable
ALTER TABLE "kpi_report" ADD COLUMN "area_level" TEXT;

-- CreateTable
CREATE TABLE "department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "activate" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_account_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "full_name_th" TEXT NOT NULL,
    "full_name_en" TEXT,
    "email" TEXT,
    "organization" TEXT,
    "department" TEXT DEFAULT '',
    "role" TEXT DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "last_login" DATETIME,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "created_account_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_account_user" ("account_id", "active", "created_account_at", "created_at", "department", "email", "full_name_en", "full_name_th", "id", "last_login", "login_count", "organization", "provider_id", "role", "updated_at") SELECT "account_id", "active", "created_account_at", "created_at", "department", "email", "full_name_en", "full_name_th", "id", "last_login", "login_count", "organization", "provider_id", "role", "updated_at" FROM "account_user";
DROP TABLE "account_user";
ALTER TABLE "new_account_user" RENAME TO "account_user";
CREATE UNIQUE INDEX "account_user_provider_id_key" ON "account_user"("provider_id");
CREATE INDEX "account_user_account_id_idx" ON "account_user"("account_id");
CREATE INDEX "account_user_email_idx" ON "account_user"("email");
CREATE INDEX "account_user_provider_id_active_idx" ON "account_user"("provider_id", "active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "department_name_key" ON "department"("name");
