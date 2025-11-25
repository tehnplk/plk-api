"use client";

import React from "react";
import { Target } from "lucide-react";

interface ExcellenceItem {
  title: string;
  total: number;
  pass: number;
  fail: number;
  pending: number;
  percent: string | number;
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
  excellenceStats: ExcellenceItem[];
  theme: Theme;
}

const ExcellenceBox = ({ title, total, pass, fail, pending, percent, theme }: any) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-bold text-gray-800 text-sm h-10 flex items-center w-2/3">
        {title}
      </h4>
      <div className="text-right">
        <span className="block text-2xl font-bold" style={{ color: theme.success }}>
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
        <div className="text-xs" style={{ color: theme.success }}>ผ่าน</div>
        <div className="font-bold" style={{ color: theme.success }}>{pass}</div>
      </div>
      <div>
        <div className="text-xs" style={{ color: theme.danger }}>ไม่ผ่าน</div>
        <div className="font-bold" style={{ color: theme.danger }}>{fail}</div>
      </div>
      <div>
        <div className="text-xs" style={{ color: theme.warning }}>รอ</div>
        <div className="font-bold" style={{ color: theme.warning }}>{pending}</div>
      </div>
    </div>

    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{
          width: `${percent}%`,
          backgroundColor:
            Number(percent) >= 80
              ? theme.success
              : Number(percent) >= 50
              ? theme.warning
              : theme.danger,
        }}
      ></div>
    </div>
  </div>
);

const DashboardExcellenceSection: React.FC<Props> = ({ excellenceStats, theme }) => {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Target size={20} className="text-orange-500" />
        สรุปผลการดำเนินงานตามยุทธศาสตร์ (5 Excellence)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {excellenceStats.map((item, idx) => (
          <ExcellenceBox key={idx} {...item} theme={theme} />
        ))}
      </div>
    </div>
  );
};

export default DashboardExcellenceSection;
