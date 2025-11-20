'use client';

import { auth } from '@/authConfig'
import { redirect } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Save, User, X } from 'lucide-react';
import KPITable, { KPIItem as TableKPIItem } from '../components/KPITable';

const DISTRICTS = [
  'เมืองพิษณุโลก',
  'นครไทย',
  'ชาติตระการ',
  'บางระกำ',
  'บางกระทุ่ม',
  'พรหมพิราม',
  'วัดโบสถ์',
  'วังทอง',
  'เนินมะปราง',
];

const DEFAULT_MONEY_YEAR = 2569;

type KpiLevel = 'province' | 'district';

interface KPIItem {
  id: string;
  name: string;
  excellence: string;
  criteria: string;
  level: KpiLevel;
}

// ในของจริงควรดึงจาก API, ตอนนี้ใช้ mock ง่าย ๆ
const MOCK_KPIS: KPIItem[] = [
  {
    id: 'KPI-001',
    name: 'ตัวชี้วัดตัวอย่างระดับจังหวัด',
    excellence: 'PP&P Excellence',
    criteria: '> 80%',
    level: 'province',
  },
  {
    id: 'KPI-002',
    name: 'ตัวชี้วัดตัวอย่างระดับอำเภอ',
    excellence: 'Service Excellence',
    criteria: '> 90%',
    level: 'district',
  },
];

interface UserInfo {
  department: string;
}

type GridData = Record<string, Record<string, string>>;
type TargetData = Record<string, string>;

