"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import KPITable from "../components/KPITable";
import ReportKpiModal from "../components/ReportKpiModal";
import { kpiDataCache, transformKpiData } from '../../utils/kpiDataCache';

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

interface KPIListProps {
  selectedDepartment: string;
  moneyYear: number;
  refreshVersion: number;
  session: any;
  onKpiAction?: (kpi: any) => void;
}

export default function KPIList({ 
  selectedDepartment, 
  moneyYear, 
  refreshVersion, 
  session,
  onKpiAction
}: KPIListProps) {
  const [mounted, setMounted] = useState(false);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
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

  // Extract unique departments and filter data from kpiData
  const departmentOptions = useMemo(() => {
    // Get departments from current kpiData
    const departments = Array.from(
      new Set(
        kpiData
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

  const loadKpiData = async (forceRefresh: boolean = false) => {
    try {
      const data = await kpiDataCache.loadData(forceRefresh);
      setKpiData(data);
      setRefreshCounter((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to load KPI data:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Load KPI data from Google Sheets API
    loadKpiData();
  }, []);

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

  const handleKpiAction = (kpi: any) => {
    setActiveKpi(kpi);
    if (onKpiAction) {
      onKpiAction(kpi);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div id="kpi-table-section">
        <KPITable
          key={refreshCounter}
          initialDepartment={selectedDepartment}
          moneyYear={moneyYear}
          refreshVersion={refreshVersion}
          showHeaderSummary
          showRowCountSummary
          showActionColumn={!session ? true : false} // ซ่อน action column เมื่อ auth ผ่านแล้ว
          onActionClick={handleKpiAction} // เปิด modal เมื่อคลิกปุ่มบันทึก
          session={session}
        />
      </div>
      
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
    </>
  );
}
