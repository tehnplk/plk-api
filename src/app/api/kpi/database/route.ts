import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const level = searchParams.get('level');
    const kpiType = searchParams.get('kpiType');
    const moneyYear = searchParams.get('moneyYear');

    // Build where clause for kpis table
    let whereClause: any = {};
    
    if (department && department.trim() !== '') {
      whereClause.ssj_department = department.trim();
    }
    
    if (level && level.trim() !== '') {
      whereClause.area_level = level.trim() === 'district' ? 'อำเภอ' : 'จังหวัด';
    }
    
    if (kpiType && kpiType.trim() !== '') {
      whereClause.kpi_type = kpiType.trim();
    }

    // Fetch KPI master data from kpis table
    const kpis = await prisma.kpis.findMany({
      where: whereClause,
      orderBy: [
        { ssj_department: 'asc' },
        { area_level: 'asc' },
        { id: 'asc' }
      ]
    });

    // Get current money year (Buddhist year)
    const currentYear = new Date().getFullYear();
    const currentMoneyYear = moneyYear ? parseInt(moneyYear) : currentYear + 544;

    // Get sum of monthly results and targets from kpi_report for each KPI
    // This matches the modal's summary row calculation: (grandTotal / totalTarget) * divideNumber
    const kpiReportSums = await prisma.kpiReport.groupBy({
      by: ['kpi_id'],
      where: {
        money_year: currentMoneyYear,
      },
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
      _count: {
        kpi_id: true,
      },
    });

    // Create a map for quick lookup - calculate rate same as modal summary row
    const reportRateMap = new Map(
      kpiReportSums.map(report => {
        const sum = report._sum;
        // Sum all monthly results (grandTotal in modal)
        const grandTotal = (sum.result_oct || 0) + (sum.result_nov || 0) + (sum.result_dec || 0) +
                          (sum.result_jan || 0) + (sum.result_feb || 0) + (sum.result_mar || 0) +
                          (sum.result_apr || 0) + (sum.result_may || 0) + (sum.result_jun || 0) +
                          (sum.result_jul || 0) + (sum.result_aug || 0) + (sum.result_sep || 0);
        // Sum all targets (totalTarget in modal)
        const totalTarget = sum.kpi_target || 0;
        
        return [report.kpi_id, { grandTotal, totalTarget, count: report._count.kpi_id }];
      })
    );

    // Transform to match expected format - calculate rate same as modal summary row
    const transformedData = kpis.map(kpi => {
      const reportData = reportRateMap.get(kpi.id);
      let summaryRate: number | null = null;
      
      if (reportData && reportData.totalTarget > 0) {
        // Calculate rate: (grandTotal / totalTarget) * divideNumber
        // Same formula as modal summary row
        const divideNumber = kpi.divide_number || 1;
        summaryRate = Math.round((reportData.grandTotal / reportData.totalTarget) * divideNumber * 100) / 100;
      }
      
      return {
        id: kpi.id,
        name: kpi.name,
        evaluation_criteria: kpi.evaluation_criteria,
        condition: kpi.condition,
        target_result: kpi.target_result,
        divide_number: kpi.divide_number,
        sum_result: summaryRate !== null ? summaryRate.toFixed(2) : null,
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

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      source: 'database',
      moneyYear: currentMoneyYear,
      filters: {
        department,
        level,
        kpiType
      }
    });

  } catch (error) {
    console.error('Error fetching KPI data from database:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch data from database',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, sum_result, grade } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.kpis.update({
      where: { id },
      data: {
        last_synced_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        last_synced_at: updated.last_synced_at,
      },
    });
  } catch (error) {
    console.error('Error updating KPI master data:', error);
    return NextResponse.json(
      { error: 'Failed to update KPI master data' },
      { status: 500 }
    );
  }
}