export default function ReportPage() {

  const router = useRouter();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeKpi, setActiveKpi] = useState<TableKPIItem | null>(null);
  const [gridData, setGridData] = useState<GridData>({});
  const [targetData, setTargetData] = useState<TargetData>({});
  const [moneyYear, setMoneyYear] = useState<number>(DEFAULT_MONEY_YEAR);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedDeptName = window.localStorage.getItem('selectedDeptId');
    if (!storedDeptName) {
      router.replace('/login');
      return;
    }
    setUser({ department: storedDeptName });

    // load fiscal year from server config
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data?.moneyYear && typeof data.moneyYear === 'number') {
          setMoneyYear(data.moneyYear);
        }
      })
      .catch(() => {
        // ignore errors, fall back to default
      });
  }, [router]);

  const yearShortPrev = ((moneyYear - 1) % 100).toString().padStart(2, '0');
  const yearShortCurr = (moneyYear % 100).toString().padStart(2, '0');
  const MONTHS = [
    `ต.ค. ${yearShortPrev}`,
    `พ.ย. ${yearShortPrev}`,
    `ธ.ค. ${yearShortPrev}`,
    `ม.ค. ${yearShortCurr}`,
    `ก.พ. ${yearShortCurr}`,
    `มี.ค. ${yearShortCurr}`,
    `เม.ย. ${yearShortCurr}`,
    `พ.ค. ${yearShortCurr}`,
    `มิ.ย. ${yearShortCurr}`,
    `ก.ค. ${yearShortCurr}`,
    `ส.ค. ${yearShortCurr}`,
    `ก.ย. ${yearShortCurr}`,
  ];

  useEffect(() => {
    if (!activeKpi) {
      setGridData({});
      setTargetData({});
      return;
    }

    // Initialize empty grid when a KPI is activated
    const initial: GridData = {};
    const targets: TargetData = {};
    const rowKeys = activeKpi.level === 'district' ? DISTRICTS : ['จังหวัด'];

    rowKeys.forEach((key) => {
      initial[key] = {};
      targets[key] = '';
      MONTHS.forEach((m) => {
        initial[key][m] = '';
      });
    });
    setGridData(initial);
    setTargetData(targets);
  }, [activeKpi]);

  const handleCellChange = (district: string, month: string, value: string) => {
    setGridData((prev) => ({
      ...prev,
      [district]: {
        ...(prev[district] || {}),
        [month]: value,
      },
    }));
  };

  const handleTargetChange = (district: string, value: string) => {
    setTargetData((prev) => ({
      ...prev,
      [district]: value,
    }));
  };

  if (!user) {
    return null;
  }

  const rowKeys = activeKpi && activeKpi.level === 'district' ? DISTRICTS : ['จังหวัด'];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#F0FDF4' }}>
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shadow">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-green-800 leading-tight">บันทึกผลการดำเนินงาน</h1>
              <p className="text-xs text-green-600">ระบบรายงานตัวชี้วัด สสจ.พิษณุโลก</p>
            </div>
          </div>

          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600"
          >
            <LayoutDashboard size={18} /> กลับหน้าแดชบอร์ด
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto mt-4 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <User size={20} className="text-green-600" />
            กลุ่มงาน {user.department}
          </h2>
          <KPITable
            initialDepartment={user.department}
            hideDepartmentFilter
            showActionColumn
            showHeaderSummary
            onActionClick={(kpi) => setActiveKpi(kpi)}
          />
        </div>
      </main>
      {activeKpi && (
        <div className="fixed inset-0 z-50 flex bg-black/40">
          <div className="bg-white w-full h-full overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">บันทึกผลการดำเนินงาน</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {activeKpi.id} - {activeKpi.name}
                </p>
              </div>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                onClick={() => setActiveKpi(null)}
                aria-label="ปิด"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4 overflow-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full border border-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 border-b border-r text-left text-gray-600">อำเภอ</th>
                      <th className="px-3 py-2 border-b border-r text-center text-gray-600 whitespace-nowrap">เป้า</th>
                      {MONTHS.map((m) => (
                        <th
                          key={m}
                          className="px-3 py-2 border-b border-r text-center text-gray-600 whitespace-nowrap"
                        >
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rowKeys.map((dist) => {
                      const rowTotal = MONTHS.reduce((sum, m) => {
                        const v = parseFloat(gridData[dist]?.[m] || '0');
                        return sum + (isNaN(v) ? 0 : v);
                      }, 0);

                      const target = parseFloat(targetData[dist] || '0');
                      const divideNumber = activeKpi?.divideNumber ?? 1;
                      const rate =
                        target > 0
                          ? (rowTotal / target) * (divideNumber || 1)
                          : 0;

                      return (
                        <tr key={dist}>
                          <td className="px-3 py-2 border-b border-r text-sm text-gray-700 whitespace-nowrap">
                            {dist}
                          </td>
                          <td className="px-2 py-2 border-b border-r text-center bg-gray-50">
                            <input
                              type="number"
                              className="w-full text-center text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                              value={targetData[dist] ?? ''}
                              onChange={(e) => handleTargetChange(dist, e.target.value)}
                            />
                          </td>
                          {MONTHS.map((m) => (
                            <td
                              key={m}
                              className="px-2 py-2 border-b border-r text-center"
                            >
                              <input
                                type="number"
                                className="w-full text-center text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                                value={gridData[dist]?.[m] ?? ''}
                                onChange={(e) =>
                                  handleCellChange(dist, m, e.target.value)
                                }
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 border-b text-right text-gray-700 font-semibold bg-gray-50">
                            {rowTotal.toLocaleString('th-TH')}
                          </td>
                          <td className="px-3 py-2 border-b text-right text-gray-700 font-semibold bg-gray-50">
                            {rate ? rate.toFixed(2) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Column totals */}
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 border-t border-r text-right text-gray-700 font-semibold">
                        รวม
                      </td>
                      <td className="px-3 py-2 border-t border-r text-right text-gray-700 font-semibold">
                        {(() => {
                          const targetTotal = rowKeys.reduce((sum, dist) => {
                            const v = parseFloat(targetData[dist] || '0');
                            return sum + (isNaN(v) ? 0 : v);
                          }, 0);
                          return targetTotal.toLocaleString('th-TH');
                        })()}
                      </td>
                      {MONTHS.map((m) => {
                        const colTotal = rowKeys.reduce((sum, dist) => {
                          const v = parseFloat(gridData[dist]?.[m] || '0');
                          return sum + (isNaN(v) ? 0 : v);
                        }, 0);
                        return (
                          <td
                            key={m}
                            className="px-3 py-2 border-t border-r text-right text-gray-700 font-semibold"
                          >
                            {colTotal.toLocaleString('th-TH')}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border-t text-right text-gray-900 font-bold">
                        {(() => {
                          const grandTotal = rowKeys.reduce((sumDist, dist) => {
                            return (
                              sumDist +
                              MONTHS.reduce((sumMonth, m) => {
                                const v = parseFloat(gridData[dist]?.[m] || '0');
                                return sumMonth + (isNaN(v) ? 0 : v);
                              }, 0)
                            );
                          }, 0);
                          return grandTotal.toLocaleString('th-TH');
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

