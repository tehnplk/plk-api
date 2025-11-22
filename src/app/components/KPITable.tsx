'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search, Save } from 'lucide-react';

type KPIStatus = 'pass' | 'fail' | 'pending';

export interface KPIItem {
  id: string;
  name: string;
  excellence: string;
  criteria: string;
  level: 'province' | 'district';
  department: string;
  result: string | null;
  status: KPIStatus;
  target?: number;
  lastUpdated?: string;
  isMophKpi?: boolean;
  divideNumber?: number;
}

const EXCELLENCE_DESCRIPTION: Record<string, string> = {
  'PP&P': 'PP&P Excellence',
  SE: 'Service Excellence',
  PE: 'People Excellence',
  GE: 'Governance Excellence',
  HRE: 'Health-Related Economy Excellence',
};

interface KPITableProps {
  data?: KPIItem[];
  initialDepartment?: string;
  hideDepartmentFilter?: boolean;
  showActionColumn?: boolean;
  onActionClick?: (kpi: KPIItem) => void;
  showHeaderSummary?: boolean;
  showRowCountSummary?: boolean;
  moneyYear?: number;
  refreshVersion?: number;
  isLoading?: boolean;
}

const KPITable: React.FC<KPITableProps> = ({
  data,
  initialDepartment,
  hideDepartmentFilter,
  showActionColumn,
  onActionClick,
  showHeaderSummary,
  showRowCountSummary,
  moneyYear,
  refreshVersion,
  isLoading = false,
}) => {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | KPIStatus>('all');
  const [kpiTypeFilter, setKpiTypeFilter] = useState<'all' | 'moph' | 'province'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | string>(
    initialDepartment || 'all',
  );
  const [remoteData, setRemoteData] = useState<KPIItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'id' | 'name' | 'criteria' | 'level' | 'department'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [kpiSummary, setKpiSummary] = useState<
    Record<string, { rate: string | null; lastUpdated: string | null }>
  >({});

  useEffect(() => {
    if (data && data.length > 0) return;

    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/kpis');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;

        const sourceArray: any[] = Array.isArray(json) ? json : json.data || [];

        const rows: KPIItem[] = sourceArray.map((raw: any, index: number) => {
          const areaLevel: string = raw.area_level ?? raw.areaLevel ?? '';

          let level: KPIItem['level'] = 'province';
          if (areaLevel === 'อำเภอ') level = 'district';
          if (areaLevel === 'จังหวัด') level = 'province';

          const divideNumberRaw = raw.divide_number ?? raw.divideNumber;
          let divideNumber: number | undefined;
          if (typeof divideNumberRaw === 'number') {
            divideNumber = divideNumberRaw;
          } else if (typeof divideNumberRaw === 'string') {
            const parsed = parseFloat(divideNumberRaw);
            divideNumber = isNaN(parsed) ? undefined : parsed;
          }

          return {
            id: String(raw.id ?? `KPI-${index + 1}`),
            name: String(raw.name ?? ''),
            excellence: String(raw.excellence ?? ''),
            criteria: String(raw.evaluation_criteria ?? ''),
            level,
            department: String(raw.ssj_department ?? ''),
            // ตอนนี้ยังไม่มีผลลัพธ์รายงานจริง ใช้ null และ pending เป็นค่าเริ่มต้น
            result: null,
            status: 'pending',
            target: typeof raw.target_result === 'number' ? raw.target_result : undefined,
            lastUpdated: undefined,
            isMophKpi: String(raw.is_moph_kpi ?? '').toUpperCase() === 'YES',
            divideNumber,
          };
        });

        setRemoteData(rows);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'ไม่สามารถดึงข้อมูลได้');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [data]);

  const sourceData: KPIItem[] = data && data.length > 0 ? data : remoteData || [];

  useEffect(() => {
    if (!moneyYear || sourceData.length === 0) return;

    let cancelled = false;

    const monthFields = [
      'result_oct',
      'result_nov',
      'result_dec',
      'result_jan',
      'result_feb',
      'result_mar',
      'result_apr',
      'result_may',
      'result_jun',
      'result_jul',
      'result_aug',
      'result_sep',
    ] as const;

    const fetchSummary = async () => {
      const result: Record<string, { rate: string | null; lastUpdated: string | null }> = {};

      for (const item of sourceData) {
        try {
          const params = new URLSearchParams({
            kpiId: item.id,
            moneyYear: String(moneyYear),
          });
          const res = await fetch(`/api/kpi/save-prisma?${params.toString()}`);
          if (!res.ok) continue;
          const json = await res.json();
          if (!json?.success || !Array.isArray(json.data) || json.data.length === 0) continue;

          let targetTotal = 0;
          let grandTotal = 0;
          let lastUpdated: Date | null = null;

          for (const row of json.data as any[]) {
            const t = Number(row.kpi_tarket ?? 0);
            if (!Number.isNaN(t)) targetTotal += t;

            for (const field of monthFields) {
              const v = Number(row[field] ?? 0);
              if (!Number.isNaN(v)) grandTotal += v;
            }

            if (row.update_at) {
              const d = new Date(row.update_at as string);
              if (!Number.isNaN(d.getTime())) {
                if (!lastUpdated || d > lastUpdated) {
                  lastUpdated = d;
                }
              }
            }
          }

          const divideNumber = item.divideNumber ?? 1;
          let rate: string | null = null;
          if (targetTotal > 0) {
            const r = (grandTotal / targetTotal) * (divideNumber || 1);
            rate = r.toFixed(2);
          }

          result[item.id] = {
            rate,
            lastUpdated: lastUpdated
              ? lastUpdated.toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })
              : null,
          };
        } catch {
          // ignore per-KPI errors
        }
      }

      if (!cancelled) {
        setKpiSummary(result);
      }
    };

    fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [moneyYear, sourceData, refreshVersion]);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    sourceData.forEach((item) => {
      if (item.department) set.add(item.department);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [sourceData]);

  const sortedData = [...sourceData].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1;

    const getValue = (item: KPIItem) => {
      switch (sortKey) {
        case 'id':
          return item.id || '';
        case 'name':
          return item.name || '';
        case 'criteria':
          return item.criteria || '';
        case 'level':
          return item.level || '';
        case 'department':
          return item.department || '';
        default:
          return '';
      }
    };

    const va = getValue(a);
    const vb = getValue(b);

    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * dir;
    }

    return String(va).localeCompare(String(vb), 'th') * dir;
  });

  const filteredData = sortedData.filter((item) => {
    const matchText =
      item.name.toLowerCase().includes(filterText.toLowerCase()) ||
      item.id.toLowerCase().includes(filterText.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchKpiType =
      kpiTypeFilter === 'all'
        ? true
        : kpiTypeFilter === 'moph'
        ? item.isMophKpi === true
        : item.isMophKpi !== true;
    const matchDepartment =
      departmentFilter === 'all' || item.department === departmentFilter;

    return matchText && matchStatus && matchKpiType && matchDepartment;
  });

  const totalCount = filteredData.length;
  const mophCount = filteredData.filter((item) => item.isMophKpi).length;
  const provinceCount = totalCount - mophCount;

  const totalColumns = showActionColumn ? 9 : 8;

  const getStatusBadge = (status: KPIStatus) => {
    switch (status) {
      case 'pass':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            ผ่านเกณฑ์
          </span>
        );
      case 'fail':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            ไม่ผ่าน
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            รอประเมิน
          </span>
        );
    }
  };

  const handleSort = (key: 'id' | 'name' | 'criteria' | 'level' | 'department') => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (key: 'id' | 'name' | 'criteria' | 'level' | 'department') => {
    if (sortKey !== key) return <span className="ml-1 text-gray-300">↕</span>;
    return (
      <span className="ml-1 text-gray-500">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText size={20} className="text-green-600" /> รายการตัวชี้วัด
        </h3>
        <div className="flex gap-2 flex-wrap md:flex-nowrap items-center justify-end">
          <div className="relative w-full md:w-auto">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="ค้นหารหัส หรือ ชื่อตัวชี้วัด..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-64"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | KPIStatus)}
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="pass">ผ่านเกณฑ์</option>
            <option value="fail">ไม่ผ่านเกณฑ์</option>
            <option value="pending">รอประเมิน</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={kpiTypeFilter}
            onChange={(e) => setKpiTypeFilter(e.target.value as 'all' | 'moph' | 'province')}
          >
            <option value="all">ประเภทตัวชี้วัดทั้งหมด</option>
            <option value="moph">ตัวชี้วัดตรวจราชการ</option>
            <option value="province">ตัวชี้วัดจังหวัด</option>
          </select>
          {!hideDepartmentFilter && (
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as 'all' | string)}
            >
              <option value="all">กลุ่มงานทั้งหมด</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        {showRowCountSummary && !loading && !error && (
          <div className="px-6 pt-4 pb-2 text-sm text-gray-700">
            แสดง{' '}
            <span className="font-bold">{totalCount.toLocaleString('th-TH')}</span> จาก{' '}
            <span className="font-bold">{sourceData.length.toLocaleString('th-TH')}</span> แถว
          </div>
        )}
        {showHeaderSummary && !loading && !error && totalCount > 0 && (
          <div className="px-6 pt-4 pb-2 text-sm text-gray-700">
            รวม{' '}
            <span className="font-bold">{totalCount.toLocaleString('th-TH')}</span> ตัวชี้วัด  ,{' '}
            ตรวจราชการ{' '}
            <span className="font-bold">{mophCount.toLocaleString('th-TH')}</span> ตัวชี้วัด  , จังหวัด{' '}
            <span className="font-bold">{provinceCount.toLocaleString('th-TH')}</span> ตัวชี้วัด
          </div>
        )}
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-green-700"
                  onClick={() => handleSort('id')}
                >
                  รหัส
                  {renderSortIndicator('id')}
                </button>
              </th>
              <th className="px-6 py-4 w-1/3">
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-green-700"
                  onClick={() => handleSort('name')}
                >
                  ชื่อตัวชี้วัด
                  {renderSortIndicator('name')}
                </button>
              </th>
              <th className="px-6 py-4 text-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-green-700"
                  onClick={() => handleSort('criteria')}
                >
                  เกณฑ์
                  {renderSortIndicator('criteria')}
                </button>
              </th>
              <th className="px-6 py-4 text-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-green-700"
                  onClick={() => handleSort('level')}
                >
                  ระดับ
                  {renderSortIndicator('level')}
                </button>
              </th>
              <th className="px-6 py-4">
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-green-700"
                  onClick={() => handleSort('department')}
                >
                  กลุ่มงาน
                  {renderSortIndicator('department')}
                </button>
              </th>
              <th className="px-6 py-4 text-center">ผลลัพธ์</th>
              <th className="px-6 py-4 text-center">สถานะ</th>
              <th className="px-6 py-4 text-center">อัพเดทล่าสุด</th>
              {showActionColumn && (
                <th className="px-6 py-4 text-center">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 relative">
            {isLoading && (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="px-6 py-8"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูลตัวชี้วัด...</div>
                    <div className="text-xs text-gray-400">กรุณารอสักครู่</div>
                  </div>
                </td>
              </tr>
            )}
            {loading && !isLoading && (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="px-6 py-6 text-center text-gray-400 text-sm animate-pulse"
                >
                  กำลังดึงข้อมูล...
                </td>
              </tr>
            )}
            {!loading && !isLoading && error && (
              <tr>
                <td colSpan={totalColumns} className="px-6 py-4 text-center text-red-500 text-sm">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !isLoading && !error &&
              filteredData.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-green-700">{kpi.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{kpi.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {EXCELLENCE_DESCRIPTION[kpi.excellence] ?? kpi.excellence}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 bg-gray-50/50 font-mono text-xs">
                    {kpi.criteria}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${
                        kpi.level === 'province'
                          ? 'border-blue-200 text-blue-600 bg-blue-50'
                          : 'border-orange-200 text-orange-600 bg-orange-50'
                      }`}
                    >
                      {kpi.level === 'province' ? 'จังหวัด' : 'อำเภอ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{kpi.department}</td>
                  <td className="px-6 py-4 text-center font-bold">
                    {kpiSummary[kpi.id]?.rate ? `${kpiSummary[kpi.id]?.rate}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(kpi.status)}</td>
                  <td className="px-6 py-4 text-center text-xs text-gray-500 whitespace-nowrap">
                    {kpiSummary[kpi.id]?.lastUpdated ?? kpi.lastUpdated ?? '-'}
                  </td>
                  {showActionColumn && (
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full border border-green-200 text-green-600 hover:bg-green-50 px-3 py-1 text-xs font-medium"
                        title="บันทึกข้อมูลตัวชี้วัดนี้"
                        onClick={() => onActionClick && onActionClick(kpi)}
                      >
                        <Save size={14} className="mr-1" /> บันทึก
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            {!loading && !error && filteredData.length > 0 && (
              <tr className="bg-gray-50">
                <td
                  colSpan={totalColumns}
                  className="px-6 py-3 text-right text-xs text-gray-500 font-medium"
                >
                  รวม {totalCount.toLocaleString('th-TH')} ตัวชี้วัด
                  {' '}
                  · ตรวจราชการ {mophCount.toLocaleString('th-TH')} ตัวชี้วัด
                  {' '}
                  · จังหวัด {provinceCount.toLocaleString('th-TH')} ตัวชี้วัด
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!loading && !error && filteredData.length === 0 && (
          <div className="p-8 text-center text-gray-400">ไม่พบข้อมูลตัวชี้วัด</div>
        )}
      </div>
    </div>
  );
};

export default KPITable;
