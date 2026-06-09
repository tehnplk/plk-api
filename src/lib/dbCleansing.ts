import { prisma } from '@/lib/prisma';

type DbCleansingResult = {
  deleted_duplicates: {
    kpis: number;
    kpi_report: number;
  };
  deleted_invalid_area: {
    kpi_report: number;
  };
  updated: {
    kpis: number;
    kpi_report: number;
  };
};

export async function runDbCleansing(): Promise<DbCleansingResult> {
  const [
    kpisDeletedDuplicates,
    kpiReportDeletedDuplicates,
    invalidDistrictProvinceReportsDeleted,
    kpisUpdated,
    kpiReportUpdated,
  ] =
    await prisma.$transaction([
      prisma.$executeRaw`
        DELETE FROM kpis
        WHERE EXISTS (
          SELECT 1
          FROM kpis k2
          WHERE TRIM(k2.id) = TRIM(kpis.id)
            AND (
              k2.updated_at > kpis.updated_at
              OR (k2.updated_at = kpis.updated_at AND k2.id < kpis.id)
            )
        )
      `,
      prisma.$executeRaw`
        DELETE FROM kpi_report
        WHERE EXISTS (
          SELECT 1
          FROM kpi_report r2
          WHERE r2.money_year = kpi_report.money_year
            AND r2.area_name = kpi_report.area_name
            AND TRIM(r2.kpi_id) = TRIM(kpi_report.kpi_id)
            AND (
              r2.updated_at > kpi_report.updated_at
              OR (r2.updated_at = kpi_report.updated_at AND r2.kpi_id < kpi_report.kpi_id)
            )
        )
      `,
      prisma.$executeRaw`
        DELETE r
        FROM kpi_report r
        INNER JOIN kpis k ON k.id = r.kpi_id
        WHERE k.area_level = 'อำเภอ'
          AND r.area_name = 'จังหวัดพิษณุโลก'
      `,
      prisma.$executeRaw`UPDATE kpis SET id = TRIM(id) WHERE id != TRIM(id)`,
      prisma.$executeRaw`UPDATE kpi_report SET kpi_id = TRIM(kpi_id) WHERE kpi_id != TRIM(kpi_id)`,
    ]);

  return {
    deleted_duplicates: {
      kpis: Number(kpisDeletedDuplicates ?? 0),
      kpi_report: Number(kpiReportDeletedDuplicates ?? 0),
    },
    deleted_invalid_area: {
      kpi_report: Number(invalidDistrictProvinceReportsDeleted ?? 0),
    },
    updated: {
      kpis: Number(kpisUpdated ?? 0),
      kpi_report: Number(kpiReportUpdated ?? 0),
    },
  };
}
