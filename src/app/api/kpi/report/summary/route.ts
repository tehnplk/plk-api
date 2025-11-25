import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getStatusFromCondition } from '@/utils/conditionEvaluator';
import { DISTRICTS } from '@/config/constants';

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

    // ดึง KPI ทั้งหมดระดับอำเภอ (ใช้เป็นจำนวนตัวชี้วัดต่ออำเภอ)
    const allDistrictKpis = await prisma.kpis.findMany({
      where: {
        area_level: 'อำเภอ',
      },
      select: {
        id: true,
        condition: true,
        target_result: true,
      },
    });

    if (allDistrictKpis.length === 0) {
      return NextResponse.json({
        districtData: [],
        districtComparisonData: [],
      });
    }

    const kpiMetaMap = new Map<string, { condition: string; target_result: number }>();
    const kpiIds = allDistrictKpis.map((k) => k.id);
    allDistrictKpis.forEach((kpi) => {
      kpiMetaMap.set(kpi.id, {
        condition: kpi.condition,
        target_result: kpi.target_result,
      });
    });

    // ดึงรายงานทั้งหมดของปีงบประมาณนั้นสำหรับ KPI ระดับอำเภอในเขต DISTRICTS
    const reports = await prisma.kpiReport.findMany({
      where: {
        money_year: moneyYear,
        area_name: { in: DISTRICTS },
        kpi_id: { in: kpiIds },
      },
    });

    type ReportKey = string;
    const reportMap = new Map<ReportKey, typeof reports[number]>();
    for (const r of reports) {
      const key: ReportKey = `${r.area_name}::${r.kpi_id}`;
      reportMap.set(key, r);
    }

    // สรุปตามอำเภอ (นับจากจำนวน KPI ระดับอำเภอทั้งหมด)
    type DistrictAgg = {
      name: string;
      pass: number;
      fail: number;
      pending: number;
      total: number;
    };

    const districtAgg = new Map<string, DistrictAgg>();

    // เตรียมโครงอำเภอให้ครบทุก DISTRICTS
    for (const name of DISTRICTS) {
      districtAgg.set(name, {
        name,
        pass: 0,
        fail: 0,
        pending: 0,
        total: 0,
      });
    }

    // วนทุกอำเภอ × ทุก KPI ระดับอำเภอ
    for (const areaName of DISTRICTS) {
      const agg = districtAgg.get(areaName)!;

      for (const kpi of allDistrictKpis) {
        const meta = kpiMetaMap.get(kpi.id);
        if (!meta) {
          agg.total += 1;
          agg.pending += 1;
          continue;
        }

        const reportKey = `${areaName}::${kpi.id}`;
        const report = reportMap.get(reportKey);

        let status: 'pass' | 'fail' | 'pending' = 'pending';

        if (!report) {
          // ยังไม่มีรายงานเลย สำหรับ KPI นี้ในอำเภอนี้ => รอประเมิน
          status = 'pending';
        } else {
          const { condition, target_result } = meta;
          const cleanCondition = (condition ?? '').toString().trim();

          // ใช้ rate เป็น actual และดูเป้ารายพื้นที่ (kpi_target)
          const actual =
            report.rate === null || report.rate === undefined
              ? null
              : Number(report.rate);
          const areaTarget = report.kpi_target;

          if (
            !cleanCondition ||
            target_result === null ||
            target_result === undefined ||
            areaTarget === null ||
            areaTarget === undefined ||
            areaTarget <= 0
          ) {
            // ไม่มีเงื่อนไข/เกณฑ์ หรือยังไม่กำหนดเป้ารายพื้นที่ => รอประเมิน
            status = 'pending';
          } else {
            status = getStatusFromCondition(
              cleanCondition,
              Number(target_result),
              actual,
            );
          }
        }

        agg.total += 1;
        if (status === 'pass') agg.pass += 1;
        else if (status === 'fail') agg.fail += 1;
        else agg.pending += 1;
      }
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
      const denom = Math.max(d.total, 1);
      const percent = d.total === 0 ? 0 : (d.pass / denom) * 100;
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
