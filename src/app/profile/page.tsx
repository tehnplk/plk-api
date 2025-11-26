'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Building2, IdCard, Phone, MapPin, ArrowLeft, Shield, Calendar, Cookie } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cookies, setCookies] = useState<{ key: string; value: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [accountInfo, setAccountInfo] = useState<{
    department: string;
    login_count: number;
    last_login: string | null;
    active: boolean;
    role: string;
  } | null>(null);

  useEffect(() => {
    // Get all cookies from document.cookie (client-side only, httpOnly cookies will not appear)
    const cookieString = document.cookie;
    const cookieArray = cookieString
      .split(';')
      .map((cookie) => {
        const [key, ...valueParts] = cookie.trim().split('=');
        return {
          key: key || '',
          value: valueParts.join('=') || '',
        };
      })
      .filter((c) => c.key);
    setCookies(cookieArray);
  }, []);

  // Check if user is already registered in account_user
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const rawProfile = (session.user as any)?.profile;
      if (rawProfile) {
        try {
          const profile = JSON.parse(rawProfile);
          const providerId = profile.provider_id;
          if (providerId) {
            fetch(`/api/account/role?provider_id=${providerId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  setIsRegistered(true);
                  setAccountInfo({
                    department: data.department || '',
                    login_count: data.login_count || 0,
                    last_login: data.last_login || null,
                    active: data.active || false,
                    role: data.role || '',
                  });
                }
                setIsCheckingRegistration(false);
              })
              .catch(() => {
                setIsCheckingRegistration(false);
              });
          } else {
            setIsCheckingRegistration(false);
          }
        } catch {
          setIsCheckingRegistration(false);
        }
      } else {
        setIsCheckingRegistration(false);
      }
    }
  }, [status, session]);

  // Handle register button click - upsert account_user
  const handleRegister = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        router.push('/home');
      } else {
        console.error('Failed to register:', data.error);
        alert('เกิดข้อผิดพลาดในการลงทะเบียน: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to upsert account_user from profile:', err);
      alert('เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }

  // Parse profile data from session
  let profile: Record<string, any> = {};
  const rawProfile = (session?.user as any)?.profile;
  if (rawProfile) {
    try {
      profile = JSON.parse(rawProfile);
    } catch (e) {
      console.error('Failed to parse profile:', e);
    }
  }

  // Helper function to safely get string value
  const getStringValue = (value: any, fallback: string = 'ไม่ระบุ'): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value || fallback;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      // Try to extract common name fields from object
      return value.name || value.name_th || value.title || value.position || JSON.stringify(value);
    }
    return fallback;
  };

  // Extract display name
  const prefix = profile.title_th || profile.prefix_th || profile.prename || profile.prename_th || '';
  const firstName = profile.first_name_th || profile.firstname_th || profile.firstName || profile.given_name || '';
  const lastName = profile.last_name_th || profile.lastname_th || profile.lastName || profile.family_name || '';
  const displayName = `${prefix ? prefix + ' ' : ''}${firstName} ${lastName}`.trim() || profile.name_th || profile.name || session?.user?.name || 'ไม่ระบุ';

  const ssjDepartment = (session?.user as any)?.ssj_department;

  // Convert profile object to array of key-value pairs
  const profileEntries = Object.entries(profile).map(([key, value]) => ({
    key,
    value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? 'ไม่ระบุ'),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-blue-100">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/home"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-blue-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow">
              <User size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">ข้อมูลผู้ใช้งาน</h1>
              <p className="text-xs text-gray-500">ระบบรายงาน KPI สสจ.พิษณุโลก</p>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-center">
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              {isRegistered && accountInfo?.role && (
                <p className="text-blue-100 mt-1">{accountInfo.role}</p>
              )}
              {isRegistered && accountInfo && (
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${accountInfo.active ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'}`}>
                    {accountInfo.active ? '✓ อนุมัติแล้ว' : '⏳ รออนุมัติ'}
                  </span>
                </div>
              )}
            </div>

            {/* Key Info */}
            <div className="p-6 space-y-3">
              {/* Provider ID & Email - Same Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <IdCard size={20} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Provider ID</p>
                    <p className="font-medium text-gray-800">{getStringValue(profile.provider_id || profile.providerId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail size={20} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{getStringValue(profile.email || session?.user?.email)}</p>
                  </div>
                </div>
              </div>
              {/* Organization - Array display */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 size={20} className="text-blue-600" />
                  <p className="text-xs text-gray-500">Organization ({Array.isArray(profile.organization) ? profile.organization.length : 1} รายการ)</p>
                </div>
                {Array.isArray(profile.organization) ? (
                  <div className="space-y-2 ml-8">
                    {profile.organization.map((org: any, index: number) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-400">Position</p>
                            <p className="font-medium text-gray-800">{org.position || 'ไม่ระบุ'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">HCode</p>
                            <p className="font-medium text-gray-800">{org.hcode || 'ไม่ระบุ'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">หน่วยงาน</p>
                            <p className="font-medium text-gray-800">{org.hname_th || 'ไม่ระบุ'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium text-gray-800 ml-8">{getStringValue(profile.organization || profile.hname_th || (typeof profile.affiliation === 'string' ? profile.affiliation : profile.affiliation?.hname_th))}</p>
                )}
              </div>

              {/* Account Info - Only show if registered */}
              {isRegistered && accountInfo && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3">ข้อมูลบัญชีในระบบ</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">กลุ่มงาน</p>
                      <p className="font-medium text-gray-800">{accountInfo.department || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Activate</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${accountInfo.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {accountInfo.active ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">จำนวนเข้าใช้งาน</p>
                      <p className="font-medium text-gray-800">{accountInfo.login_count} ครั้ง</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">เข้าใช้ล่าสุด</p>
                      <p className="font-medium text-gray-800">
                        {accountInfo.last_login 
                          ? new Date(accountInfo.last_login).toLocaleString('th-TH')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Raw Session Data (for debugging) */}
            <div className="border-t border-gray-200 p-6">
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
                  <span>Raw ProviderId Profile</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <pre className="mt-4 p-4 bg-gray-900 text-blue-400 rounded-lg text-xs overflow-x-auto max-h-96">
                  {JSON.stringify({
                    session: session,
                    profile: profile,
                    cookies: cookies,
                  }, null, 2)}
                </pre>
              </details>
            </div>
          </div>

          {/* Action Buttons - Only show register button if not registered */}
          {!isRegistered && !isCheckingRegistration && (
            <div className="mt-6">
              <button
                onClick={handleRegister}
                disabled={isSubmitting}
                className="block w-full py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'กำลังลงทะเบียน...' : 'ยืนยันการลงทะเบียน'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
