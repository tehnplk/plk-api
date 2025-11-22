'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, FileText } from 'lucide-react';
import KPITable, { KPIItem as TableKPIItem } from '../components/KPITable';
import ReportNavbar from './ReportNavbar';
import ReportKpiModal from './ReportKpiModal';

const DISTRICTS = [
  'เมืองพิษณุโลก',
  'นครไทย',
  'ชาติตระการ',
  'บางระกำ',
  'บางกระทุ่ม',
  'พรหมพิราม',
  'วัดโบสถ์',
  'วังทอง',
  'เนินมะปราง',
];

const DEFAULT_MONEY_YEAR = Number(
  process.env.NEXT_PUBLIC_MONEY_YEAR ?? '2569',
);

type KpiLevel = 'province' | 'district';

interface KPIItem {
  id: string;
  name: string;
  excellence: string;
  criteria: string;
  level: KpiLevel;
}

// ในของจริงควรดึงจาก API, ตอนนี้ใช้ mock ง่าย ๆ
const MOCK_KPIS: KPIItem[] = [
  {
    id: 'KPI-001',
    name: 'ตัวชี้วัดตัวอย่างระดับจังหวัด',
    excellence: 'PP&P Excellence',
    criteria: '> 80%',
    level: 'province',
  },
  {
    id: 'KPI-002',
    name: 'ตัวชี้วัดตัวอย่างระดับอำเภอ',
    excellence: 'Service Excellence',
    criteria: '> 90%',
    level: 'district',
  },
];

interface UserInfo {
  department: string;
}

type GridData = Record<string, Record<string, string>>;
type TargetData = Record<string, string>;

