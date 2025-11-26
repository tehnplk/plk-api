import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getStatusFromCondition } from '@/utils/conditionEvaluator';
import { DISTRICTS } from '@/config/constants';
import { EXCELLENCE_MAP } from '@/constants/excellence';

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
        excellence: true,
      },
    });

    if (allDistrictKpis.length === 0) {
      return NextResponse.json({
        districtData: [],
        districtComparisonData: [],
      });
    }

    const kpiMetaMap = new Map<string, { condition: string; target_result: number; excellence: string | null }>();
    const kpiIds = allDistrictKpis.map((k) => k.id);
    allDistrictKpis.forEach((kpi) => {
      kpiMetaMap.set(kpi.id, {
        condition: kpi.condition,
        target_result: kpi.target_result,
        excellence: (kpi as any).excellence ?? null,
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

    type ExcellenceAgg = {
      title: string;
      total: number;
      pass: number;
      fail: number;
      pending: number;
    };

    const districtAgg = new Map<string, DistrictAgg>();
    const districtExcellenceAgg = new Map<string, Map<string, ExcellenceAgg>>();

    // เตรียมโครงอำเภอให้ครบทุก DISTRICTS
    for (const name of DISTRICTS) {
      districtAgg.set(name, {
        name,
        pass: 0,
        fail: 0,
        pending: 0,
        total: 0,
      });
      districtExcellenceAgg.set(name, new Map<string, ExcellenceAgg>());
    }

    // วนทุกอำเภอ × ทุก KPI ระดับอำเภอ
    for (const areaName of DISTRICTS) {
      const agg = districtAgg.get(areaName)!;
      const exMap = districtExcellenceAgg.get(areaName)!;

      for (const kpi of allDistrictKpis) {
        const meta = kpiMetaMap.get(kpi.id);

        // เตรียมตัวสะสมตาม Excellence (ถ้าระบุไว้และอยู่ใน 5 Excellence)
        let exAgg: ExcellenceAgg | null = null;
        if (meta && meta.excellence && EXCELLENCE_MAP[meta.excellence]) {
          const key = meta.excellence;
          const existing = exMap.get(key);
          if (existing) {
            exAgg = existing;
          } else {
            const created: ExcellenceAgg = {
              title: EXCELLENCE_MAP[key],
              total: 0,
              pass: 0,
              fail: 0,
              pending: 0,
            };
            exMap.set(key, created);
            exAgg = created;
          }
        }

        if (!meta) {
          agg.total += 1;
          agg.pending += 1;
          if (exAgg) {
            exAgg.total += 1;
            exAgg.pending += 1;
          }
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

        if (exAgg) {
          exAgg.total += 1;
          if (status === 'pass') exAgg.pass += 1;
          else if (status === 'fail') exAgg.fail += 1;
          else exAgg.pending += 1;
        }
      }
    }

    // แปลงเป็นรูปสำหรับกราฟและข้อมูล 5 Excellence รายอำเภอ
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

    const districtExcellenceData = Array.from(districtAgg.values()).map((d) => {
      const exMap = districtExcellenceAgg.get(d.name) || new Map<string, ExcellenceAgg>();
      const excellenceStats = Array.from(exMap.values()).map((ex) => {
        const denom = Math.max(ex.total, 1);
        const percent =
          ex.total === 0 ? '0.0' : ((ex.pass / denom) * 100).toFixed(1);
        return {
          title: ex.title,
          total: ex.total,
          pass: ex.pass,
          fail: ex.fail,
          pending: ex.pending,
          percent,
        };
      });

      return {
        name: d.name,
        excellenceStats,
      };
    });

    return NextResponse.json({ districtData, districtComparisonData, districtExcellenceData });
  } catch (error) {
    console.error('Error summarizing KPI report by district:', error);
    return NextResponse.json(
      { error: 'Failed to summarize district data' },
      { status: 500 }
    );
  }
}
