'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { signInWithHealthId } from '../actions/sign-in';

interface Department {
  id: string;
  name: string;
  activate: boolean;
}

export default function DepartmentPage() {
  const router = useRouter();
  const { status } = useSession();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ถ้า login แล้ว ให้ redirect ไป /home ทันที
    if (status === 'authenticated') {
      router.replace('/home');
      return;
    }

    // โหลดรายชื่อกลุ่มงานจากฐานข้อมูล
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/department');
        const data = await res.json();
        
        if (data.success) {
          setDepartments(data.data.filter((d: Department) => d.activate));
        } else {
          setError('ไม่สามารถดึงข้อมูลกลุ่มงานได้');
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        setError('ไม่สามารถดึงข้อมูลกลุ่มงานได้');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl border-t-4 border-blue-600">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Building size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">ลงทะเบียนผู้ใช้งาน</h2>
          <p className="text-gray-500 mt-1">เลือกกลุ่มงานของท่านเพื่อดำเนินการต่อ</p>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="text-center text-gray-400 text-sm py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              กำลังโหลดรายชื่อกลุ่มงาน...
            </div>
          )}
          {error && !loading && (
            <div className="text-center text-red-500 text-sm py-8">{error}</div>
          )}
          {!loading && !error && departments.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">
              ไม่พบข้อมูลกลุ่มงาน กรุณาซิงค์ข้อมูลก่อน
            </div>
          )}
          {!loading && !error && departments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {departments.map((dept) => (
                <form key={dept.id} action={signInWithHealthId} className="w-full h-full">
                  <input type="hidden" name="department" value={dept.id} />
                  <button
                    type="submit"
                    className="w-full h-full min-h-[100px] px-5 py-4 text-left border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all group flex flex-col justify-between"
                  >
                    <div className="font-semibold leading-snug text-gray-800 group-hover:text-blue-700">
                      {dept.name}
                    </div>
                    <div className="mt-3 text-xs text-gray-400 group-hover:text-blue-600 flex items-center gap-1">
                      คลิกเพื่อลงทะเบียน <ChevronRight size={14} />
                    </div>
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full mt-6 py-3 text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          กลับหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
