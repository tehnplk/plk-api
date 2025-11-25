'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building, ArrowRight, ChevronRight } from 'lucide-react';
import { kpiDataCache } from '../../utils/kpiDataCache';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { signInWithHealthId } from '../actions/sign-in';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      
      // Use database instead of localStorage
      const rows = await kpiDataCache.loadData();

      const set = new Set<string>();
      rows.forEach((item: any) => {
        const dept = String(item.ssj_department ?? '').trim();
        if (dept) set.add(dept);
      });
      const list = Array.from(set);
      setDepartments(list);
      
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setError('ไม่สามารถดึงข้อมูลแผนกได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ถ้า login แล้ว ให้ redirect ไป /home ทันที
    if (status === 'authenticated') {
      router.replace('/home');
      return;
    }

    // โหลดรายชื่อกลุ่มงานจากฐานข้อมูล
    fetchDepartments();
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl border-t-4 border-green-600">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h2>
          <p className="text-gray-500 mt-1">เลือกกลุ่มงานเพื่อดำเนินการต่อ</p>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="text-center text-gray-400 text-sm">กำลังโหลดรายชื่อกลุ่มงาน...</div>
          )}
          {error && !loading && (
            <div className="text-center text-red-500 text-sm">{error}</div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {departments.map((name) => (
                <form key={name} action={signInWithHealthId} className="w-full h-full">
                  <input type="hidden" name="department" value={name} />
                  <button
                    type="submit"
                    className="w-full h-full min-h-[96px] px-4 py-5 text-left border border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all group flex flex-col justify-between"
                  >
                    <div className="font-semibold leading-snug line-clamp-2">{name}</div>
                    <div className="mt-2 text-xs text-gray-400 group-hover:text-green-600 flex items-center gap-1">
                      คลิกเพื่อเข้ารายงาน <ChevronRight size={12} />
                    </div>
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/"
          className="block w-full mt-6 py-2 text-center text-sm text-gray-400 hover:text-gray-600"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
