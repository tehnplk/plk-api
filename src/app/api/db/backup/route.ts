import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'database', 'kpi.db');
    await fs.access(dbPath);

    const fileBuffer = await fs.readFile(dbPath);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fileName = `kpi_db_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.db`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': Buffer.byteLength(fileBuffer).toString(),
        'X-Backup-Filename': fileName,
      },
    });
  } catch (error) {
    console.error('Error creating DB backup:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'ไม่สามารถสำรองข้อมูลได้',
        error: String(error),
      },
      { status: 500 },
    );
  }
}
