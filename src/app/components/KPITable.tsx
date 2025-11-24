'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search, Save, TrendingUp, RotateCcw } from 'lucide-react';
import { kpiDataCache } from '../../utils/kpiDataCache';
import KPIDetailModal from './KPIDetailModal';
import { getStatusFromCondition } from '@/utils/conditionEvaluator';

type KPIStatus = 'pass' | 'fail' | 'pending';

const getKpiTypeLabel = (type: string) => {
  switch (type) {
    case 'KPI':
      return 'ตัวชี้วัดจังหวัด';
    case 'KPR':
      return 'ตัวชี้วัดตรวจราชการ';
    case 'PA':
      return 'ตัวชี้วัดตามคำรับรองการปฏิบัติราชการ';
    default:
      return type;
  }
};

const getEvaluatedStatus = (kpi: KPIItem): KPIStatus => {
  // Simple status evaluation using sum_result, condition, and target_result
  if (!kpi.result || kpi.result === '0') {
    return 'pending';
  }

  // Evaluate condition: sum_result [condition] target_result
  const sumResult = parseFloat(kpi.result || '0');
  const targetResult = parseFloat(kpi.target?.toString() || '0');

  if (kpi.condition) {
    // Simple mathematical evaluation
    switch (kpi.condition.trim()) {
      case '>':
        return sumResult > targetResult ? 'pass' : 'fail';
      case '>=':
        return sumResult >= targetResult ? 'pass' : 'fail';
      case '<':
        return sumResult < targetResult ? 'pass' : 'fail';
      case '<=':
        return sumResult <= targetResult ? 'pass' : 'fail';
      case '=':
      case '==':
        return sumResult === targetResult ? 'pass' : 'fail';
      default:
        return 'pending';
    }
  }

  return 'pending';
};

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
  divideNumber?: number;
  condition?: string;
  sumResult?: string;
  ssjPm?: string;
  mophDepartment?: string;
  kpiType?: string;
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
  disableDatabaseFetch?: boolean; // New prop to disable Prisma database fetching
  disableDepartmentFiltering?: boolean; // New prop to disable actual department filtering
}

const KPITable: React.FC<KPITableProps> = ({
  data,
  initialDepartment,
  hideDepartmentFilter,
  showActionColumn,
  onActionClick,
  showHeaderSummary,
  showRowCountSummary,
  moneyYear = 2569,
  refreshVersion,
  isLoading,
  disableDatabaseFetch = false, // Default to false for backward compatibility
  disableDepartmentFiltering = false, // Default to false for backward compatibility
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment || 'ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState<KPIStatus | 'ทั้งหมด'>('ทั้งหมด');
  const [selectedKpiType, setSelectedKpiType] = useState<string>('ทั้งหมด');
  const [showMophOnly, setShowMophOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [remoteData, setRemoteData] = useState<KPIItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'id' | 'name' | 'criteria' | 'department' | 'level' | 'status'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Clear all filters and scroll to KPI table section
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('ทั้งหมด');
    setSelectedStatus('ทั้งหมด');
    setSelectedKpiType('ทั้งหมด');
    setShowMophOnly(false);
    
    // Use requestAnimationFrame to ensure scroll happens after DOM updates
    requestAnimationFrame(() => {
      // Scroll to KPI table section
      const element = document.getElementById('kpi-table-section');
      if (element) {
        const navbarHeight = 64; // Height of sticky navbar (h-16 = 64px)
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  };

  useEffect(() => {
    if (data && data.length > 0) return;

    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use cache instead of direct API call
        const cachedData = kpiDataCache.getCachedData();
        let sourceArray: any[] = [];
        
        if (cachedData) {
          sourceArray = cachedData;
        } else {
          // Cache miss, fetch and cache
          const data = await kpiDataCache.loadData();
          sourceArray = data;
        }
        
        if (cancelled) return;

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
            kpiType: raw.kpi_type,
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

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    sourceData.forEach((item) => {
      if (item.department) set.add(item.department);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [sourceData]);

  const kpiTypeOptions = useMemo(() => {
    const set = new Set<string>();
    sourceData.forEach((item) => {
      if (item.kpiType) set.add(item.kpiType);
    });
    return Array.from(set).sort();
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

  const filteredData = sortedData.filter((item: KPIItem) => {
    const matchText =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'ทั้งหมด' || getEvaluatedStatus(item) === selectedStatus;
    const matchKpiType = selectedKpiType === 'ทั้งหมด' || item.kpiType === selectedKpiType;
    const matchDepartment =
      selectedDepartment === 'ทั้งหมด' || item.department === selectedDepartment;
    
    return matchText && matchStatus && matchKpiType && matchDepartment;
  });

  const totalCount = filteredData.length;
  const mophCount = filteredData.filter((item: KPIItem) => item.kpiType === 'KPR').length;
  const provinceCount = totalCount - mophCount;

  const totalColumns = showActionColumn ? 10 : 9;

  const getStatusBadge = (kpi: KPIItem) => {
    const evaluatedStatus = getEvaluatedStatus(kpi);

    switch (evaluatedStatus) {
      case 'pass':
        return (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500" title="ผ่าน"></span>
        );
      case 'fail':
        return (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500" title="ไม่ผ่าน"></span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500" title="รอประเมิน"></span>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!hideDepartmentFilter && (
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value as 'ทั้งหมด' | string)}
            >
              <option value="ทั้งหมด">กลุ่มงานทั้งหมด</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={selectedKpiType}
            onChange={(e) => setSelectedKpiType(e.target.value)}
          >
            <option value="ทั้งหมด">ประเภทตัวชี้วัดทั้งหมด</option>
            {kpiTypeOptions.map((type) => (
              <option key={type} value={type}>
                {getKpiTypeLabel(type)}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'ทั้งหมด' | KPIStatus)}
          >
            <option value="ทั้งหมด">สถานะทั้งหมด</option>
            <option value="pass">🟢 ผ่าน</option>
            <option value="fail">🔴 ไม่ผ่าน</option>
            <option value="pending">🟡 รอประเมิน</option>
          </select>
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            title="ล้างตัวกรองทั้งหมด"
          >
            <RotateCcw size={14} />
            ล้างตัวกรอง
          </button>
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
              <th className="px-6 py-4 text-center">ผลงาน</th>
              <th className="px-6 py-4 text-center">สถานะ</th>
              <th className="px-6 py-4 text-center">ดูรายละเอียด</th>
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
              filteredData.map((kpi: KPIItem) => (
                <tr key={kpi.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-green-700">{kpi.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{kpi.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {EXCELLENCE_DESCRIPTION[kpi.excellence] ?? kpi.excellence}
                    </div>
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
                  <td className="px-6 py-4 text-center text-gray-600 bg-gray-50/50 font-mono text-xs">
                    {kpi.criteria}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {kpi.result && kpi.result !== '0' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        {kpi.result}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(kpi)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 p-2"
                      title="ดูรายละเอียดและกราฟ"
                      onClick={() => {
                        setSelectedKpiId(kpi.id);
                        setModalOpen(true);
                      }}
                    >
                      <TrendingUp size={16} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-gray-500 whitespace-nowrap">
                    {kpi.lastUpdated || '-'}
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
      
      {/* KPI Detail Modal */}
      {modalOpen && selectedKpiId && (
        <KPIDetailModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedKpiId(null);
          }}
          kpiId={selectedKpiId}
          moneyYear={moneyYear}
        />
      )}
    </div>
  );
};

export default KPITable;
