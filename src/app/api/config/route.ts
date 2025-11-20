import { NextResponse } from 'next/server';

export async function GET() {
  const yearEnv = process.env.MONEY_YEAR;
  const moneyYear = yearEnv ? parseInt(yearEnv, 10) : undefined;

  if (!moneyYear || Number.isNaN(moneyYear)) {
    return NextResponse.json({ moneyYear: null }, { status: 200 });
  }

  return NextResponse.json({ moneyYear }, { status: 200 });
}
