"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DistrictDataItem {
  name: string;
  percent: number;
}

interface DistrictComparisonItem {
  name: string;
  pass: number;
  fail: number;
  pending: number;
  total: number;
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
  selectedDistrictScope: string;
  districtData: DistrictDataItem[];
  districtComparisonData: DistrictComparisonItem[];
  theme: Theme;
}

const DashboardDistrictChartsSection: React.FC<Props> = ({
  selectedDistrictScope,
  districtData,
  districtComparisonData,
  theme,
}) => {
  return (
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
              data={districtData}
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
                fill={theme.primary}
                radius={[4, 4, 0, 0]}
              >
                {districtData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === selectedDistrictScope
                        ? theme.accent
                        : entry.percent < 50
                        ? theme.danger
                        : entry.percent < 80
                        ? theme.warning
                        : theme.primary
                    }
                    stroke={
                      entry.name === selectedDistrictScope ? theme.textMain : "none"
                    }
                    strokeWidth={entry.name === selectedDistrictScope ? 2 : 0}
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
              data={districtComparisonData}
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
                fill={theme.success}
              />
              <Bar
                dataKey="fail"
                name="ไม่ผ่าน"
                stackId="a"
                fill={theme.danger}
              />
              <Bar
                dataKey="pending"
                name="รอประเมิน"
                stackId="a"
                fill={theme.warning}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardDistrictChartsSection;
