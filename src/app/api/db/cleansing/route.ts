import { NextResponse } from 'next/server';
import { runDbCleansing } from '@/lib/dbCleansing';

export async function GET() {
  try {
    const result = await runDbCleansing();

    return NextResponse.json({
      message: 'Cleansing completed',
      ...result,
    });
  } catch (error) {
    console.error('Error running DB cleansing:', error);
    return NextResponse.json({ error: 'Failed to run cleansing' }, { status: 500 });
  }
}
