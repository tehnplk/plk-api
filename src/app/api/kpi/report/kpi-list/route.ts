import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// TEAM_001: Provide district-scoped KPI list using kpi_report joined with kpis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moneyYearParam = searchParams.get('moneyYear');
    const areaName = searchParams.get('areaName');
    const department = searchParams.get('department');
    const kpiType = searchParams.get('kpiType');

    if (!moneyYearParam || !areaName) {
      return NextResponse.json(
        { success: false, error: 'moneyYear and areaName are required' },
        { status: 400 },
      );
    }

    const moneyYear = parseInt(moneyYearParam, 10);
    if (Number.isNaN(moneyYear)) {
      return NextResponse.json(
        { success: false, error: 'moneyYear must be a number' },
        { status: 400 },
      );
    }

    const kpiWhere: any = {
      area_level: 'อำเภอ',
    };

    if (department && department.trim() !== '') {
      kpiWhere.ssj_department = department.trim();
    }

    if (kpiType && kpiType.trim() !== '') {
      kpiWhere.kpi_type = kpiType.trim();
    }

    const kpis = await prisma.kpis.findMany({
      where: kpiWhere,
      orderBy: [
        { ssj_department: 'asc' },
        { id: 'asc' },
      ],
    });

    const kpiIds = kpis.map((k) => k.id);

    let reports: any[] = [];
    if (kpiIds.length > 0) {
      reports = await prisma.kpiReport.findMany({
        where: {
          money_year: moneyYear,
          area_name: areaName,
          kpi_id: { in: kpiIds },
        },
      });
    }

    const reportMap = new Map<string, (typeof reports)[number]>();
    for (const r of reports) {
      reportMap.set(r.kpi_id, r);
    }

    const transformedData = kpis.map((kpi) => {
      const report = reportMap.get(kpi.id);

      // Prefer rate as the main performance value; fall back to sum_result if needed
      let sumResult: string | null = null;
      if (report) {
        if (report.rate !== null && report.rate !== undefined) {
          sumResult = String(report.rate);
        } else if (report.sum_result !== null && report.sum_result !== undefined) {
          sumResult = String(report.sum_result);
        }
      }

      const lastSyncedAt = report?.updated_at ?? kpi.last_synced_at;

      return {
        id: kpi.id,
        name: kpi.name,
        evaluation_criteria: kpi.evaluation_criteria,
        condition: kpi.condition,
        target_result: kpi.target_result,
        divide_number: kpi.divide_number,
        sum_result: sumResult,
        excellence: kpi.excellence,
        area_level: kpi.area_level,
        ssj_department: kpi.ssj_department,
        ssj_pm: kpi.ssj_pm,
        moph_department: kpi.moph_department,
        kpi_type: kpi.kpi_type,
        grade: kpi.grade,
        template_url: kpi.template_url,
        last_synced_at: lastSyncedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      source: 'kpi_report',
      filters: {
        moneyYear,
        areaName,
        department,
        kpiType,
      },
    });
  } catch (error) {
    console.error('Error fetching KPI list from kpi_report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch KPI list from kpi_report',
        message: String(error),
      },
      { status: 500 },
    );
  }
}
