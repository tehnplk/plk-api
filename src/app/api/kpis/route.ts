import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.ENDPOINT_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { error: 'ENDPOINT_URL is not configured' },
      { status: 500 },
    );
  }

  try {
    const upstreamUrl = `${baseUrl}?sheet=kpi`;

    const res = await fetch(upstreamUrl);

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
      { error: err?.message || 'Failed to fetch data' },
      { status: 500 },
    );
  }
}
