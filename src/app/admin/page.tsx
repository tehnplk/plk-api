import Link from 'next/link';
import { Database, RefreshCw, Shield, Users, BarChart3 } from 'lucide-react';

export default function AdminPortalPage() {
  const cards = [
    {
      href: '/admin/kpis',
      title: 'KPI Management',
      desc: 'จัดการข้อมูลตัวชี้วัด (CRUD) และ template',
      icon: BarChart3,
      accent: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      href: '/admin/account',
      title: 'Account',
      desc: 'จัดการบัญชีผู้ใช้และสิทธิ์การใช้งาน',
      icon: Users,
      accent: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      href: '/admin/db-manage',
      title: 'Database Manage',
      desc: 'ดูตาราง / ล้างข้อมูล / sync ข้อมูลบางส่วน',
      icon: Database,
      accent: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      href: '/admin/sync',
      title: 'Sync',
      desc: 'เครื่องมือซิงค์ข้อมูลสำหรับผู้ดูแลระบบ',
      icon: RefreshCw,
      accent: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Portal</h1>
          <p className="mt-1 text-sm text-gray-600">เลือกเมนูสำหรับจัดการระบบ</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          <Shield className="h-4 w-4 text-gray-500" />
          Admin Only
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className={`group rounded-xl border ${c.border} bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-lg border ${c.border} ${c.bg} p-2`}>
                  <Icon className={`h-5 w-5 ${c.accent}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 group-hover:underline">
                    {c.title}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">{c.desc}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="text-xs text-gray-500">
        Tip: ถ้าต้องการกลับมา portal ให้เข้าที่ URL <span className="font-mono">/admin</span>
      </div>
    </div>
  );
}
