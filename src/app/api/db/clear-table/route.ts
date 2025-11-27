import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALLOWED_TABLES = ['kpis', 'kpi_report', 'department', 'account_user'] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

export async function POST(request: NextRequest) {
  try {
    const { table } = await request.json();

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing table name' },
        { status: 400 },
      );
    }

    const t = table as AllowedTable;

    // ลบข้อมูลทุกแถวในตารางที่เลือก
    switch (t) {
      case 'kpis':
        await prisma.kpis.deleteMany({});
        break;
      case 'kpi_report':
        await prisma.kpiReport.deleteMany({});
        break;
      case 'department':
        await prisma.department.deleteMany({});
        break;
      case 'account_user':
        await prisma.accountUser.deleteMany({});
        break;
    }

    // Reset auto id (ถ้ามี) ใน sqlite_sequence โดยใช้ $executeRawUnsafe รูปแบบ string ปกติ
    // ตารางที่ไม่มี auto-increment จะไม่มี row ใน sqlite_sequence อยู่แล้ว การลบจะไม่กระทบอะไร
    await prisma.$executeRawUnsafe(
      'DELETE FROM sqlite_sequence WHERE name = ?',
      t,
    );

    return NextResponse.json({
      success: true,
      table: t,
      message: `Cleared table ${t} and reset auto id (if applicable)`,
    });
  } catch (error) {
    console.error('Error clearing table:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clear table',
        error: String(error),
      },
      { status: 500 },
    );
  }
}
