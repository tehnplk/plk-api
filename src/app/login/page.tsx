'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { signInWithHealthId } from '../actions/sign-in';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // ถ้า login แล้ว ให้ redirect ไป /home ทันที
    if (status === 'authenticated') {
      router.replace('/home');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border-t-4 border-green-600">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">ระบบรายงาน KPI</h2>
          <p className="text-gray-500 mt-1">สำนักงานสาธารณสุขจังหวัดพิษณุโลก</p>
        </div>

        <div className="space-y-4">
          {/* Button 1: เข้าสู่ระบบ */}
          <form action={signInWithHealthId}>
            <input type="hidden" name="department" value="" />
            <input type="hidden" name="redirectTo" value="/profile" />
            <button
              type="submit"
              className="w-full px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 font-semibold text-lg shadow-md hover:shadow-lg"
            >
              <LogIn size={24} />
              เข้าสู่ระบบ
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">หรือ</span>
            </div>
          </div>

          {/* Button 2: ลงทะเบียนผู้ใช้งาน */}
          <form action={signInWithHealthId}>
            <input type="hidden" name="department" value="register" />
            <input type="hidden" name="redirectTo" value="/profile" />
            <button
              type="submit"
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 font-semibold text-lg shadow-md hover:shadow-lg"
            >
              <UserPlus size={24} />
              ลงทะเบียนผู้ใช้งาน
            </button>
          </form>
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
