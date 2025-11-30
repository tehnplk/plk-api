// Dashboard ส่วนกราฟสถานะตัวชี้วัดรายพื้นที่ (จำนวน)
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface DistrictComparisonItem {
  name: string;
  pass: number;
  fail: number;
  pending: number;
  total: number;
}

export interface Theme {
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

export interface DistrictStatusChartProps {
  districtComparisonData: DistrictComparisonItem[];
  theme: Theme;
}

const DashboardDistrictStatusChart: React.FC<DistrictStatusChartProps> = ({
  districtComparisonData,
  theme,
}) => {
  const maxTotal = React.useMemo(() => {
    if (!districtComparisonData || districtComparisonData.length === 0) {
      return 0;
    }
    return Math.max(...districtComparisonData.map((item) => item.total));
  }, [districtComparisonData]);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          สถานะตัวชี้วัดรายพื้นที่ (จำนวน)
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
            <YAxis
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              domain={[0, maxTotal || 0]}
            />
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
  );
};

export default DashboardDistrictStatusChart;
