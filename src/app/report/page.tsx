'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, FileText, RefreshCw, Database } from 'lucide-react';
import KPITable, { KPIItem as TableKPIItem } from '../components/KPITable';
import ReportNavbar from './ReportNavbar';
import ReportKpiModal from './ReportKpiModal';
import { toast } from 'react-toastify';
import { DISTRICTS, DEFAULT_MONEY_YEAR } from '@/config/constants';

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
  const [sumResultData, setSumResultData] = useState<TargetData>({});
  const [rateData, setRateData] = useState<TargetData>({});
  const [moneyYear, setMoneyYear] = useState<number>(DEFAULT_MONEY_YEAR);
  const [saveVersion, setSaveVersion] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Add state for KPI data
  const [kpiData, setKpiData] = useState<any[]>([]);

  // Load KPI data from database
  const loadKpiData = async () => {
    try {
      console.log('Fetching KPI data from database...');
      const res = await fetch('/api/kpis/db');
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch data');
      }
      
      const rows = Array.isArray(json) ? json : json.data ?? [];
      setKpiData(rows);
      setLastSyncedAt(json.lastSyncedAt ? new Date(json.lastSyncedAt) : null);
      console.log(`Loaded ${rows.length} KPI records from database`);
      
    } catch (error) {
      console.error('Failed to fetch KPI data from database:', error);
      toast.error('โหลดข้อมูลจากฐานข้อมูลล้มเหลว', {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
    }
  };

  // Get KPI data from database in the right format for KPITable (memoized)
  const cachedKpiData = useMemo(() => {
    return kpiData.map((item: any) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      excellence: String(item.excellence ?? ''),
      criteria: String(item.evaluation_criteria ?? ''),
      level: item.area_level === 'อำเภอ' ? 'district' as const : 'province' as const,
      department: String(item.ssj_department ?? ''),
      result: null,
      status: 'pending' as const,
      target: typeof item.target_result === 'number' ? item.target_result : undefined,
      lastUpdated: undefined,
      isMophKpi: String(item.is_moph_kpi ?? '').toUpperCase() === 'YES',
      divideNumber: typeof item.divide_number === 'number' ? item.divide_number : 
                   typeof item.divide_number === 'string' ? parseFloat(item.divide_number) || undefined : undefined,
      condition: String(item.condition ?? ''),
      sumResult: String(item.sum_result ?? ''),
      ssjPm: String(item.ssj_pm ?? ''),
      mophDepartment: String(item.moph_department ?? ''),
    }));
  }, [kpiData, saveVersion, refreshCounter]);

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

    // Check cache age for display
    if (lastSyncedAt) {
      console.log('Last synced at:', lastSyncedAt);
    }

    // Load KPI data from database
    loadKpiData();
  }, [router, status, session]);

  const handleRefreshKpis = async () => {
    try {
      console.log('Refreshing KPI data from database...');
      const res = await fetch('/api/kpis/db');
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.message || 'Failed to refresh data');
      }
      
      const rows = Array.isArray(json) ? json : json.data ?? [];
      setKpiData(rows);
      setLastSyncedAt(json.lastSyncedAt ? new Date(json.lastSyncedAt) : null);
      setRefreshCounter(prev => prev + 1);
      
      console.log('KPI data refreshed from database');
      
      toast.success('รีเฟรชข้อมูลสำเร็จ', {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (error) {
      console.error('Failed to refresh KPI data:', error);
      toast.error('รีเฟรชข้อมูลล้มเหลว กรุณาลองใหม่', {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
    }
  };

  const handleSyncKpis = async () => {
    setIsSyncing(true);
    
    try {
      console.log('Syncing KPI data from Google Sheets...');
      const res = await fetch('/api/kpis/sync', { method: 'POST' });
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.message || 'Failed to sync data');
      }
      
      console.log('Sync completed, refreshing data...');
      
      // After sync, refresh data from database
      await handleRefreshKpis();
      
      toast.success(`ซิงค์ข้อมูลสำเร็จ: ${json.count} รายการ`, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (error) {
      console.error('Failed to sync KPI data:', error);
      toast.error('ซิงค์ข้อมูลล้มเหลว กรุณาลองใหม่', {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Format last sync time for display
  const formatLastSynced = (date: Date | null) => {
    if (!date) return 'ยังไม่เคยซิงค์';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'เพิ่งซิงค์';
    if (diffMins < 60) return `ซิงค์ ${diffMins} นาทีที่แล้ว`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `ซิงค์ ${diffHours} ชั่วโมงที่แล้ว`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `ซิงค์ ${diffDays} วันที่แล้ว`;
  };

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
    const sumResults: TargetData = {};
    const rates: TargetData = {};
    const rowKeys = activeKpi.level === 'district' ? DISTRICTS : ['จังหวัด'];

    rowKeys.forEach((key) => {
      initial[key] = {};
      targets[key] = '';
      sumResults[key] = '';
      rates[key] = '';
      MONTHS.forEach((m) => {
        initial[key][m] = '';
      });
    });
    setGridData(initial);
    setTargetData(targets);
    setSumResultData(sumResults);
    setRateData(rates);

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
        const loadedSumResults: TargetData = {};
        const loadedRates: TargetData = {};

        for (const row of json.data as any[]) {
          const area = row.area_name as string;
          if (!rowKeys.includes(area)) continue;

          if (row.kpi_target != null && !Number.isNaN(row.kpi_target)) {
            const t = Number(row.kpi_target);
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

          // Load sum_result and rate fields
          if (row.sum_result != null && row.sum_result !== '') {
            loadedSumResults[area] = String(row.sum_result);
          }
          
          if (row.rate != null && !Number.isNaN(row.rate)) {
            const r = Number(row.rate);
            loadedRates[area] = r === 0 ? '' : String(r);
          }
        }

        setGridData(loadedGrid);
        setTargetData(loadedTargets);
        setSumResultData(loadedSumResults);
        setRateData(loadedRates);
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

  const handleSumResultChange = (district: string, value: string) => {
    setSumResultData((prev) => ({
      ...prev,
      [district]: value,
    }));
  };

  const handleRateChange = (district: string, value: string) => {
    setRateData((prev) => ({
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
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <User size={20} className="text-green-600" />
              กลุ่มงาน {user.department}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {formatLastSynced(lastSyncedAt)}
              </span>
              <button 
                onClick={handleSyncKpis}
                disabled={isSyncing}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Database size={16} className={isSyncing ? 'animate-pulse' : ''} />
                ซิงค์จาก Google Sheets
              </button>
              <button 
                onClick={handleRefreshKpis}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                รีเฟรชข้อมูล
              </button>
            </div>
          </div>
          <KPITable
            key={refreshCounter}
            data={cachedKpiData}
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
          sumResultData={sumResultData}
          rateData={rateData}
          moneyYear={moneyYear}
          onClose={() => setActiveKpi(null)}
          onTargetChange={handleTargetChange}
          onCellChange={handleCellChange}
          onSumResultChange={handleSumResultChange}
          onRateChange={handleRateChange}
          onSaved={() => setSaveVersion((prev) => prev + 1)}
        />
      )}
    </div>
  );
}
