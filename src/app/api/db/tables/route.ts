import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const [kpisCount, kpiReportCount, departmentCount, accountUserCount] = await Promise.all([
      prisma.kpis.count(),
      prisma.kpiReport.count(),
      prisma.department.count(),
      prisma.accountUser.count(),
    ]);

    const tables = [
      {
        name: 'kpis',
        label: 'ตัวชี้วัด (kpis)',
        records: kpisCount,
        canClear: true,
        canSync: true,
      },
      {
        name: 'kpi_report',
        label: 'รายงานผล (kpi_report)',
        records: kpiReportCount,
        canClear: true,
        canSync: false,
      },
      {
        name: 'department',
        label: 'หน่วยงาน (department)',
        records: departmentCount,
        canClear: true,
        canSync: false,
      },
      {
        name: 'account_user',
        label: 'ผู้ใช้ระบบ (account_user)',
        records: accountUserCount,
        canClear: false,
        canSync: false,
      },
    ];

    return NextResponse.json({
      success: true,
      tables,
    });
  } catch (error) {
    console.error('Error fetching DB tables:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch DB tables',
        message: String(error),
      },
      { status: 500 },
    );
  }
}
