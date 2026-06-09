import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fileName = `kpi_db_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
    const backup = {
      exported_at: now.toISOString(),
      tables: {
        kpis: await prisma.kpis.findMany(),
        kpi_report: await prisma.kpiReport.findMany(),
        department: await prisma.department.findMany(),
        account_user: await prisma.accountUser.findMany(),
      },
    };
    const fileBuffer = Buffer.from(JSON.stringify(backup, null, 2), 'utf8');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': Buffer.byteLength(fileBuffer).toString(),
        'X-Backup-Filename': fileName,
      },
    });
  } catch (error) {
    console.error('Error creating DB backup:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'ไม่สามารถสำรองข้อมูลได้',
        error: String(error),
      },
      { status: 500 },
    );
  }
}
