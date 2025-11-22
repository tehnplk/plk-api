import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MONTH_FIELDS = [
  'result_oct',
  'result_nov',
  'result_dec',
  'result_jan',
  'result_feb',
  'result_mar',
  'result_apr',
  'result_may',
  'result_jun',
  'result_jul',
  'result_aug',
  'result_sep',
] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      kpiId,
      kpiName,
      targetData,
      gridData,
      months,
      moneyYear,
    } = body as {
      kpiId: string
      kpiName: string
      targetData: Record<string, string>
      gridData: Record<string, Record<string, string>>
      months: string[]
      moneyYear: number | string
    }

    const moneyYearNum = Number(moneyYear)

    if (!kpiId || !kpiName || !targetData || !gridData || !months || !moneyYearNum) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const areaNames = Object.keys(targetData)
    const results: { area_name: string }[] = []

    for (const area_name of areaNames) {
      const targetRaw = targetData[area_name] ?? ''
      const targetNum = Number(targetRaw)
      const kpi_tarket = Number.isFinite(targetNum) ? targetNum : null

      const data: any = {
        money_year: moneyYearNum,
        area_name,
        kpi_id: kpiId,
        kpi_name: kpiName,
        kpi_tarket,
      }

      // map เดือนในฟอร์ม → คอลัมน์ result_oct..result_sep ตามลำดับ
      for (let i = 0; i < MONTH_FIELDS.length && i < months.length; i++) {
        const monthLabel = months[i]
        const raw = gridData[area_name]?.[monthLabel] ?? ''
        const num = Number(raw)
        data[MONTH_FIELDS[i]] = Number.isFinite(num) ? num : null
      }

      // ลบแถวเดิม (ถ้ามี) แล้วสร้างใหม่ตาม PK รวม
      await prisma.kpiReport.deleteMany({
        where: {
          money_year: moneyYearNum,
          area_name,
          kpi_id: kpiId,
        },
      })

      await prisma.kpiReport.create({
        data,
      })

      results.push({ area_name })
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูล KPI เรียบร้อยแล้ว',
      results,
    })
  } catch (error) {
    console.error('Error saving KPI data:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kpiId = searchParams.get('kpiId')
    const moneyYearParam = searchParams.get('moneyYear')

    if (!kpiId || !moneyYearParam) {
      return NextResponse.json(
        { error: 'kpiId and moneyYear are required' },
        { status: 400 },
      )
    }

    const money_year = Number(moneyYearParam)
    if (!money_year) {
      return NextResponse.json(
        { error: 'moneyYear must be a valid number' },
        { status: 400 },
      )
    }

    const reports = await prisma.kpiReport.findMany({
      where: {
        kpi_id: kpiId,
        money_year,
      },
      orderBy: {
        area_name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: reports,
    })
  } catch (error) {
    console.error('Error fetching KPI data:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 },
    )
  }
}
