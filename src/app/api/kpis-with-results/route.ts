import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MONTH_FIELDS = [
  'result_oct',
  'result_nov',
  'result_dec',
  'result_jan',
  'result_feb',
  'result_mar',
  'result_apr',
  'result_may',
  'result_jun',
  'result_jul',
  'result_aug',
  'result_sep',
] as const;

// Calculate aggregate rate from monthly results
function calculateAggregateRate(report: any): number | null {
  const monthlyValues = MONTH_FIELDS
    .map(field => report[field])
    .filter(val => val !== null && val !== undefined && !isNaN(Number(val)))
    .map(val => Number(val));

  if (monthlyValues.length === 0) return null;
  
  // Calculate average of available monthly values
  const sum = monthlyValues.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / monthlyValues.length) * 100) / 100; // Round to 2 decimal places
}

// Determine status based on target and result
function calculateStatus(result: number | null, target: number | null): 'pass' | 'fail' | 'pending' {
  if (result === null || target === null) return 'pending';
  return result >= target ? 'pass' : 'fail';
}

export async function GET(request: Request) {
  const baseUrl = process.env.ENDPOINT_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { error: 'ENDPOINT_URL is not configured' },
      { status: 500 },
    );
  }

  try {
    // Get moneyYear from query parameter or use default
    const { searchParams } = new URL(request.url);
    const moneyYearParam = searchParams.get('moneyYear');
    const moneyYear = moneyYearParam ? Number(moneyYearParam) : 2569;

    // Fetch KPI metadata from Google Apps Script
    console.log('Fetching KPI data from Google Apps Script...');
    const upstreamUrl = `${baseUrl}?sheet=kpi`;
    const res = await fetch(upstreamUrl);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: HTTP ${res.status}` },
        { status: 502 },
      );
    }

    const kpiData = await res.json();
    const kpiRows = Array.isArray(kpiData) ? kpiData : kpiData.data ?? [];

    // Fetch results from database for all KPIs
    console.log('Fetching results from database...');
    const reports = await prisma.kpiReport.findMany({
      where: {
        money_year: moneyYear,
      },
    });

    // Group reports by KPI ID and area
    const reportsByKpiAndArea = new Map<string, any>();
    reports.forEach((report: any) => {
      const key = `${report.kpi_id}-${report.area_name}`;
      reportsByKpiAndArea.set(key, report);
    });

    // Merge KPI data with results
    const mergedData = kpiRows.map((kpi: any) => {
      // For province-level KPIs, aggregate across all districts
      // For district-level KPIs, show individual district results
      const areaLevel = kpi.area_level ?? 'จังหวัด';
      
      if (areaLevel === 'จังหวัด') {
        // Aggregate across all districts for province-level KPIs
        const districtReports = Array.from(reportsByKpiAndArea.values())
          .filter(report => report.kpi_id === kpi.id && report.area_name !== 'จังหวัด');
        
        if (districtReports.length > 0) {
          const aggregateRate = calculateAggregateRate({
            // Create a synthetic report with averages across districts
            ...MONTH_FIELDS.reduce((acc, field) => {
              const values = districtReports
                .map(report => report[field])
                .filter(val => val !== null && val !== undefined && !isNaN(Number(val)))
                .map(val => Number(val));
              
              if (values.length > 0) {
                acc[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
              } else {
                acc[field] = null;
              }
              
              return acc;
            }, {} as any)
          });
          
          const status = calculateStatus(aggregateRate, kpi.target_result);
          
          return {
            ...kpi,
            result: aggregateRate,
            status,
            lastUpdated: districtReports[0]?.updated_at?.toISOString() || null,
          };
        }
      } else {
        // For district-level KPIs, we'll return the KPI without results
        // The table will show individual district results when filtered
        return {
          ...kpi,
          result: null,
          status: 'pending' as const,
          lastUpdated: null,
        };
      }
      
      return {
        ...kpi,
        result: null,
        status: 'pending' as const,
        lastUpdated: null,
      };
    });

    console.log(`Merged ${mergedData.length} KPIs with results`);

    return NextResponse.json({
      data: mergedData,
      moneyYear,
      hasResults: reports.length > 0,
    });
  } catch (err: any) {
    console.error('Error fetching KPI data with results:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch data' },
      { status: 500 },
    );
  }
}