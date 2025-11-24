/*
  Warnings:

  - You are about to drop the column `update_at` on the `kpi_report` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `kpi_report` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_kpi_report" (
    "money_year" INTEGER NOT NULL,
    "area_name" TEXT NOT NULL,
    "kpi_id" TEXT NOT NULL,
    "kpi_name" TEXT NOT NULL,
    "kpi_target" REAL,
    "result_oct" REAL,
    "result_nov" REAL,
    "result_dec" REAL,
    "result_jan" REAL,
    "result_feb" REAL,
    "result_mar" REAL,
    "result_apr" REAL,
    "result_may" REAL,
    "result_jun" REAL,
    "result_jul" REAL,
    "result_aug" REAL,
    "result_sep" REAL,
    "sum_result" TEXT,
    "rate" REAL,
    "updated_at" DATETIME NOT NULL,

    PRIMARY KEY ("money_year", "area_name", "kpi_id")
);
INSERT INTO "new_kpi_report" ("area_name", "kpi_id", "kpi_name", "kpi_target", "money_year", "rate", "result_apr", "result_aug", "result_dec", "result_feb", "result_jan", "result_jul", "result_jun", "result_mar", "result_may", "result_nov", "result_oct", "result_sep", "sum_result", "updated_at") SELECT "area_name", "kpi_id", "kpi_name", "kpi_target", "money_year", "rate", "result_apr", "result_aug", "result_dec", "result_feb", "result_jan", "result_jul", "result_jun", "result_mar", "result_may", "result_nov", "result_oct", "result_sep", "sum_result", "update_at" FROM "kpi_report";
DROP TABLE "kpi_report";
ALTER TABLE "new_kpi_report" RENAME TO "kpi_report";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
