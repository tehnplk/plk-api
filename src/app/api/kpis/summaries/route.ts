import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kpiIds, moneyYear } = body;

    if (!Array.isArray(kpiIds) || kpiIds.length === 0) {
      return NextResponse.json({ error: 'kpiIds must be a non-empty array' }, { status: 400 });
    }

    if (!moneyYear || typeof moneyYear !== 'number') {
      return NextResponse.json({ error: 'moneyYear is required and must be a number' }, { status: 400 });
    }

    // Fetch all KPI summaries in a single query
    const reports = await prisma.kpiReport.findMany({
      where: {
        kpi_id: { in: kpiIds },
        money_year: moneyYear,
      },
      select: {
        kpi_id: true,
        area_name: true,
        kpi_name: true,
        kpi_target: true,
        sum_result: true,
        rate: true,
        updated_at: true,
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
      },
    });

    // Group reports by kpi_id
    const groupedReports = reports.reduce((acc, report) => {
      if (!acc[report.kpi_id]) {
        acc[report.kpi_id] = [];
      }
      acc[report.kpi_id].push(report);
      return acc;
    }, {} as Record<string, typeof reports>);

    // Calculate summaries for each KPI
    const results = kpiIds.map(kpiId => {
      try {
        const kpiReports = groupedReports[kpiId] || [];
        
        if (kpiReports.length === 0) {
          return {
            kpiId,
            data: null,
            error: null,
          };
        }

        // Calculate totals and rate
        let grandTotal = 0;
        let targetTotal = 0;
        let lastUpdated: Date | null = null;

        const monthFields = [
          'result_oct', 'result_nov', 'result_dec', 'result_jan',
          'result_feb', 'result_mar', 'result_apr', 'result_may',
          'result_jun', 'result_jul', 'result_aug', 'result_sep'
        ];

        for (const row of kpiReports) {
          const t = Number(row.kpi_target ?? 0);
          if (!Number.isNaN(t)) targetTotal += t;

          for (const field of monthFields) {
            const v = Number(row[field] ?? 0);
            if (!Number.isNaN(v)) grandTotal += v;
          }

          if (row.updated_at) {
            const d = new Date(row.updated_at);
            if (!Number.isNaN(d.getTime())) {
              if (!lastUpdated || d > lastUpdated) {
                lastUpdated = d;
              }
            }
          }
        }

        // Calculate rate (assuming divideNumber is 1 for batch endpoint)
        const divideNumber = 1;
        let rate: string | null = null;
        if (targetTotal > 0) {
          const calculatedRate = (grandTotal / targetTotal) * divideNumber;
          rate = calculatedRate.toFixed(2);
        }

        return {
          kpiId,
          data: {
            rate: rate ? parseFloat(rate) : null,
            lastUpdated: lastUpdated?.toISOString() || null,
          },
          error: null,
        };
      } catch (error) {
        console.error(`Error calculating summary for KPI ${kpiId}:`, error);
        return {
          kpiId,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in batch KPI summaries endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
