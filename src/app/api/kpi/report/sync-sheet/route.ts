import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

const ENDPOINT_URL = process.env.ENDPOINT_URL;

// POST /api/kpi/report/sync-sheet
// Body: { moneyYear: number, kpiId: string, kpiName?: string }
// ใช้ดึงข้อมูลจาก kpi_report แล้ว sync ไปชีท data บน Google Sheets ผ่าน Apps Script (upsert_report)
export async function POST(request: NextRequest) {
  try {
    if (!ENDPOINT_URL) {
      return NextResponse.json(
        { error: 'Google Sheets ENDPOINT_URL is not configured' },
        { status: 500 },
      );
    }

    const { moneyYear, kpiId, kpiName } = await request.json();

    if (!moneyYear || !kpiId) {
      return NextResponse.json(
        { error: 'moneyYear and kpiId are required' },
        { status: 400 },
      );
    }

    const reports = await prisma.kpiReport.findMany({
      where: {
        money_year: Number(moneyYear),
        kpi_id: kpiId,
      },
      orderBy: {
        area_name: 'asc',
      },
    });

    if (reports.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No kpi_report rows to sync',
        synced: 0,
      });
    }

    const upstreamUrl = `${ENDPOINT_URL}?sheet=data&action=upsert_report`;

    let successCount = 0;
    let failCount = 0;

    for (const report of reports) {
      const payload = {
        money_year: report.money_year,
        kpi_id: report.kpi_id,
        area_name: report.area_name,
        kpi_name: kpiName || report.kpi_name || '',
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
      };

      try {
        const res = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          failCount += 1;
          console.error('Failed to sync row to Google Sheets data sheet', {
            status: res.status,
            payload,
          });
        } else {
          successCount += 1;
        }
      } catch (err) {
        failCount += 1;
        console.error('Error syncing row to Google Sheets data sheet', err);
      }
    }

    return NextResponse.json({
      success: true,
      synced: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error('Error syncing kpi_report to Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to sync kpi_report to Google Sheets' },
      { status: 500 },
    );
  }
}