export default function ReportPage() {

  const router = useRouter();
  const { data: session, status } = useSession();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeKpi, setActiveKpi] = useState<TableKPIItem | null>(null);
  const [gridData, setGridData] = useState<GridData>({});
  const [targetData, setTargetData] = useState<TargetData>({});
  const [moneyYear, setMoneyYear] = useState<number>(DEFAULT_MONEY_YEAR);
  const [saveVersion, setSaveVersion] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ถ้ายังตรวจ session ไม่เสร็จ ให้รอก่อน
    if (status === 'loading') return;

    // ถ้าไม่มี session ให้กลับไปหน้า login
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    // เลือก department จาก session ก่อน ถ้าไม่มีลองอ่านจาก localStorage
    let effectiveDept = (session as any)?.user?.ssj_department as string | undefined;
    if (!effectiveDept && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('selectedDeptId') || undefined;
      if (stored && stored.trim()) {
        effectiveDept = stored.trim();
      }
    }

    setUser({ department: effectiveDept || 'ไม่ระบุกลุ่มงาน' });

    // load fiscal year from server config
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data?.moneyYear && typeof data.moneyYear === 'number') {
          setMoneyYear(data.moneyYear);
        }
      })
      .catch(() => {
        // ignore errors, fall back to default
      });
  }, [router, status, session]);

  const yearShortPrev = ((moneyYear - 1) % 100).toString().padStart(2, '0');
  const yearShortCurr = (moneyYear % 100).toString().padStart(2, '0');
  const MONTHS = [
    `ต.ค. ${yearShortPrev}`,
    `พ.ย. ${yearShortPrev}`,
    `ธ.ค. ${yearShortPrev}`,
    `ม.ค. ${yearShortCurr}`,
    `ก.พ. ${yearShortCurr}`,
    `มี.ค. ${yearShortCurr}`,
    `เม.ย. ${yearShortCurr}`,
    `พ.ค. ${yearShortCurr}`,
    `มิ.ย. ${yearShortCurr}`,
    `ก.ค. ${yearShortCurr}`,
    `ส.ค. ${yearShortCurr}`,
    `ก.ย. ${yearShortCurr}`,
  ];

  useEffect(() => {
    if (!activeKpi) {
      setGridData({});
      setTargetData({});
      return;
    }

    // Initialize empty grid when a KPI is activated
    const initial: GridData = {};
    const targets: TargetData = {};
    const rowKeys = activeKpi.level === 'district' ? DISTRICTS : ['จังหวัด'];

    rowKeys.forEach((key) => {
      initial[key] = {};
      targets[key] = '';
      MONTHS.forEach((m) => {
        initial[key][m] = '';
      });
    });
    setGridData(initial);
    setTargetData(targets);

    // โหลดข้อมูลเดิมจาก SQLite (Prisma)
    const loadExisting = async () => {
      setIsDataLoading(true);
      try {
        const params = new URLSearchParams({
          kpiId: activeKpi.id,
          moneyYear: String(moneyYear),
        });
        const res = await fetch(`/api/kpi/save-prisma?${params.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!json?.success || !Array.isArray(json.data)) return;

        const monthFields = [
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
        ] as const;

        const loadedGrid: GridData = { ...initial };
        const loadedTargets: TargetData = { ...targets };

        for (const row of json.data as any[]) {
          const area = row.area_name as string;
          if (!rowKeys.includes(area)) continue;

          if (row.kpi_tarket != null && !Number.isNaN(row.kpi_tarket)) {
            const t = Number(row.kpi_tarket);
            loadedTargets[area] = t === 0 ? '' : String(t);
          }

          for (let i = 0; i < MONTHS.length && i < monthFields.length; i++) {
            const field = monthFields[i];
            const v = row[field] as number | null | undefined;
            if (v != null && !Number.isNaN(v)) {
              const n = Number(v);
              loadedGrid[area][MONTHS[i]] = n === 0 ? '' : String(n);
            } else {
              loadedGrid[area][MONTHS[i]] = '';
            }
          }
        }

        setGridData(loadedGrid);
        setTargetData(loadedTargets);
      } catch {
        // เงียบ error ไว้ ไม่ให้รบกวนผู้ใช้
      } finally {
        setIsDataLoading(false);
      }
    };

    loadExisting();
  }, [activeKpi, moneyYear]);

  const handleCellChange = (district: string, month: string, value: string) => {
    setGridData((prev) => ({
      ...prev,
      [district]: {
        ...(prev[district] || {}),
        [month]: value,
      },
    }));
  };

  const handleTargetChange = (district: string, value: string) => {
    setTargetData((prev) => ({
      ...prev,
      [district]: value,
    }));
  };

  if (status === 'loading' || !user) {
    return (
      <div className="min-h-screen font-sans" style={{ backgroundColor: '#F0FDF4' }}>
        {/* Skeleton Navbar */}
        <header className="bg-white shadow-sm border-b border-green-100" aria-live="polite" aria-busy="true">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shadow animate-pulse">
                <FileText size={22} />
              </div>
              <div className="space-y-1">
                <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="h-8 bg-gray-200 rounded-full w-40 animate-pulse"></div>
              <div className="flex gap-4">
                <div className="h-8 bg-gray-200 rounded w-28 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Skeleton Main Content */}
        <main className="container mx-auto px-4 py-6" aria-live="polite" aria-busy="true">
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            {/* Skeleton Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col items-center justify-center space-y-3" role="status" aria-live="polite">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                <div className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูลตัวชี้วัด...</div>
                <div className="text-xs text-gray-400">กรุณารอสักครู่</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const rowKeys = activeKpi && activeKpi.level === 'district' ? DISTRICTS : ['จังหวัด'];

  let displayName = '';
  let orgName = '';

  const rawProfile = (session as any)?.user?.profile;
  if (rawProfile) {
    try {
      const profile = JSON.parse(rawProfile as string);

      const prefix =
        profile.title_th ||
        profile.prefix_th ||
        profile.prename ||
        profile.prename_th ||
        '';

      const firstName =
        profile.first_name_th ||
        profile.firstname_th ||
        profile.firstName ||
        profile.given_name ||
        '';
      const lastName =
        profile.last_name_th ||
        profile.lastname_th ||
        profile.lastName ||
        profile.family_name ||
        '';

      const nameCore = `${firstName} ${lastName}`.trim();
      const combined = `${prefix ? prefix + ' ' : ''}${nameCore}`.trim();
      displayName = combined || profile.name_th || profile.name || '';

      orgName =
        profile.position?.organization?.hname_th ||
        profile.organization?.hname_th ||
        profile.hname_th ||
        '';
    } catch (e) {
      // ignore JSON parse errors, fallback to empty display
    }
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#F0FDF4' }}>
      <ReportNavbar displayName={displayName} orgName={orgName} moneyYear={moneyYear} />

      <main className="container mx-auto px-4 py-6">
        <div className="mt-4 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <User size={20} className="text-green-600" />
            กลุ่มงาน {user.department}
          </h2>
          <KPITable
            initialDepartment={user.department}
            hideDepartmentFilter
            showActionColumn
            showHeaderSummary
            moneyYear={moneyYear}
            refreshVersion={saveVersion}
            isLoading={isDataLoading}
            onActionClick={(kpi) => setActiveKpi(kpi)}
          />
        </div>
      </main>
      {activeKpi && (
        <ReportKpiModal
          activeKpi={activeKpi}
          months={MONTHS}
          rowKeys={rowKeys}
          gridData={gridData}
          targetData={targetData}
          moneyYear={moneyYear}
          onClose={() => setActiveKpi(null)}
          onTargetChange={handleTargetChange}
          onCellChange={handleCellChange}
          onSaved={() => setSaveVersion((v) => v + 1)}
        />
      )}
    </div>
  );
}
