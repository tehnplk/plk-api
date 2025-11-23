import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic Prisma connection
    const count = await prisma.kpis.count();
    console.log(`✅ Database connection successful, KPI count: ${count}`);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      kpiCount: count,
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: String(error),
    }, { status: 500 });
  }
}
