import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getStatusFromCondition } from '@/utils/conditionEvaluator';

// GET /api/kpi/report/summary?moneyYear=2569
// สรุปข้อมูลรายอำเภอจากตาราง kpi_report โดย join กับ kpis เพื่อประเมินสถานะตาม condition/target
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moneyYearParam = searchParams.get('moneyYear');

    if (!moneyYearParam) {
      return NextResponse.json(
        { error: 'moneyYear is required' },
        { status: 400 }
      );
    }

    const moneyYear = parseInt(moneyYearParam, 10);
    if (Number.isNaN(moneyYear)) {
      return NextResponse.json(
        { error: 'moneyYear must be a number' },
        { status: 400 }
      );
    }

    // ดึงรายงานทั้งหมดของปีงบประมาณนั้น
    const reports = await prisma.kpiReport.findMany({
      where: { money_year: moneyYear },
    });

    if (reports.length === 0) {
      return NextResponse.json({
        districtData: [],
        districtComparisonData: [],
      });
    }

    // ดึง metadata ของ KPI ที่เกี่ยวข้อง
    const kpiIds = Array.from(new Set(reports.map((r) => r.kpi_id)));
    const kpis = await prisma.kpis.findMany({
      where: {
        id: {
          in: kpiIds,
        },
      },
      select: {
        id: true,
        condition: true,
        target_result: true,
      },
    });

    const kpiMap = new Map<string, { condition: string; target_result: number }>();
    kpis.forEach((kpi) => {
      kpiMap.set(kpi.id, {
        condition: kpi.condition,
        target_result: kpi.target_result,
      });
    });

    // สรุปตามอำเภอ
    type DistrictAgg = {
      name: string;
      pass: number;
      fail: number;
      pending: number;
      total: number;
    };

    const districtAgg = new Map<string, DistrictAgg>();

    for (const report of reports) {
      const meta = kpiMap.get(report.kpi_id);
      if (!meta) continue; // ไม่มี metadata ข้ามไป

      const { condition, target_result } = meta;
      const cleanCondition = (condition ?? '').toString().trim();

      // ใช้ rate จากรายงานเป็นตัว actual (ผลลัพธ์สุดท้ายของ KPI นั้นในพื้นที่นั้น)
      const actual =
        report.rate === null || report.rate === undefined
          ? null
          : Number(report.rate);

      let status: 'pass' | 'fail' | 'pending' = 'pending';

      if (!cleanCondition || target_result === null || target_result === undefined) {
        status = 'pending';
      } else {
        status = getStatusFromCondition(cleanCondition, target_result, actual);
      }

      const key = report.area_name;
      if (!districtAgg.has(key)) {
        districtAgg.set(key, {
          name: key,
          pass: 0,
          fail: 0,
          pending: 0,
          total: 0,
        });
      }

      const agg = districtAgg.get(key)!;
      agg.total += 1;
      if (status === 'pass') agg.pass += 1;
      else if (status === 'fail') agg.fail += 1;
      else agg.pending += 1;
    }

    // แปลงเป็นรูปสำหรับกราฟ
    const districtComparisonData = Array.from(districtAgg.values()).map((d) => ({
      name: d.name,
      pass: d.pass,
      fail: d.fail,
      pending: d.pending,
      total: d.total,
    }));

    const districtData = Array.from(districtAgg.values()).map((d) => {
      const denom = Math.max(d.pass + d.fail, 1); // ไม่นับ pending ในตัวหาร
      const percent = denom === 0 ? 0 : (d.pass / denom) * 100;
      return {
        name: d.name,
        percent: Number(percent.toFixed(1)),
      };
    });

    return NextResponse.json({ districtData, districtComparisonData });
  } catch (error) {
    console.error('Error summarizing KPI report by district:', error);
    return NextResponse.json(
      { error: 'Failed to summarize district data' },
      { status: 500 }
    );
  }
}
