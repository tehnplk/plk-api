'use server';

import { prisma } from '@/lib/prisma';
import { getStatusFromCondition } from '@/utils/conditionEvaluator';

export interface DashboardKPI {
  id: string;
  name: string | null;
  evaluation_criteria: string | null;
  condition: string | null;
  target_result: number | null;
  divide_number: number | null;
  sum_result: string | null;
  rate: number | null;
  status: 'pass' | 'fail' | 'pending';
  excellence: string | null;
  area_level: string | null;
  ssj_department: string | null;
  ssj_pm: string | null;
  moph_department: string | null;
  kpi_type: string | null;
  template_url: string | null;
  last_synced_at: Date | null;
}

export interface DashboardStats {
  total: number;
  pass: number;
  fail: number;
  pending: number;
  percentPass: string;
}

export interface DashboardResult {
  success: boolean;
  data: DashboardKPI[];
  stats: DashboardStats;
  excellenceStats: Record<string, { total: number; pass: number; fail: number; pending: number }>;
  count: number;
  moneyYear: number;
  error?: string;
}

// Server Action สำหรับ Dashboard - คำนวณสถานะจาก kpi_report โดยใช้ SUM และ GROUP BY kpi_id
export async function getDashboardData(
  moneyYear?: number,
  areaName?: string
): Promise<DashboardResult> {
  try {
    // Get current money year (Buddhist year)
    const currentYear = new Date().getFullYear();
    const currentMoneyYear = moneyYear ?? currentYear + 544;

    // Build where clause for kpi_report
    const reportWhereClause: any = {
      money_year: currentMoneyYear,
    };

    // Build where clause for kpis
    const kpiWhereClause: any = {};

    // ถ้าระบุ areaName ให้กรองเฉพาะอำเภอนั้น และเฉพาะ KPI ระดับอำเภอ
    if (areaName && areaName.trim() !== '' && areaName !== 'ALL') {
      reportWhereClause.area_name = areaName.trim();
      kpiWhereClause.area_level = 'อำเภอ';
    }

    // Fetch all KPIs with their metadata
    const kpis = await prisma.kpis.findMany({
      where: kpiWhereClause,
      orderBy: [
        { ssj_department: 'asc' },
        { area_level: 'asc' },
        { id: 'asc' }
      ]
    });

    // Get aggregated data from kpi_report grouped by kpi_id
    // SUM all monthly results and kpi_target for each KPI
    const kpiReportSums = await prisma.kpiReport.groupBy({
      by: ['kpi_id'],
      where: reportWhereClause,
      _sum: {
        result_oct: true,
        result_nov: true,
        result_dec: true,
        result_jan: true,
        result_feb: true,
        result_mar: true,
        result_apr: true,
        result_may: true,
        result_jun: true,
        result_jul: true,
        result_aug: true,
        result_sep: true,
        kpi_target: true,
      },
    });

    // Create a map for quick lookup
    const reportSumMap = new Map(
      kpiReportSums.map(report => {
        const sum = report._sum;
        // Sum all monthly results (grandTotal)
        const grandTotal = (sum.result_oct || 0) + (sum.result_nov || 0) + (sum.result_dec || 0) +
                          (sum.result_jan || 0) + (sum.result_feb || 0) + (sum.result_mar || 0) +
                          (sum.result_apr || 0) + (sum.result_may || 0) + (sum.result_jun || 0) +
                          (sum.result_jul || 0) + (sum.result_aug || 0) + (sum.result_sep || 0);
        // Sum all targets (totalTarget)
        const totalTarget = sum.kpi_target || 0;
        
        return [report.kpi_id, { grandTotal, totalTarget }];
      })
    );

    // Calculate status for each KPI using the same logic as KPIDetailModal
    const transformedData: DashboardKPI[] = kpis.map(kpi => {
      const reportData = reportSumMap.get(kpi.id);
      
      // Default values
      let rate: number | null = null;
      let status: 'pass' | 'fail' | 'pending' = 'pending';

      if (reportData && reportData.totalTarget > 0) {
        // Calculate rate: (grandTotal / totalTarget) * divideNumber
        // Same formula as KPIDetailModal summary row
        const divideNumber = kpi.divide_number || 1;
        rate = Math.round((reportData.grandTotal / reportData.totalTarget) * divideNumber * 100) / 100;

        // Calculate status using same conditions as KPIDetailModal
        const conditionStr = (kpi.condition ?? '').toString().trim();
        const targetForStatus = kpi.target_result;

        if (
          conditionStr &&
          targetForStatus !== null &&
          targetForStatus !== undefined &&
          !Number.isNaN(Number(targetForStatus))
        ) {
          status = getStatusFromCondition(
            conditionStr,
            Number(targetForStatus),
            rate
          );
        }
      }

      return {
        id: kpi.id,
        name: kpi.name,
        evaluation_criteria: kpi.evaluation_criteria,
        condition: kpi.condition,
        target_result: kpi.target_result,
        divide_number: kpi.divide_number,
        sum_result: rate !== null ? rate.toFixed(2) : null,
        rate,
        status,
        excellence: kpi.excellence,
        area_level: kpi.area_level,
        ssj_department: kpi.ssj_department,
        ssj_pm: kpi.ssj_pm,
        moph_department: kpi.moph_department,
        kpi_type: kpi.kpi_type,
        template_url: kpi.template_url,
        last_synced_at: kpi.last_synced_at,
      };
    });

    // Calculate summary stats
    const total = transformedData.length;
    const passCount = transformedData.filter(kpi => kpi.status === 'pass').length;
    const failCount = transformedData.filter(kpi => kpi.status === 'fail').length;
    const pendingCount = transformedData.filter(kpi => kpi.status === 'pending').length;
    const percentPass = total > 0 ? ((passCount / total) * 100).toFixed(1) : '0.0';

    // Calculate excellence stats
    const excellenceMap: Record<string, { total: number; pass: number; fail: number; pending: number }> = {};
    transformedData.forEach(kpi => {
      const exc = kpi.excellence || 'อื่นๆ';
      if (!excellenceMap[exc]) {
        excellenceMap[exc] = { total: 0, pass: 0, fail: 0, pending: 0 };
      }
      excellenceMap[exc].total++;
      if (kpi.status === 'pass') excellenceMap[exc].pass++;
      else if (kpi.status === 'fail') excellenceMap[exc].fail++;
      else excellenceMap[exc].pending++;
    });

    return {
      success: true,
      data: transformedData,
      stats: {
        total,
        pass: passCount,
        fail: failCount,
        pending: pendingCount,
        percentPass,
      },
      excellenceStats: excellenceMap,
      count: transformedData.length,
      moneyYear: currentMoneyYear,
    };

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      success: false,
      data: [],
      stats: { total: 0, pass: 0, fail: 0, pending: 0, percentPass: '0.0' },
      excellenceStats: {},
      count: 0,
      moneyYear: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
