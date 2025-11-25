"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import HomeNavbar from "./HomeNavbar";
import Dashboard from "./Dashboard";
import KPIList from "./KPIList";
import { toast } from "react-toastify";
import { kpiDataCache } from '../../utils/kpiDataCache';

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


const DEFAULT_MONEY_YEAR = Number(process.env.NEXT_PUBLIC_MONEY_YEAR);

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


export default function HomePage() {
  const [selectedDistrictScope, setSelectedDistrictScope] = useState("ALL");
  const [mounted, setMounted] = useState(false);
  const [moneyYear, setMoneyYear] = useState<number>(DEFAULT_MONEY_YEAR);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const { data: session, status } = useSession();
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);



  // Handle district change with scroll to top
  const handleDistrictChange = (district: string) => {
    setSelectedDistrictScope(district);
    // Scroll to top when district changes
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };



  const handleRefreshKpis = async () => {
    setIsKpiLoading(true);
    try {
      await kpiDataCache.loadData(true);
      setRefreshVersion((prev) => prev + 1);
      console.log("KPI data refreshed from Google Sheets");
      toast.success("ข้อมูล KPI อัปเดตเรียบร้อย", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Failed to refresh KPI data:", error);
      toast.error("ไม่สามารถอัปเดตข้อมูล KPI ได้ กรุณาลองใหม่", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsKpiLoading(false);
    }
  };

  // Sync KPI data from Google Sheets to database
  const handleSyncFromGoogleSheets = async () => {
    try {
      console.log('🔄 Starting sync from Google Sheets...');
      setIsSyncing(true);
      
      const response = await fetch('/api/kpi/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sync failed');
      }
      
      const result = await response.json();
      console.log('✅ Sync successful:', result);
      
      // Trigger refresh in KPIList by incrementing refresh version
      setRefreshVersion((prev) => prev + 1);
      
      toast.success("ซิงค์ข้อมูลจาก Google Sheets สำเร็จ", {
        position: "top-right",
        autoClose: 3000,
      });
      
    } catch (error: any) {
      console.error('❌ Sync error:', error);
      toast.error(error?.message || 'การซิงค์ข้อมูลล้มเหลว', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSyncing(false);
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
  }, []);



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

  // Add ssj_department in parentheses if available
  const ssjDepartment = (session?.user as any)?.ssj_department;
  
  if (displayName && ssjDepartment) {
    displayName = `${displayName} (${ssjDepartment})`;
  }

  if (!mounted) {
    return null;
  }

  // Show loading state while session is being established
  if (status === 'loading') {
    return (
      <div className="min-h-screen font-sans flex items-center justify-center" style={{ backgroundColor: "#F0FDF4" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    );
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
        onSync={handleSyncFromGoogleSheets}
        isSyncing={isSyncing}
        selectedDistrict={selectedDistrictScope}
        onDistrictChange={handleDistrictChange}
        districtOptions={DISTRICTS}
      />

      <main className="container mx-auto px-4 py-6">
        <Dashboard
          selectedDistrictScope={selectedDistrictScope}
          moneyYear={moneyYear}
          isKpiLoading={isKpiLoading}
          onRefresh={handleRefreshKpis}
        />
        
        <KPIList
          selectedDepartment={(session?.user as any)?.ssj_department || "ทั้งหมด"}
          moneyYear={moneyYear}
          refreshVersion={refreshVersion}
          session={session}
        />
      </main>
    </div>
  );
}
