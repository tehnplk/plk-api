'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { FileText, CheckCircle, XCircle, AlertCircle, MapPin, Target, Activity, RefreshCw, Database } from 'lucide-react';
import KPITable from '../components/KPITable';
import HomeNavbar from './HomeNavbar';
import { toast } from 'react-toastify';

const THEME = {
  primary: '#00A651',
  secondary: '#A3D9A5',
  accent: '#F59E0B',
  bg: '#F3F4F6',
  white: '#FFFFFF',
  textMain: '#1F2937',
  textLight: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

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

const EXCELLENCE_STRATEGIES = [
  'PP&P Excellence',
  'Service Excellence',
  'People Excellence',
  'Governance Excellence',
  'Health-Related Economy Excellence',
];

const DEFAULT_MONEY_YEAR = Number(
  process.env.NEXT_PUBLIC_MONEY_YEAR,
);

const StatCard = ({ title, value, subtext, color, icon: Icon }: any) => (
  <div
    className="bg-white rounded-xl shadow-sm p-6 border-l-4 transition-all hover:shadow-md"
    style={{ borderLeftColor: color }}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold" style={{ color: THEME.textMain }}>
          {value}
        </h3>
        {subtext && <p className="text-xs mt-2 text-gray-400">{subtext}</p>}
      </div>
      <div
        className={`p-3 rounded-lg bg-opacity-10`}
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={24} color={color} />
      </div>
    </div>
  </div>
);

const ExcellenceBox = ({ title, total, pass, fail, pending, percent }: any) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-bold text-gray-800 text-sm h-10 flex items-center w-2/3">
        {title}
      </h4>
      <div className="text-right">
        <span className="block text-2xl font-bold text-green-600">{percent}%</span>
        <span className="text-xs text-gray-400">ประสิทธิผล</span>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-2 text-center divide-x divide-gray-100">
      <div>
        <div className="text-xs text-gray-400">ทั้งหมด</div>
        <div className="font-bold text-gray-700">{total}</div>
      </div>
      <div>
        <div className="text-xs text-green-500">ผ่าน</div>
        <div className="font-bold text-green-600">{pass}</div>
      </div>
      <div>
        <div className="text-xs text-red-500">ไม่ผ่าน</div>
        <div className="font-bold text-red-600">{fail}</div>
      </div>
      <div>
        <div className="text-xs text-yellow-500">รอ</div>
        <div className="font-bold text-yellow-600">{pending}</div>
      </div>
    </div>

    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{
          width: `${percent}%`,
          backgroundColor:
            percent >= 80
              ? THEME.success
              : percent >= 50
              ? THEME.warning
              : THEME.danger,
        }}
      ></div>
    </div>
  </div>
);

