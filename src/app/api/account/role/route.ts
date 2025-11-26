import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider_id');

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'provider_id is required' },
        { status: 400 }
      );
    }

    const user = await prisma.accountUser.findUnique({
      where: { provider_id: providerId },
      select: { 
        role: true, 
        active: true, 
        department: true,
        login_count: true,
        last_login: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      });
    }

    return NextResponse.json({
      success: true,
      role: user.role || '',
      active: user.active,
      department: user.department || '',
      login_count: user.login_count,
      last_login: user.last_login,
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user role' },
      { status: 500 }
    );
  }
}
