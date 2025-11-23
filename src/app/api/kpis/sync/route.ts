import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbzKcomVEGs3E_JMkZpkJjwjzVjrbzNxyJD1byzhsAsRB8bGEM1qxUqVSZtHK0MOnVRfmg/exec';

export async function POST() {
  try {
    console.log('Starting KPI sync from Google Sheets...');
    
    // Fetch data from Google Sheets API
    const upstreamUrl = `${ENDPOINT_URL}?sheet=kpi`;
    const response = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiData = await response.json();
    console.log('API response received, processing data...');
    
    // Extract data array from response
    const kpiData = Array.isArray(apiData) ? apiData : apiData.data ?? [];
    
    if (!Array.isArray(kpiData)) {
      throw new Error('Invalid API response format');
    }
    
    console.log(`Processing ${kpiData.length} KPI records...`);
    
    // Transform and upsert data to database
    const syncPromises = kpiData.map(async (item: any) => {
      const transformedData = {
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
        is_moph_kpi: String(item.is_moph_kpi ?? ''),
        last_synced_at: new Date(),
      };
      
      return prisma.kpis.upsert({
        where: { id: transformedData.id },
        update: transformedData,
        create: transformedData,
      });
    });
    
    // Execute all upsert operations
    const results = await Promise.all(syncPromises);
    
    console.log(`Successfully synced ${results.length} KPI records to database`);
    
    return NextResponse.json({
      success: true,
      message: `Synced ${results.length} KPI records successfully`,
      count: results.length,
      syncedAt: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('KPI sync failed:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: String(error),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get last sync info
    const latestRecord = await prisma.kpis.findFirst({
      orderBy: { last_synced_at: 'desc' },
      select: { last_synced_at: true }
    });
    
    const totalCount = await prisma.kpis.count();
    
    return NextResponse.json({
      success: true,
      lastSyncedAt: latestRecord?.last_synced_at,
      totalCount,
      hasData: totalCount > 0,
    });
    
  } catch (error) {
    console.error('Failed to get sync status:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}
