-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "evaluation_criteria" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "target_result" REAL NOT NULL,
    "divide_number" REAL NOT NULL,
    "sum_result" TEXT,
    "excellence" TEXT NOT NULL,
    "area_level" TEXT NOT NULL,
    "ssj_department" TEXT NOT NULL,
    "ssj_pm" TEXT,
    "moph_department" TEXT,
    "kpi_type" TEXT NOT NULL,
    "grade" TEXT,
    "template_url" TEXT,
    "last_synced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "kpi_report" (
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
    "status" TEXT,
    "updated_at" DATETIME NOT NULL,

    PRIMARY KEY ("money_year", "area_name", "kpi_id")
);

-- CreateIndex
CREATE INDEX "kpis_ssj_department_area_level_idx" ON "kpis"("ssj_department", "area_level");

-- CreateIndex
CREATE INDEX "kpis_kpi_type_idx" ON "kpis"("kpi_type");
