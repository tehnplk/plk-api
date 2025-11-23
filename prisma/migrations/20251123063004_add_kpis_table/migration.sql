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
    "is_moph_kpi" TEXT NOT NULL,
    "last_synced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "kpis_ssj_department_area_level_idx" ON "kpis"("ssj_department", "area_level");
