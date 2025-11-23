// This endpoint has been deprecated
// KPI data is now fetched directly from Google Sheets API via /api/kpis/db
// Please use /api/kpis/db instead

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'This endpoint has been deprecated. KPI data is now fetched directly from Google Sheets API via /api/kpis/db',
    deprecated: true,
  }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'This endpoint has been deprecated. KPI data is now fetched directly from Google Sheets API via /api/kpis/db',
    deprecated: true,
  }, { status: 410 });
}