'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
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
import {
  LayoutDashboard,
  FileText,
  LogIn,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Target,
  User,
} from 'lucide-react';
import KPITable from '../components/KPITable';

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

const DEFAULT_MONEY_YEAR = 2569;

const DEPARTMENTS = [
  { id: 'D01', name: 'กลุ่มงานยุทธศาสตร์ฯ' },
  { id: 'D02', name: 'กลุ่มงานควบคุมโรค' },
  { id: 'D03', name: 'กลุ่มงานส่งเสริมสุขภาพ' },
  { id: 'D04', name: 'กลุ่มงานบริหารทรัพยากรบุคคล' },
  { id: 'D05', name: 'กลุ่มงานทันตสาธารณสุข' },
];

const generateMockKPIs = () => {
  const kpis: any[] = [];
  for (let i = 1; i <= 25; i++) {
    const level = Math.random() > 0.4 ? 'district' : 'province';
    const statusRandom = Math.random();
    let status: 'pass' | 'fail' | 'pending' = 'pending';
    if (statusRandom > 0.6) status = 'pass';
    else if (statusRandom > 0.3) status = 'fail';

    const criteriaTypes = ['> 80%', '< 5 ต่อแสนประชากร', 'ผ่านเกณฑ์ระดับ 5', '> 90%', '100%'];
    const criteria =
      criteriaTypes[Math.floor(Math.random() * criteriaTypes.length)];

    kpis.push({
      id: `KPI-${String(i).padStart(3, '0')}`,
      name: `ตัวชี้วัดที่ ${i} : ${
        level === 'district'
          ? 'อัตราการครอบคลุมวัคซีน (รายอำเภอ)'
          : 'ร้อยละความพึงพอใจผู้รับบริการ (จังหวัด)'
      }`,
      level,
      excellence:
        EXCELLENCE_STRATEGIES[
          Math.floor(Math.random() * EXCELLENCE_STRATEGIES.length)
        ],
      department:
        DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)].name,
      criteria,
      target: 80,
      result:
        status === 'pending'
          ? null
          : (Math.random() * 20 + 70).toFixed(2),
      status,
      lastUpdated: '15 พ.ย. 68',
    });
  }
  return kpis;
};

const mockKPIs = generateMockKPIs();

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
  const { data: session } = useSession();

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
  }, []);

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
    const total = mockKPIs.length;
    const pass = mockKPIs.filter((k) => k.status === 'pass').length;
    const fail = mockKPIs.filter((k) => k.status === 'fail').length;
    const pending = mockKPIs.filter((k) => k.status === 'pending').length;
    const percentPass =
      total > 0 ? ((pass / (total - pending)) * 100).toFixed(1) : 0;

    let districtData = DISTRICTS.map((d) => ({
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
      const group = mockKPIs.filter((k) => k.excellence === strat);
      const gTotal = group.length;
      const gPass = group.filter((k) => k.status === 'pass').length;
      const gFail = group.filter((k) => k.status === 'fail').length;
      const gPending = group.filter((k) => k.status === 'pending').length;
      const denominator = gTotal - gPending;
      return {
        title: strat,
        total: gTotal,
        pass: gPass,
        fail: gFail,
        pending: gPending,
        percent:
          denominator > 0 ? ((gPass / denominator) * 100).toFixed(0) : 0,
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
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-green-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shadow">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-green-800 leading-tight">
                PHITSANULOK KPI
              </h1>
              <p className="text-xs text-green-600 hidden md:block">
                ระบบรายงานตัวชี้วัด สสจ.พิษณุโลก ปีงบประมาณ {moneyYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {session && displayName && (
              <div className="hidden md:flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-xs text-blue-700 shadow-sm max-w-[220px]">
                <User size={14} className="text-blue-600" />
                <span className="font-semibold text-[11px] md:text-xs truncate">
                  {displayName}
                </span>
              </div>
            )}
            {session ? (
              <>
                <Link
                  href="/report"
                  className="hidden md:flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-all shadow-sm text-sm font-medium"
                >
                  <LayoutDashboard size={16} /> เข้าสู่ระบบรายงาน
                </Link>
                <button
                  onClick={() => signOut({ redirectTo: '/login' })}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 border border-red-200 px-3 py-1 rounded-full"
                >
                  <LogIn size={16} /> Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm text-sm font-medium"
              >
                <LogIn size={16} /> เข้าสู่ระบบรายงาน
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="text-green-600" size={20} />
              <span className="text-sm font-bold text-gray-700">พื้นที่รายงาน:</span>
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

          <KPITable showRowCountSummary />
        </div>
      </main>
    </div>
  );
}


