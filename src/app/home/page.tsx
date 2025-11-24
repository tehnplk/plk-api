"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
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
} from "recharts";
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Target,
  Activity,
  RefreshCw,
  Database,
} from "lucide-react";
import KPITable from "../components/KPITable";
import HomeNavbar from "./HomeNavbar";
import ReportKpiModal from "../components/ReportKpiModal";
import { toast } from "react-toastify";
import { kpiDataCache, transformKpiData } from "../../utils/kpiDataCache";

const THEME = {
  primary: "#00A651",
  secondary: "#A3D9A5",
  accent: "#F59E0B",
  bg: "#F3F4F6",
  white: "#FFFFFF",
  textMain: "#1F2937",
  textLight: "#6B7280",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};

const DISTRICTS = [
  "เมืองพิษณุโลก",
  "นครไทย",
  "ชาติตระการ",
  "บางระกำ",
  "บางกระทุ่ม",
  "พรหมพิราม",
  "วัดโบสถ์",
  "วังทอง",
  "เนินมะปราง",
];

const EXCELLENCE_STRATEGIES = [
  "PP&P Excellence",
  "Service Excellence",
  "People Excellence",
  "Governance Excellence",
  "Health-Related Economy Excellence",
];

const DEFAULT_MONEY_YEAR = Number(process.env.NEXT_PUBLIC_MONEY_YEAR);

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
        <span className="block text-2xl font-bold text-green-600">
          {percent}%
        </span>
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
  const [selectedDistrictScope, setSelectedDistrictScope] = useState("ALL");
  const [mounted, setMounted] = useState(false);
  const [moneyYear, setMoneyYear] = useState<number>(DEFAULT_MONEY_YEAR);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const { data: session } = useSession();

  // Department filtering state
  const [selectedDepartment, setSelectedDepartment] = useState("ทั้งหมด");

  // Parse user profile from session to get department
  const userProfile = useMemo(() => {
    try {
      return JSON.parse((session as any)?.user?.profile || '{}');
    } catch {
      return {};
    }
  }, [session]);

  // Set department filter based on login selection
  useEffect(() => {
    if (session && userProfile?.organization?.[0]?.position) {
      setSelectedDepartment(userProfile.organization[0].position);
    }
  }, [session, userProfile]);

  // Handle district change with scroll to top
  const handleDistrictChange = (district: string) => {
    setSelectedDistrictScope(district);
    // Scroll to top when district changes
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Extract unique departments and filter data from cache
  const departmentOptions = useMemo(() => {
    // Get data directly from cache for distinct departments
    const cacheData = kpiDataCache.getCachedData();
    const departments = Array.from(
      new Set(
        (cacheData || kpiData)
          .map((item) => item.ssj_department)
          .filter(Boolean)
      )
    );
    return departments.sort();
  }, [kpiData]);

  const filteredKpiData = useMemo(() => {
    if (selectedDepartment === "ทั้งหมด") {
      return kpiData;
    }
    return kpiData.filter((item) => item.ssj_department === selectedDepartment);
  }, [kpiData, selectedDepartment]);

  // Add state for modal functionality
  const [activeKpi, setActiveKpi] = useState<any>(null);
  const [gridData, setGridData] = useState<
    Record<string, Record<string, string>>
  >({});
  const [targetData, setTargetData] = useState<Record<string, string>>({});
  const [sumResultData, setSumResultData] = useState<Record<string, string>>(
    {}
  );
  const [rateData, setRateData] = useState<Record<string, string>>({});
  const [saveVersion, setSaveVersion] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  const handleRefreshKpis = async () => {
    await loadKpiData(true); // Force refresh
  };

  const loadKpiData = async (forceRefresh: boolean = false) => {
    setIsKpiLoading(true);

    try {
      const data = await kpiDataCache.loadData(forceRefresh);
      setKpiData(data);
      setRefreshCounter((prev) => prev + 1);

      if (forceRefresh) {
        console.log("KPI data refreshed from Google Sheets");
        toast.success("ข้อมูล KPI อัปเดตเรียบร้อย", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Failed to load KPI data:", error);

      // Try to get any cached data as fallback
      const fallbackData = kpiDataCache.getCachedData();
      if (fallbackData) {
        setKpiData(fallbackData);
        toast.warning("ใช้ข้อมูลเก่าจากแคช กรุณารีเฟรชเพื่อข้อมูลล่าสุด", {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        toast.error("ไม่สามารถโหลดข้อมูล KPI ได้ กรุณาลองใหม่", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } finally {
      setIsKpiLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    // load fiscal year from server config
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data?.moneyYear && typeof data.moneyYear === "number") {
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
    if (kpiData.length > 0 && typeof window !== "undefined") {
      const set = new Set<string>();
      kpiData.forEach((item: any) => {
        const dept = String(item.ssj_department ?? "").trim();
        if (dept) set.add(dept);
      });
      const list = Array.from(set);
      try {
        window.localStorage.setItem("cachedDepartments", JSON.stringify(list));
      } catch {
        // ignore localStorage errors
      }
    }
  }, [kpiData]);

  // Modal data loading logic
  useEffect(() => {
    if (!activeKpi) {
      setGridData({});
      setTargetData({});
      setSumResultData({});
      setRateData({});
      return;
    }

    // Initialize empty grid when a KPI is activated
    const initial: Record<string, Record<string, string>> = {};
    const targets: Record<string, string> = {};
    const sumResults: Record<string, string> = {};
    const rates: Record<string, string> = {};
    const rowKeys = activeKpi.level === "district" ? DISTRICTS : ["จังหวัด"];

    rowKeys.forEach((key) => {
      initial[key] = {};
      targets[key] = "";
      sumResults[key] = "";
      rates[key] = "";
      MONTHS.forEach((m) => {
        initial[key][m] = "";
      });
    });
    setGridData(initial);
    setTargetData(targets);
    setSumResultData(sumResults);
    setRateData(rates);

    // Mockup mode - no database loading
    setIsDataLoading(false);
  }, [activeKpi, moneyYear]);

  // Modal change handlers
  const handleTargetChange = (district: string, value: string) => {
    setTargetData((prev) => ({ ...prev, [district]: value }));
  };

  const handleCellChange = (district: string, month: string, value: string) => {
    setGridData((prev) => ({
      ...prev,
      [district]: { ...prev[district], [month]: value },
    }));
  };

  const handleSumResultChange = (district: string, value: string) => {
    setSumResultData((prev) => ({ ...prev, [district]: value }));
  };

  const handleRateChange = (district: string, value: string) => {
    setRateData((prev) => ({ ...prev, [district]: value }));
  };

  // Format last sync time for display
  const formatLastSynced = (date: Date | null) => {
    if (!date) return "ยังไม่เคยซิงค์";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "เพิ่งซิงค์";
    if (diffMins < 60) return `ซิงค์ ${diffMins} นาทีที่แล้ว`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `ซิงค์ ${diffHours} ชั่วโมงที่แล้ว`;

    const diffDays = Math.floor(diffHours / 24);
    return `ซิงค์ ${diffDays} วันที่แล้ว`;
  };

  const yearShortPrev = ((moneyYear - 1) % 100).toString().padStart(2, "0");
  const yearShortCurr = (moneyYear % 100).toString().padStart(2, "0");
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

  let displayName = "";
  const rawProfile = (session as any)?.user?.profile;
  if (rawProfile) {
    try {
      const profile = JSON.parse(rawProfile as string);

      const prefix =
        profile.title_th ||
        profile.prefix_th ||
        profile.prename ||
        profile.prename_th ||
        "";

      const firstName =
        profile.first_name_th ||
        profile.firstname_th ||
        profile.firstName ||
        profile.given_name ||
        "";
      const lastName =
        profile.last_name_th ||
        profile.lastname_th ||
        profile.lastName ||
        profile.family_name ||
        "";
      const nameCore = `${firstName} ${lastName}`.trim();
      const combined = `${prefix ? prefix + " " : ""}${nameCore}`.trim();
      displayName = combined || profile.name_th || profile.name || "";
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
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: "#F0FDF4" }}
    >
      <HomeNavbar
        moneyYear={moneyYear}
        session={session}
        displayName={displayName}
        onRefresh={handleRefreshKpis}
        showRefreshButton={true}
        isRefreshing={isKpiLoading}
        selectedDistrict={selectedDistrictScope}
        onDistrictChange={handleDistrictChange}
        districtOptions={DISTRICTS}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Database size={24} className="text-green-600" />
                ตัวชี้วัดปีงบประมาณ {moneyYear}
              </h2>

              {isKpiLoading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <RefreshCw size={14} className="animate-spin" />
                  กำลังโหลด...
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              title={
                selectedDistrictScope === "ALL"
                  ? "ตัวชี้วัดจังหวัด"
                  : "ตัวชี้วัดที่เกี่ยวข้อง"
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
                selectedDistrictScope === "ALL"
                  ? "ภาพรวมจังหวัด"
                  : `ภาพรวม${selectedDistrictScope}`
              }
              color={THEME.primary}
              icon={Activity}
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target size={20} className="text-orange-500" />{" "}
              สรุปผลการดำเนินงานตามยุทธศาสตร์ (5 Excellence)
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
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      cursor={{ fill: "#f0fdf4" }}
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
                              : "none"
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
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      cursor={{ fill: "#f0fdf4" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
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

          <div id="kpi-table-section">
            <KPITable
              key={refreshCounter}
              data={filteredKpiData.map((item: any) => ({
                id: String(item.id ?? ""),
                name: String(item.name ?? ""),
                excellence: String(item.excellence ?? ""),
                criteria: String(item.evaluation_criteria ?? ""),
                level:
                  item.area_level === "อำเภอ"
                    ? ("district" as const)
                    : ("province" as const),
                department: String(item.ssj_department ?? ""),
                result:
                  item.sum_result != null ? String(item.sum_result) : null, // ดึงจาก sum_result ใน google sheet (รวมค่า 0)
                status: "pending" as const,
                target:
                  typeof item.target_result === "number"
                    ? item.target_result
                    : undefined,
                lastUpdated: undefined,
                isMophKpi:
                  String(item.is_moph_kpi ?? "").toUpperCase() === "YES",
                divideNumber:
                  typeof item.divide_number === "number"
                    ? item.divide_number
                    : typeof item.divide_number === "string"
                    ? parseFloat(item.divide_number) || undefined
                    : undefined,
                condition: String(item.condition ?? ""),
                sumResult: String(item.sum_result ?? ""),
                ssjPm: String(item.ssj_pm ?? ""),
                mophDepartment: String(item.moph_department ?? ""),
              }))}
              moneyYear={moneyYear}
              refreshVersion={refreshVersion}
              showHeaderSummary
              showRowCountSummary
              disableDatabaseFetch={true} // ไม่ต้องดึงข้อมูลจาก database ผ่าน prisma
              showActionColumn={session ? true : false} // แสดง action column เมื่อ auth ผ่านแล้ว
              onActionClick={(kpi) => setActiveKpi(kpi)} // เปิด modal เมื่อคลิกปุ่มบันทึก
            />
          </div>
        </div>
      </main>
      {activeKpi && (
        <ReportKpiModal
          activeKpi={activeKpi}
          months={MONTHS}
          rowKeys={activeKpi.level === "district" ? DISTRICTS : ["จังหวัด"]}
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
          onSaved={() => {
            setSaveVersion((prev) => prev + 1);
            setActiveKpi(null);
          }}
        />
      )}
    </div>
  );
}
