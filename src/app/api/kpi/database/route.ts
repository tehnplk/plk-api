import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const level = searchParams.get('level');
    const kpiType = searchParams.get('kpiType');

    // Build where clause
    let whereClause: any = {};
    
    if (department && department.trim() !== '') {
      whereClause.ssj_department = department.trim();
    }
    
    if (level && level.trim() !== '') {
      whereClause.area_level = level.trim() === 'district' ? 'อำเภอ' : 'จังหวัด';
    }
    
    if (kpiType && kpiType.trim() !== '') {
      whereClause.kpi_type = kpiType.trim();
    }

    // Fetch KPI data from database
    const kpis = await prisma.kpis.findMany({
      where: whereClause,
      orderBy: [
        { ssj_department: 'asc' },
        { area_level: 'asc' },
        { id: 'asc' }
      ]
    });

    // Transform to match expected format
    const transformedData = kpis.map(kpi => ({
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
      kpi_type: kpi.kpi_type,
      grade: kpi.grade,
      template_url: kpi.template_url,
      last_synced_at: kpi.last_synced_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      source: 'database',
      filters: {
        department,
        level,
        kpiType
      }
    });

  } catch (error) {
    console.error('Error fetching KPI data from database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch data from database',
        message: String(error)
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, sum_result } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.kpis.update({
      where: { id },
      data: {
        sum_result: sum_result != null ? String(sum_result) : null,
        last_synced_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        sum_result: updated.sum_result,
        last_synced_at: updated.last_synced_at,
      },
    });
  } catch (error) {
    console.error('Error updating KPI master data:', error);
    return NextResponse.json(
      { error: 'Failed to update KPI master data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
