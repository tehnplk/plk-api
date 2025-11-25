// Dashboard ส่วนสรุปตัวชี้วัดภาพรวม (Summary Section)
"use client";

import React from "react";
import { Database, RefreshCw, FileText, CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react";

interface SummaryStats {
  total: number;
  pass: number;
  fail: number;
  pending: number;
  percentPass: string; // already formatted string
}

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  white: string;
  textMain: string;
  textLight: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
}

interface Props {
  moneyYear: number;
  isKpiLoading: boolean;
  selectedDistrictScope: string;
  stats: SummaryStats;
  theme: Theme;
}

const StatCard = ({ title, value, subtext, color, icon: Icon }: any) => (
  <div
    className="bg-white rounded-xl shadow-sm p-6 border-l-4 transition-all hover:shadow-md"
    style={{ borderLeftColor: color }}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold" style={{ color: "#1F2937" }}>
          {value}
        </h3>
        {subtext && <p className="text-xs mt-2 text-gray-400">{subtext}</p>}
      </div>
      <div
        className="p-3 rounded-lg bg-opacity-10"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={24} color={color} />
      </div>
    </div>
  </div>
);

const DashboardSummarySection: React.FC<Props> = ({
  moneyYear,
  isKpiLoading,
  selectedDistrictScope,
  stats,
  theme,
}) => {
  return (
    <>
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
              ? "ตัวชี้วัด"
              : "ตัวชี้วัดที่เกี่ยวข้อง"
          }
          value={stats.total}
          color={theme.textMain}
          icon={FileText}
        />
        <StatCard
          title="ผ่านเกณฑ์"
          value={stats.pass}
          color={theme.success}
          icon={CheckCircle}
        />
        <StatCard
          title="ไม่ผ่านเกณฑ์"
          value={stats.fail}
          color={theme.danger}
          icon={XCircle}
        />
        <StatCard
          title="รอประเมิน"
          value={stats.pending}
          color={theme.warning}
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
          color={theme.primary}
          icon={Activity}
        />
      </div>
    </>
  );
};

export default DashboardSummarySection;
