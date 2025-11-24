'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Activity, LayoutDashboard, LogIn, User, FileText, RefreshCw, ChevronDown } from 'lucide-react';
import { signInWithHealthId } from '../actions/sign-in';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse user profile from session
  const userProfile = useMemo(() => {
    try {
      return JSON.parse((session as any)?.user?.profile || '{}');
    } catch {
      return {};
    }
  }, [session]);

  // Extract position/department from parsed profile
  const userDepartment = userProfile?.organization?.[0]?.position || '';

  const handleLogout = () => {
    // Perform logout
    signOut({ redirectTo: '/login' });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <>
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

          {session ? (
            <>
              <button
                onClick={scrollToKpiTable}
                className="hidden md:flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-all shadow-sm text-sm font-medium"
              >
                <FileText size={16} /> รายการตัวชี้วัด
              </button>
              
              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 transition-colors cursor-pointer"
                >
                  <User size={16} />
                  <span className="hidden md:block truncate max-w-[200px]">
                    {displayName}
                  </span>
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    >
                      <User size={16} />
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogIn size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm text-sm font-medium cursor-pointer"
              >
                <LogIn size={16} /> เข้าสู่ระบบ
              </Link>
            </>
          )}
        </div>
      </div>
    </header>

    {/* Profile Modal */}
    {isProfileModalOpen && userProfile && (
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30 cursor-pointer"
        onClick={() => setIsProfileModalOpen(false)}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">ข้อมูลผู้ใช้</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Information */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">ข้อมูลส่วนตัว</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ชื่อ-นามสกุล:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userProfile.title_th} {userProfile.name_th}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ชื่อ-นามสกุล (Eng):</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userProfile.title_en} {userProfile.name_eng}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">{userProfile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">วันเกิด:</span>
                    <span className="text-sm font-medium text-gray-900">{userProfile.date_of_birth}</span>
                  </div>
                </div>
              </div>

              {/* Organization Information */}
              {userProfile.organization && userProfile.organization.length > 0 && (
                <div className="border-b pb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">ข้อมูลหน่วยงาน</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ตำแหน่ง:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {userProfile.organization[0].position}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">สังกัด:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {userProfile.organization[0].affiliation}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">หน่วยงาน:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {userProfile.organization[0].hname_th}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">รหัส:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {userProfile.organization[0].hcode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ที่อยู่:</span>
                      <span className="text-sm font-medium text-gray-900 text-right">
                        {userProfile.organization[0].address?.province}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">ข้อมูลบัญชี</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Account ID:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userProfile.account_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Provider ID:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userProfile.provider_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">วันที่สร้าง:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(userProfile.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
