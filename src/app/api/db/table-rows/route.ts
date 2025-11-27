import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const limitParam = searchParams.get('limit');

    const limit = Math.min(Number(limitParam) || 100, MAX_LIMIT);

    if (!table) {
      return NextResponse.json(
        { success: false, message: 'table parameter is required' },
        { status: 400 },
      );
    }

    let rows: any[] = [];

    switch (table) {
      case 'kpis':
        rows = await prisma.kpis.findMany({ take: limit });
        break;
      case 'kpi_report':
        rows = await prisma.kpiReport.findMany({ take: limit });
        break;
      case 'department':
        rows = await prisma.department.findMany({ take: limit });
        break;
      case 'account_user':
        rows = await prisma.accountUser.findMany({ take: limit });
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Unsupported table name' },
          { status: 400 },
        );
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return NextResponse.json({
      success: true,
      table,
      columns,
      rows,
      limit,
    });
  } catch (error) {
    console.error('Error fetching table rows:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch table rows',
        error: String(error),
      },
      { status: 500 },
    );
  }
}
