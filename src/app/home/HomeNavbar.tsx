'use client';

import React from 'react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Activity, LayoutDashboard, LogIn, User, FileText, RefreshCw } from 'lucide-react';

interface HomeNavbarProps {
  moneyYear: number;
  session: Session | null;
  displayName: string;
  onRefresh?: () => void;
  showRefreshButton?: boolean;
  isRefreshing?: boolean;
  selectedDistrict?: string;
  onDistrictChange?: (district: string) => void;
  districtOptions?: string[];
}

export default function HomeNavbar({ 
  moneyYear, 
  session, 
  displayName, 
  onRefresh, 
  showRefreshButton = false, 
  isRefreshing = false,
  selectedDistrict,
  onDistrictChange,
  districtOptions = []
}: HomeNavbarProps) {
  const handleLogout = () => {
    // Perform logout
    signOut({ redirectTo: '/login' });
  };

  const scrollToKpiTable = () => {
    const element = document.getElementById('kpi-table-section');
    if (element) {
      const navbarHeight = 64; // Height of sticky navbar (h-16 = 64px)
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight - 20; // Extra 20px padding for better visibility
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
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
          {/* District Selector */}
          {districtOptions.length > 0 && onDistrictChange && (
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedDistrict || 'ALL'}
              onChange={(e) => onDistrictChange(e.target.value)}
            >
              <option value="ALL">ภาพรวมจังหวัด (ทุกอำเภอ)</option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  อำเภอ{district}
                </option>
              ))}
            </select>
          )}

          {/* Refresh Button */}
          {showRefreshButton && onRefresh && (
            <button 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
            </button>
          )}

          {session && displayName && (
            <div className="hidden md:flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-xs text-blue-700 shadow-sm max-w-[280px]">
              <User size={14} className="text-blue-600" />
              <span className="font-semibold text-[11px] md:text-xs truncate">
                {displayName} ({(session as any)?.user?.ssj_department || ''})
              </span>
            </div>
          )}
          {session ? (
            <>
              <button
                onClick={scrollToKpiTable}
                className="hidden md:flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-all shadow-sm text-sm font-medium"
              >
                <FileText size={16} /> รายการตัวชี้วัด
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 border border-red-200 px-3 py-1 rounded-full"
              >
                <LogIn size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={scrollToKpiTable}
                className="hidden md:flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-all shadow-sm text-sm font-medium"
              >
                <FileText size={16} /> รายการตัวชี้วัด
              </button>
              <Link
                href="/login"
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm text-sm font-medium"
              >
                <LogIn size={16} /> เข้าสู่ระบบ
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
