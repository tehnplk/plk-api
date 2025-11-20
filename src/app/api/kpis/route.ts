import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.KPI_LIST_URL;

  if (!url) {
    return NextResponse.json(
      { error: 'KPI_LIST_URL is not configured' },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: HTTP ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch KPI list' },
      { status: 500 },
    );
  }
}
