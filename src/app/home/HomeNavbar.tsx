'use client';

import React from 'react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Activity, LayoutDashboard, LogIn, User } from 'lucide-react';

interface HomeNavbarProps {
  moneyYear: number;
  session: Session | null;
  displayName: string;
}

export default function HomeNavbar({ moneyYear, session, displayName }: HomeNavbarProps) {
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
          {session && displayName && (
            <div className="hidden md:flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-xs text-blue-700 shadow-sm max-w-[220px]">
              <User size={14} className="text-blue-600" />
              <span className="font-semibold text-[11px] md:text-xs truncate">
                {displayName}
              </span>
            </div>
          )}
          {session ? (
            <>
              <Link
                href="/report"
                className="hidden md:flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-all shadow-sm text-sm font-medium"
              >
                <LayoutDashboard size={16} /> เข้าสู่ระบบรายงาน
              </Link>
              <button
                onClick={() => signOut({ redirectTo: '/login' })}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 border border-red-200 px-3 py-1 rounded-full"
              >
                <LogIn size={16} /> Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm text-sm font-medium"
            >
              <LogIn size={16} /> เข้าสู่ระบบรายงาน
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
