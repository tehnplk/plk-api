import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

const ENDPOINT_URL = process.env.ENDPOINT_URL;

export async function POST(request: NextRequest) {
  try {
    console.log('Starting KPI metadata sync...');
    
    // Fetch data from Google Sheets API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout triggered, aborting fetch...');
      controller.abort();
    }, 25000);
    
    console.log('Fetching KPI data from Google Sheets API...');
    const upstreamUrl = `${ENDPOINT_URL}?sheet=kpi`;
    
    let response;
    try {
      response = await fetch(upstreamUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      console.log('Fetch completed, status:', response.status);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Google Sheets API may be slow or unavailable.');
      }
      throw fetchError;
    }
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Google Sheets API rate limit exceeded. Please try again in a few minutes.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiData = await response.json();
    console.log('API response received, processing data...');
    
    // Extract data array from response
    const kpiData = Array.isArray(apiData) ? apiData : apiData.data ?? [];
    
    if (!Array.isArray(kpiData)) {
      throw new Error('Invalid API response format');
    }
    
    console.log(`Processing ${kpiData.length} KPI records for database sync...`);
    
    // Transform data to match database schema
    const transformedData = kpiData.map((item: any) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      evaluation_criteria: String(item.evaluation_criteria ?? ''),
      condition: String(item.condition ?? ''),
      target_result: typeof item.target_result === 'number' ? item.target_result : 
                    typeof item.target_result === 'string' ? parseFloat(item.target_result) || 0 : 0,
      divide_number: typeof item.divide_number === 'number' ? item.divide_number : 
                    typeof item.divide_number === 'string' ? parseFloat(item.divide_number) || 100 : 100,
      sum_result: String(item.sum_result ?? ''),
      excellence: String(item.excellence ?? ''),
      area_level: String(item.area_level ?? ''),
      ssj_department: String(item.ssj_department ?? ''),
      ssj_pm: String(item.ssj_pm ?? ''),
      moph_department: String(item.moph_department ?? ''),
      kpi_type: String(item.kpi_type ?? ''),
      grade: String(item.grade ?? ''),
      template_url: String(item.template_url ?? ''),
    }));
    
    // Sync data to database using upsert
    await prisma.kpis.deleteMany({});
    console.log('Truncated kpis table before syncing new data');
    const syncPromises = transformedData.map(async (kpi) => {
      return prisma.kpis.upsert({
        where: { id: kpi.id },
        update: {
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
          last_synced_at: new Date(),
        },
        create: {
          ...kpi,
          last_synced_at: new Date(),
        }
      });
    });
    
    // Execute all sync operations
    const results = await Promise.all(syncPromises);
    
    console.log(`Successfully synced ${results.length} KPI records to database`);
    
    // Sync departments from unique ssj_department values
    console.log('Syncing departments...');
    
    // Truncate department table first
    await prisma.department.deleteMany({});
    console.log('Truncated department table');
    
    const uniqueDepartments = [...new Set(
      transformedData
        .map((kpi) => kpi.ssj_department)
        .filter((dept) => dept && dept.trim() !== '')
    )];
    
    let departmentCount = 0;
    for (const deptName of uniqueDepartments) {
      await prisma.department.create({
        data: {
          id: deptName,
          name: deptName,
          activate: true,
        },
      });
      departmentCount++;
    }
    
    console.log(`Successfully synced ${departmentCount} departments to database`);
    
    return NextResponse.json({
      success: true,
      message: 'KPI metadata and departments synced successfully',
      count: results.length,
      departmentCount,
      lastSyncedAt: new Date(),
      source: 'google_sheets'
    });
    
  } catch (error) {
    console.error('Failed to sync KPI metadata:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Google Sheets API may be slow or unavailable.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({
      success: false,
      message: errorMessage,
      error: String(error),
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get sync status
    const lastSync = await prisma.kpis.findFirst({
      select: {
        last_synced_at: true,
      },
      orderBy: {
        last_synced_at: 'desc'
      }
    });
    
    const totalRecords = await prisma.kpis.count();
    
    return NextResponse.json({
      success: true,
      lastSyncedAt: lastSync?.last_synced_at,
      totalRecords,
      databaseStatus: 'connected'
    });
    
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get sync status',
      error: String(error),
    }, { status: 500 });
  }
}
