// Dashboard หน้าหลักสรุปตัวชี้วัด KPI จังหวัดพิษณุโลก
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { EXCELLENCE_MAP } from "@/constants/excellence";

import DashboardSummarySection from "./DashboardSummarySection";
import DashboardExcellenceSection from "./DashboardExcellenceSection";
import DashboardDistrictChartsSection from "./DashboardDistrictChartsSection";

const THEME = {
  primary: "#10B981",
  secondary: "#34D399",
  accent: "#059669",
  bg: "#F3F4F6",
  white: "#FFFFFF",
  textMain: "#1F2937",
  textLight: "#6B7280",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#A7F3D0",
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

const DEFAULT_MONEY_YEAR = Number(process.env.NEXT_PUBLIC_MONEY_YEAR);

interface DashboardProps {
  selectedDistrictScope: string;
  moneyYear: number;
  isKpiLoading: boolean;
  onRefresh: () => void;
}

export default function Dashboard({ 
  selectedDistrictScope, 
  moneyYear, 
  isKpiLoading, 
  onRefresh 
}: DashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [districtData, setDistrictData] = useState<{ name: string; percent: number }[]>([]);
  const [districtComparisonData, setDistrictComparisonData] = useState<{
    name: string;
    pass: number;
    fail: number;
    pending: number;
    total: number;
  }[]>([]);
  const [districtExcellenceData, setDistrictExcellenceData] = useState<{
    name: string;
    excellenceStats: {
      title: string;
      total: number;
      pass: number;
      fail: number;
      pending: number;
      percent: string | number;
    }[];
  }[]>([]);

  const handleRefreshKpis = async () => {
    await loadKpiData(true, selectedDistrictScope); // Force refresh with district filter
    onRefresh(); // Notify parent
  };

  const handleSyncFromGoogleSheets = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/kpi/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Sync สำเร็จ! อัปเดต ${result.count} รายการ`, {
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh data after sync
        await handleRefreshKpis();
      } else {
        toast.error(`Sync ล้มเหลว: ${result.message}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync ล้มเหลว กรุณาลองใหม่', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const loadKpiData = async (forceRefresh: boolean = false, areaName?: string) => {
    try {
      // ใช้ API ใหม่ /api/kpi/dashboard ที่คำนวณสถานะจาก kpi_report โดยใช้ SUM/GROUP BY
      const params = new URLSearchParams();
      params.set('moneyYear', String(moneyYear));
      if (areaName && areaName !== 'ALL') {
        params.set('areaName', areaName);
      }
      
      const response = await fetch(`/api/kpi/dashboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const json = await response.json();
      setKpiData(json.data || []);
      setRefreshCounter((prev) => prev + 1);

      if (forceRefresh) {
        console.log("KPI data refreshed from dashboard API");
        toast.success("ข้อมูล KPI อัปเดตเรียบร้อย", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Failed to load KPI data:", error);

      toast.error("ไม่สามารถโหลดข้อมูล KPI ได้ กรุณาลองใหม่", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const loadDistrictSummary = async (year: number, retryCount = 0) => {
    try {
      const response = await fetch(`/api/kpi/report/summary?moneyYear=${year}`);
      if (!response.ok) {
        // Retry up to 2 times with delay if initial load fails
        if (retryCount < 2) {
          console.warn(`District summary load failed (attempt ${retryCount + 1}), retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 500 * (retryCount + 1)));
          return loadDistrictSummary(year, retryCount + 1);
        }
        console.error('Failed to load district summary after retries');
        return;
      }
      const json = await response.json();
      setDistrictData(json.districtData || []);
      setDistrictComparisonData(json.districtComparisonData || []);
      setDistrictExcellenceData(json.districtExcellenceData || []);
    } catch (error) {
      // Retry on network errors
      if (retryCount < 2) {
        console.warn(`District summary error (attempt ${retryCount + 1}), retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 500 * (retryCount + 1)));
        return loadDistrictSummary(year, retryCount + 1);
      }
      console.error('Error loading district summary:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Load KPI data from database API
    loadKpiData(false, selectedDistrictScope);
    loadDistrictSummary(moneyYear);
  }, [moneyYear]);

  // โหลดข้อมูลใหม่เมื่อเลือกอำเภอเปลี่ยน
  useEffect(() => {
    if (mounted) {
      loadKpiData(false, selectedDistrictScope);
    }
  }, [selectedDistrictScope]);

  const stats = useMemo(() => {
    // ใช้ข้อมูลจาก API โดยตรง - status ถูกคำนวณมาแล้วจาก kpi_report
    let total = kpiData.length;
    let passCount = 0;
    let failCount = 0;
    let pendingCount = 0;

    // นับจาก status ที่ API คำนวณมาแล้ว
    kpiData.forEach((kpi: any) => {
      if (kpi.status === 'pass') {
        passCount++;
      } else if (kpi.status === 'fail') {
        failCount++;
      } else {
        pendingCount++;
      }
    });

    const denom = Math.max(total, 1);
    const percentPass =
      total === 0 ? "0.0" : ((passCount / denom) * 100).toFixed(1);

    // สรุปตาม 5 Excellence - ใช้ status จาก API โดยตรง
    const excellenceStats = Object.entries(EXCELLENCE_MAP).map(
      ([code, label]) => {
        const items = kpiData.filter(
          (item: any) => String(item.excellence ?? "") === code
        );
        
        let exPass = 0;
        let exFail = 0;
        let exPending = 0;
        
        items.forEach((kpi: any) => {
          if (kpi.status === 'pass') {
            exPass++;
          } else if (kpi.status === 'fail') {
            exFail++;
          } else {
            exPending++;
          }
        });
        
        const exTotal = items.length;
        const exDenom = Math.max(exTotal, 1);
        const exPercent = exTotal === 0 ? "0.0" : ((exPass / exDenom) * 100).toFixed(1);
        
        return {
          title: label,
          total: exTotal,
          pass: exPass,
          fail: exFail,
          pending: exPending,
          percent: exPercent,
        };
      }
    );

    return {
      total,
      pass: passCount,
      fail: failCount,
      pending: pendingCount,
      percentPass,
      districtData,
      districtComparisonData,
      excellenceStats,
    };
  }, [kpiData, districtData, districtComparisonData]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardSummarySection
        moneyYear={moneyYear}
        isKpiLoading={isKpiLoading}
        selectedDistrictScope={selectedDistrictScope}
        stats={{
          total: stats.total,
          pass: stats.pass,
          fail: stats.fail,
          pending: stats.pending,
          percentPass: stats.percentPass,
        }}
        theme={THEME}
      />

      <DashboardExcellenceSection
        excellenceStats={stats.excellenceStats}
        theme={THEME}
      />

      <DashboardDistrictChartsSection
        selectedDistrictScope={selectedDistrictScope}
        districtData={stats.districtData}
        districtComparisonData={stats.districtComparisonData}
        theme={THEME}
      />
    </div>
  );
}
