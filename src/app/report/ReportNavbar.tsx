'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, FileText, LogIn, User } from 'lucide-react';

interface ReportNavbarProps {
  displayName: string;
  orgName: string;
  moneyYear: number;
}

export default function ReportNavbar({ displayName, orgName, moneyYear }: ReportNavbarProps) {
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b border-green-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shadow">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-green-800 leading-tight">บันทึกผลการดำเนินงาน</h1>
            <p className="text-xs text-green-600">
              ระบบรายงานตัวชี้วัด สสจ.พิษณุโลก ปีงบประมาณ {moneyYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {displayName && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-xs text-blue-700 shadow-sm max-w-[220px] md:max-w-xs">
              <User size={14} className="text-blue-600" />
              <div className="flex flex-col leading-tight overflow-hidden">
                <span className="font-semibold text-[11px] md:text-xs truncate">
                  {displayName}
                </span>
                {orgName && (
                  <span className="text-[10px] md:text-[11px] text-blue-700/80 truncate">
                    {orgName}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-all shadow-sm text-sm font-medium"
            >
              <LayoutDashboard size={16} /> กลับหน้าแดชบอร์ด
            </button>
            <button
              onClick={() => signOut({ redirectTo: '/login' })}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 border border-red-200 px-3 py-1 rounded-full"
            >
              <LogIn size={16} /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
