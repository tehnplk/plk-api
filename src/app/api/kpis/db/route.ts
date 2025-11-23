import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching KPI data from database...');
    
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const level = searchParams.get('level'); // 'province' or 'district'
    
    // Build where clause based on filters
    const whereClause: any = {};
    
    if (department && department.trim() !== '') {
      whereClause.ssj_department = department.trim();
    }
    
    if (level && level.trim() !== '') {
      whereClause.area_level = level.trim() === 'province' ? 'จังหวัด' : 'อำเภอ';
    }
    
    // Fetch data from database
    const kpis = await prisma.kpis.findMany({
      where: whereClause,
      orderBy: [
        { ssj_department: 'asc' },
        { id: 'asc' }
      ],
    });
    
    console.log(`Found ${kpis.length} KPI records in database`);
    
    // Transform to match expected API response format
    const transformedData = kpis.map((kpi) => ({
      id: kpi.id,
      name: kpi.name,
      evaluation_criteria: kpi.evaluation_criteria,
      condition: kpi.condition,
      target_result: kpi.target_result,
      divide_number: kpi.divide_number,
      sum_result: kpi.sum_result,
      excellence: kpi.excellence,
      area_level: kpi.area_level,
      ssj_department: kpi.ssj_department,
      ssj_pm: kpi.ssj_pm,
      moph_department: kpi.moph_department,
      is_moph_kpi: kpi.is_moph_kpi,
    }));
    
    // Return in the same format as the original API
    const response = {
      success: true,
      data: transformedData,
      count: transformedData.length,
      source: 'database',
      lastSyncedAt: kpis.length > 0 ? kpis[0].last_synced_at : null,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Failed to fetch KPI data from database:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: String(error),
    }, { status: 500 });
  }
}
