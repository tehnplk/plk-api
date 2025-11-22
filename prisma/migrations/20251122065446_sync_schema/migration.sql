-- CreateTable
CREATE TABLE "kpi_report" (
    "money_year" INTEGER NOT NULL,
    "area_name" TEXT NOT NULL,
    "kpi_id" TEXT NOT NULL,
    "kpi_name" TEXT NOT NULL,
    "kpi_tarket" REAL,
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
    "update_at" DATETIME NOT NULL,

    PRIMARY KEY ("money_year", "area_name", "kpi_id")
);
