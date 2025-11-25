import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET - ดึงรายการผู้ใช้ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { full_name_th: { contains: search } },
        { full_name_en: { contains: search } },
        { email: { contains: search } },
        { provider_id: { contains: search } },
        { hospital_code: { contains: search } },
      ];
    }

    if (active !== null && active !== '') {
      whereClause.active = active === 'true';
    }

    const users = await prisma.accountUser.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching account users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users', message: String(error) },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตข้อมูลผู้ใช้
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.accountUser.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating account user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user', message: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - ลบผู้ใช้
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    await prisma.accountUser.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user', message: String(error) },
      { status: 500 }
    );
  }
}
