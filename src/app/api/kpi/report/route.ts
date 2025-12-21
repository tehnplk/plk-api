import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getStatusFromCondition } from '@/utils/conditionEvaluator';

export async function POST(request: NextRequest) {
  try {
    const { moneyYear, kpiId, kpiName, divisionNumber, editableData } = await request.json();

    if (!moneyYear || !kpiId || !editableData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Load KPI metadata for condition/target to compute status
    const kpiMeta = await prisma.kpis.findUnique({
      where: { id: kpiId },
      select: {
        condition: true,
        target_result: true,
        area_level: true,
      },
    });

    // Prepare data for database (DB only; sync to sheet is handled in a separate endpoint)
    const savePromises = Object.entries(editableData).map(async ([areaName, data]: [string, any]) => {
      const target = parseFloat(data.target) || null;
      const monthlyResults = [
        parseFloat(data.result_oct) || null,
        parseFloat(data.result_nov) || null,
        parseFloat(data.result_dec) || null,
        parseFloat(data.result_jan) || null,
        parseFloat(data.result_feb) || null,
        parseFloat(data.result_mar) || null,
        parseFloat(data.result_apr) || null,
        parseFloat(data.result_may) || null,
        parseFloat(data.result_jun) || null,
        parseFloat(data.result_jul) || null,
        parseFloat(data.result_aug) || null,
        parseFloat(data.result_sep) || null,
      ];
      const total = monthlyResults.reduce((sum: number, val) => sum + (val || 0), 0);
      
      // Calculate rate
      let rate = 0; // Default to 0 instead of null
      if (target !== null && target !== undefined && target > 0) {
        const divideNumber = divisionNumber || 1;
        rate = Math.round((total / target) * divideNumber * 100) / 100;
      }

      // Compute evaluation status using same logic as KPITable
      let statusCode: 'pass' | 'fail' | 'pending' = 'pending';
      const conditionStr = (kpiMeta?.condition ?? '').toString().trim();
      const targetForStatus = kpiMeta?.target_result;

      if (
        target !== null &&
        target !== undefined &&
        target > 0 &&
        conditionStr &&
        targetForStatus !== null &&
        targetForStatus !== undefined &&
        !Number.isNaN(Number(targetForStatus))
      ) {
        statusCode = getStatusFromCondition(
          conditionStr,
          Number(targetForStatus),
          rate,
        );
      }

      const status =
        statusCode === 'pass'
          ? 'ผ่าน'
          : statusCode === 'fail'
            ? 'ไม่ผ่าน'
            : 'รอประเมิน';
      
      // Upsert data to KpiReport table
      return prisma.kpiReport.upsert({
        where: {
          money_year_area_name_kpi_id: {
            money_year: moneyYear,
            area_name: areaName,
            kpi_id: kpiId
          }
        },
        update: {
          kpi_name: kpiName || '',
          area_level: kpiMeta?.area_level ?? null,
          kpi_target: target,
          result_oct: monthlyResults[0],
          result_nov: monthlyResults[1],
          result_dec: monthlyResults[2],
          result_jan: monthlyResults[3],
          result_feb: monthlyResults[4],
          result_mar: monthlyResults[5],
          result_apr: monthlyResults[6],
          result_may: monthlyResults[7],
          result_jun: monthlyResults[8],
          result_jul: monthlyResults[9],
          result_aug: monthlyResults[10],
          result_sep: monthlyResults[11],
          sum_result: total > 0 ? total.toString() : null,
          rate: rate, // rate is now never null
          status,
        },
        create: {
          money_year: moneyYear,
          area_name: areaName,
          kpi_id: kpiId,
          kpi_name: kpiName || '',
          area_level: kpiMeta?.area_level ?? null,
          kpi_target: target,
          result_oct: monthlyResults[0],
          result_nov: monthlyResults[1],
          result_dec: monthlyResults[2],
          result_jan: monthlyResults[3],
          result_feb: monthlyResults[4],
          result_mar: monthlyResults[5],
          result_apr: monthlyResults[6],
          result_may: monthlyResults[7],
          result_jun: monthlyResults[8],
          result_jul: monthlyResults[9],
          result_aug: monthlyResults[10],
          result_sep: monthlyResults[11],
          sum_result: total > 0 ? total.toString() : null,
          rate: rate, // rate is now never null
          status,
        }
      });
    });
    
    // Execute all save operations
    await Promise.all(savePromises);
    
    return NextResponse.json({ 
      message: 'Data saved successfully',
      count: Object.keys(editableData).length
    });

  } catch (error) {
    console.error('Error saving KPI report data:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moneyYear = searchParams.get('moneyYear');
    const kpiId = searchParams.get('kpiId');

    if (!moneyYear || !kpiId) {
      return NextResponse.json(
        { error: 'moneyYear and kpiId are required' },
        { status: 400 }
      );
    }

    const reports = await prisma.kpiReport.findMany({
      where: {
        money_year: parseInt(moneyYear),
        kpi_id: kpiId
      },
      orderBy: {
        area_name: 'asc'
      }
    });

    // Transform data to match expected format
    const transformedReports = reports.map(report => ({
      area_name: report.area_name,
      kpi_target: report.kpi_target,
      result_oct: report.result_oct,
      result_nov: report.result_nov,
      result_dec: report.result_dec,
      result_jan: report.result_jan,
      result_feb: report.result_feb,
      result_mar: report.result_mar,
      result_apr: report.result_apr,
      result_may: report.result_may,
      result_jun: report.result_jun,
      result_jul: report.result_jul,
      result_aug: report.result_aug,
      result_sep: report.result_sep,
      sum_result: report.sum_result,
      rate: report.rate,
      status: report.status,
    }));

    return NextResponse.json({ reports: transformedReports });

  } catch (error) {
    console.error('Error fetching KPI report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
