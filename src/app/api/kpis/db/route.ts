import { NextRequest, NextResponse } from 'next/server';

const ENDPOINT_URL = process.env.ENDPOINT_URL || 'https://script.google.com/macros/s/AKfycbzKcomVEGs3E_JMkZpkJjwjzVjrbzNxyJD1byzhsAsRB8bGEM1qxUqVSZtHK0MOnVRfmg/exec';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching KPI data from Google Sheets API...');
    
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const level = searchParams.get('level'); // 'province' or 'district'
    
    // Fetch data from Google Sheets API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout triggered, aborting fetch...');
      controller.abort();
    }, 25000); // Increased to 25 second timeout
    
    console.log('Making request to Google Sheets API...');
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
    
    console.log(`Processing ${kpiData.length} KPI records...`);
    
    // Transform data to match expected format
    let transformedData = kpiData.map((item: any) => ({
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
    }));
    
    // Apply filters if provided
    if (department && department.trim() !== '') {
      transformedData = transformedData.filter(item => 
        item.ssj_department === department.trim()
      );
    }
    
    if (level && level.trim() !== '') {
      transformedData = transformedData.filter(item => 
        item.area_level === (level.trim() === 'province' ? 'จังหวัด' : 'อำเภอ')
      );
    }
    
    console.log(`Returning ${transformedData.length} filtered KPI records`);
    
    // Return in the same format as the original API
    const response_data = {
      success: true,
      data: transformedData,
      count: transformedData.length,
      source: 'google_sheets',
      lastSyncedAt: new Date(),
      timestamp: Date.now(), // Add timestamp to prevent caching
    };
    
    // Remove caching headers to ensure fresh data
    return NextResponse.json(response_data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('Failed to fetch KPI data from Google Sheets:', error);
    
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
