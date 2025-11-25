"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { kpiDataCache } from "../../utils/kpiDataCache";
import { getStatusFromCondition } from "@/utils/conditionEvaluator";
import { EXCELLENCE_MAP } from "@/constants/excellence";

import DashboardSummarySection from "./DashboardSummarySection";
import DashboardExcellenceSection from "./DashboardExcellenceSection";
import DashboardDistrictChartsSection from "./DashboardDistrictChartsSection";

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

  const handleRefreshKpis = async () => {
    await loadKpiData(true); // Force refresh
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

  const loadKpiData = async (forceRefresh: boolean = false) => {
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

      toast.error("ไม่สามารถโหลดข้อมูล KPI ได้ กรุณาลองใหม่", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    // Load KPI data from Google Sheets API
    loadKpiData();
  }, []);

  const stats = useMemo(() => {
    // สรุปตัวเลขตามข้อมูลจริงจากฐานข้อมูล kpis
    const total = kpiData.length;

    let passCount = 0;
    let failCount = 0;
    let pendingCount = 0;

    kpiData.forEach((item: any) => {
      const condition = (item.condition ?? "").toString().trim();

      // แปลง target_result เป็นตัวเลข ถ้าไม่มีให้ถือว่ายังประเมินไม่ได้
      const targetRaw = item.target_result;
      const target =
        typeof targetRaw === "number"
          ? targetRaw
          : targetRaw
          ? Number(targetRaw)
          : NaN;

      // แปลงผลลัพธ์ sum_result เป็นตัวเลข หรือให้เป็น null ถ้าไม่มี
      const actualRaw = item.sum_result;
      const actual =
        actualRaw === null || actualRaw === undefined || actualRaw === ""
          ? null
          : Number(actualRaw);

      // ถ้าไม่มีเงื่อนไขหรือ target ไม่ใช่ตัวเลข ให้ถือว่ายังรอประเมิน
      if (!condition || Number.isNaN(target)) {
        pendingCount += 1;
        return;
      }

      const status = getStatusFromCondition(condition, target, actual);

      if (status === "pass") passCount += 1;
      else if (status === "fail") failCount += 1;
      else pendingCount += 1;
    });

    const effectiveDenominator = Math.max(total - pendingCount, 1);
    const percentPass =
      total === 0
        ? "0.0"
        : ((passCount / effectiveDenominator) * 100).toFixed(1);

    // หมายเหตุ: ส่วน chart ด้านล่าง (district / excellence) ยังใช้ข้อมูลจำลองเดิมอยู่
    // เนื่องจากตาราง kpis ไม่มีมิติอำเภอให้ผูกข้อมูลจริงได้โดยตรง

    const districtData = DISTRICTS.map((d) => ({
      name: d,
      percent: Math.floor(Math.random() * 40 + 60),
    }));

    const districtComparisonData = DISTRICTS.map((d) => {
      const p = Math.floor(Math.random() * 15) + 5;
      const f = Math.floor(Math.random() * 5);
      const pe = Math.floor(Math.random() * 5);
      return {
        name: d,
        pass: p,
        fail: f,
        pending: pe,
        total: p + f + pe,
      };
    });

    // สรุปตาม 5 Excellence จริงจากข้อมูล kpiData
    const excellenceStats = Object.entries(EXCELLENCE_MAP).map(
      ([code, label]) => {
        const items = kpiData.filter(
          (item: any) => String(item.excellence ?? "") === code
        );

        const totalEx = items.length;
        let passEx = 0;
        let failEx = 0;
        let pendingEx = 0;

        items.forEach((item: any) => {
          const condition = (item.condition ?? "").toString().trim();
          const targetRaw = item.target_result;
          const target =
            typeof targetRaw === "number"
              ? targetRaw
              : targetRaw
              ? Number(targetRaw)
              : NaN;
          const actualRaw = item.sum_result;
          const actual =
            actualRaw === null || actualRaw === undefined || actualRaw === ""
              ? null
              : Number(actualRaw);

          if (!condition || Number.isNaN(target)) {
            pendingEx += 1;
            return;
          }

          const status = getStatusFromCondition(condition, target, actual);
          if (status === "pass") passEx += 1;
          else if (status === "fail") failEx += 1;
          else pendingEx += 1;
        });

        const denom = Math.max(totalEx - pendingEx, 1);
        const percent =
          totalEx === 0 ? "0" : ((passEx / denom) * 100).toFixed(0);

        return {
          title: label,
          total: totalEx,
          pass: passEx,
          fail: failEx,
          pending: pendingEx,
          percent,
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
  }, [kpiData, selectedDistrictScope]);

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