export default function HomePage() {
  const [selectedDistrictScope, setSelectedDistrictScope] = useState('ALL');
  const [mounted, setMounted] = useState(false);
  const [moneyYear, setMoneyYear] = useState<number>(DEFAULT_MONEY_YEAR);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const { data: session } = useSession();

  const handleRefreshKpis = async () => {
    setIsKpiLoading(true);
    
    try {
      console.log('Refreshing KPI data from Google Sheets...');
      const res = await fetch('/api/kpis/db');
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.message || 'Failed to refresh data');
      }
      
      const rows = Array.isArray(json.data) ? json.data : [];
      setKpiData(rows);
      setRefreshCounter(prev => prev + 1);
      
      // Update localStorage cache with fresh data
      if (typeof window !== 'undefined') {
        localStorage.setItem('cachedKpiData', JSON.stringify(rows));
        localStorage.setItem('cachedKpiTimestamp', Date.now().toString());
      }
      
      console.log('KPI data refreshed from Google Sheets');
      
      toast.success('รีเฟรชข้อมูลสำเร็จ', {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (error) {
      console.error('Failed to refresh KPI data:', error);
      
      // Try to restore from cache if API fails
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem('cachedKpiData');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setKpiData(parsedData);
            console.log(`Using cache as fallback after refresh failed: ${parsedData.length} records`);
            toast.warning('ใช้ข้อมูลเก่าจากแคช กรุณารีเฟรชเพื่อข้อมูลล่าสุด', {
              position: "top-right",
              autoClose: 5000,
              theme: "colored",
            });
          } else {
            toast.error('รีเฟรชข้อมูลล้มเหลว ไม่มีข้อมูลสำรอง', {
              position: "top-right",
              autoClose: 5000,
              theme: "colored",
            });
          }
        } catch (fallbackError) {
          console.warn('Fallback cache read failed:', fallbackError);
          toast.error('รีเฟรชข้อมูลล้มเหลว กรุณาลองใหม่', {
            position: "top-right",
            autoClose: 5000,
            theme: "colored",
          });
        }
      } else {
        toast.error('รีเฟรชข้อมูลล้มเหลว กรุณาลองใหม่', {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
      }
    } finally {
      setIsKpiLoading(false);
    }
  };

  // Load KPI data from Google Sheets API
  const loadKpiData = async () => {
    setIsKpiLoading(true);
    
    try {
      // Check if data exists in localStorage first
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem('cachedKpiData');
          const cachedTimestamp = localStorage.getItem('cachedKpiTimestamp');
          
          // Use cached data if less than 5 minutes old
          if (cachedData && cachedTimestamp) {
            const age = Date.now() - parseInt(cachedTimestamp);
            if (age < 5 * 60 * 1000) { // 5 minutes
              const parsedData = JSON.parse(cachedData);
              setKpiData(parsedData);
              console.log(`Loaded ${parsedData.length} KPI records from localStorage cache`);
              setIsKpiLoading(false);
              return;
            }
          }
        } catch (localStorageError) {
          console.warn('localStorage read failed, proceeding with API call:', localStorageError);
        }
      }
      
      console.log('Fetching KPI data from Google Sheets API...');
      
      // Add frontend timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Frontend timeout triggered, aborting request...');
        controller.abort();
      }, 12000); // 12 second frontend timeout
      
      const res = await fetch('/api/kpis/db', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch data');
      }
      
      const rows = Array.isArray(json.data) ? json.data : [];
      setKpiData(rows);
      
      // Save to localStorage for future use
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cachedKpiData', JSON.stringify(rows));
          localStorage.setItem('cachedKpiTimestamp', Date.now().toString());
        } catch (localStorageError) {
          console.warn('localStorage write failed:', localStorageError);
        }
      }
      
      console.log(`Loaded ${rows.length} KPI records from Google Sheets`);
      
    } catch (error) {
      console.error('Failed to fetch KPI data from Google Sheets:', error);
      
      // Fallback to expired cache if API fails
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem('cachedKpiData');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setKpiData(parsedData);
            console.log(`Using expired cache as fallback: ${parsedData.length} records`);
            toast.warning('ใช้ข้อมูลเก่าจากแคช กรุณารีเฟรชเพื่อข้อมูลล่าสุด', {
              position: "top-right",
              autoClose: 5000,
              theme: "colored",
            });
            setIsKpiLoading(false);
            return;
          }
        } catch (fallbackError) {
          console.warn('Fallback cache read failed:', fallbackError);
        }
      }
      
      let errorMessage = 'โหลดข้อมูลจาก Google Sheets ล้มเหลว';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
    } finally {
      setIsKpiLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
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

    // Load KPI data from Google Sheets API
    loadKpiData();
  }, []);

  // Cache departments from KPI data
  useEffect(() => {
    if (kpiData.length > 0 && typeof window !== 'undefined') {
      const set = new Set<string>();
      kpiData.forEach((item: any) => {
        const dept = String(item.ssj_department ?? '').trim();
        if (dept) set.add(dept);
      });
      const list = Array.from(set);
      try {
        window.localStorage.setItem('cachedDepartments', JSON.stringify(list));
      } catch {
        // ignore localStorage errors
      }
    }
  }, [kpiData]);

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

  const stats = useMemo(() => {
    const total = 25;
    const pass = Math.floor(Math.random() * 10) + 10;
    const fail = Math.floor(Math.random() * 5) + 3;
    const pending = Math.max(total - pass - fail, 0);
    const effectiveDenominator = Math.max(total - pending, 1);
    const percentPass = ((pass / effectiveDenominator) * 100).toFixed(1);

    const districtData = DISTRICTS.map((d) => ({
      name: d,
      percent: Math.floor(Math.random() * 40 + 60),
    }));

    const districtComparisonData = DISTRICTS.map((d) => {
      const passCount = Math.floor(Math.random() * 15) + 5;
      const failCount = Math.floor(Math.random() * 5);
      const pendingCount = Math.floor(Math.random() * 5);
      return {
        name: d,
        pass: passCount,
        fail: failCount,
        pending: pendingCount,
        total: passCount + failCount + pendingCount,
      };
    });

    const excellenceStats = EXCELLENCE_STRATEGIES.map((strat) => {
      const baseTotal = Math.floor(Math.random() * 5) + 3;
      const basePass = Math.floor(baseTotal * (Math.random() * 0.4 + 0.4));
      const baseFail = Math.floor((baseTotal - basePass) * Math.random());
      const basePending = Math.max(baseTotal - basePass - baseFail, 0);
      const denom = Math.max(baseTotal - basePending, 1);
      return {
        title: strat,
        total: baseTotal,
        pass: basePass,
        fail: baseFail,
        pending: basePending,
        percent: ((basePass / denom) * 100).toFixed(0),
      };
    });

    return {
      total,
      pass,
      fail,
      pending,
      percentPass,
      districtData,
      districtComparisonData,
      excellenceStats,
    };
  }, [selectedDistrictScope]);

  let displayName = '';
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
    } catch (e) {
      // ignore JSON parse errors
    }
  }

  if (!displayName && session?.user?.name) {
    displayName = session.user.name;
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#F0FDF4' }}>
      <HomeNavbar moneyYear={moneyYear} session={session} displayName={displayName} />

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Database size={24} className="text-green-600" />
                รายการตัวชี้วัด KPI
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-gray-600">
                  ปีงบประมาณ {moneyYear}
                </p>
                <p className="text-sm text-gray-500">
                  ข้อมูลจาก Google Sheets API
                </p>
                {isKpiLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <RefreshCw size={14} className="animate-spin" />
                    กำลังโหลด...
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                value={selectedDistrictScope}
                onChange={(e) => setSelectedDistrictScope(e.target.value)}
              >
                <option value="ALL">ภาพรวมจังหวัด (ทุกอำเภอ)</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    อำเภอ{d}
                  </option>
                ))}
              </select>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition-colors">
                แสดงผล
              </button>
              <button 
                onClick={handleRefreshKpis}
                disabled={isKpiLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isKpiLoading ? 'animate-spin' : ''} />
                รีเฟรชข้อมูล
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              title={
                selectedDistrictScope === 'ALL'
                  ? 'ตัวชี้วัดจังหวัด'
                  : 'ตัวชี้วัดที่เกี่ยวข้อง'
              }
              value={stats.total}
              color={THEME.textMain}
              icon={FileText}
            />
            <StatCard
              title="ผ่านเกณฑ์"
              value={stats.pass}
              color={THEME.success}
              icon={CheckCircle}
            />
            <StatCard
              title="ไม่ผ่านเกณฑ์"
              value={stats.fail}
              color={THEME.danger}
              icon={XCircle}
            />
            <StatCard
              title="รอประเมิน"
              value={stats.pending}
              color={THEME.warning}
              icon={AlertCircle}
            />
            <StatCard
              title="ร้อยละความสำเร็จ"
              value={`${stats.percentPass}%`}
              subtext={
                selectedDistrictScope === 'ALL'
                  ? 'ภาพรวมจังหวัด'
                  : `ภาพรวม${selectedDistrictScope}`
              }
              color={THEME.primary}
              icon={Activity}
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target size={20} className="text-orange-500" /> สรุปผลการดำเนินงานตามยุทธศาสตร์ (5
              Excellence)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.excellenceStats.map((item: any, idx: number) => (
                <ExcellenceBox key={idx} {...item} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  ร้อยละตัวชี้วัดผ่านเกณฑ์ (รายอำเภอ)
                </h3>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.districtData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      cursor={{ fill: '#f0fdf4' }}
                    />
                    <Bar
                      dataKey="percent"
                      name="% ผ่านเกณฑ์"
                      fill={THEME.primary}
                      radius={[4, 4, 0, 0]}
                    >
                      {stats.districtData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.name === selectedDistrictScope
                              ? THEME.accent
                              : entry.percent < 50
                              ? THEME.danger
                              : entry.percent < 80
                              ? THEME.warning
                              : THEME.primary
                          }
                          stroke={
                            entry.name === selectedDistrictScope
                              ? THEME.textMain
                              : 'none'
                          }
                          strokeWidth={
                            entry.name === selectedDistrictScope ? 2 : 0
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  สถานะตัวชี้วัดรายอำเภอ (จำนวน)
                </h3>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.districtComparisonData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      cursor={{ fill: '#f0fdf4' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar
                      dataKey="pass"
                      name="ผ่าน"
                      stackId="a"
                      fill={THEME.success}
                    />
                    <Bar
                      dataKey="fail"
                      name="ไม่ผ่าน"
                      stackId="a"
                      fill={THEME.danger}
                    />
                    <Bar
                      dataKey="pending"
                      name="รอประเมิน"
                      stackId="a"
                      fill={THEME.warning}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <KPITable 
            key={refreshCounter}
            data={kpiData.map((item: any) => ({
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
            }))}
            moneyYear={moneyYear}
            refreshVersion={refreshVersion}
            showHeaderSummary
            showRowCountSummary 
          />
        </div>
      </main>
    </div>
  );
}


