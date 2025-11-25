import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
