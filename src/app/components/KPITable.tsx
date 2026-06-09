'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search, TrendingUp, RotateCcw, Download, RefreshCw } from 'lucide-react';
import KPIDetailModal from './KPIDetailModal';
import { getStatusFromCondition } from '@/utils/conditionEvaluator';
import { EXCELLENCE_MAP } from '@/constants/excellence';
import * as XLSX from 'xlsx';

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

const getKpiTypeBadgeClasses = (type: string) => {
  switch (type) {
    case 'KPI':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'KPR':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'PA':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getEvaluatedStatus = (kpi: KPIItem): KPIStatus => {
  // ใช้ util กลางในการประเมิน ผ่าน / ไม่ผ่าน / รอประเมิน
  const condition = (kpi.condition ?? '').toString().trim();

  // ถ้าไม่มี condition เลย ให้ถือว่ายังรอประเมิน
  if (!condition) {
    return 'pending';
  }

  // target จาก field target (number) ของ KPIItem
  const target =
    kpi.target !== undefined && kpi.target !== null
      ? Number(kpi.target)
      : NaN;

  // actual จาก result (string | null) ของ KPIItem
  const actual =
    kpi.result === null || kpi.result === undefined || kpi.result === ''
      ? null
      : Number(kpi.result);

  if (Number.isNaN(target)) {
    return 'pending';
  }

  // ถ้าไม่มี result ให้เป็น pending
  if (actual === null) {
    return 'pending';
  }

  return getStatusFromCondition(condition, target, actual) as KPIStatus;
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
  sum_kpi_target?: number;
  rateFormula?: string;
  lastUpdated?: string;
  condition?: string;
  kpiType?: string;
  template_url?: string;
  ssj_pm?: string;
  moph_department?: string;
}

interface KPITableProps {
  data?: KPIItem[];
  initialDepartment?: string;
  hideDepartmentFilter?: boolean;
  showHeaderSummary?: boolean;
  showRowCountSummary?: boolean;
  moneyYear?: number;
  refreshVersion?: number;
  isLoading?: boolean;
  disableDatabaseFetch?: boolean; // New prop to disable Prisma database fetching
  disableDepartmentFiltering?: boolean; // New prop to disable actual department filtering
  session?: any;
  selectedDistrictScope?: string;
}

const KPITable: React.FC<KPITableProps> = ({
  data,
  initialDepartment,
  hideDepartmentFilter,
  showHeaderSummary,
  showRowCountSummary,
  moneyYear = 2569,
  refreshVersion,
  isLoading,
  disableDatabaseFetch = false, // Default to false for backward compatibility
  disableDepartmentFiltering = false, // Default to false for backward compatibility
  session,
  selectedDistrictScope,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ทั้งหมด');
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<KPIStatus | 'ทั้งหมด'>('ทั้งหมด');
  const [selectedKpiType, setSelectedKpiType] = useState<string>('ทั้งหมด');
  const [selectedAreaLevel, setSelectedAreaLevel] = useState<'ทั้งหมด' | 'จังหวัด' | 'อำเภอ'>('ทั้งหมด');
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
    setSelectedAreaLevel('ทั้งหมด');
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

  // Export filtered data to Excel
  const handleExportExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredData.map((kpi, index) => {
        const evaluatedStatus = getEvaluatedStatus(kpi);
        const statusText = evaluatedStatus === 'pass' ? 'ผ่าน' : 
                          evaluatedStatus === 'fail' ? 'ไม่ผ่าน' : 'รอประเมิน';
        
        return {
          'ลำดับ': index + 1,
          'รหัส': kpi.id,
          'ชื่อตัวชี้วัด': kpi.name,
          'ระดับ': kpi.level === 'province' ? 'จังหวัด' : 'อำเภอ',
          'กลุ่มงาน': kpi.department,
          'เกณฑ์': kpi.criteria,
          'ประเภทตัวชี้วัด': getKpiTypeLabel(kpi.kpiType || ''),
          'ผลงาน': kpi.result || '-',
          'สถานะ': statusText,
          ' Excellence': EXCELLENCE_MAP[kpi.excellence] || kpi.excellence,
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'รายการตัวชี้วัด');

      // Set column widths
      const colWidths = [
        { wch: 8 },   // ลำดับ
        { wch: 15 },  // รหัส
        { wch: 40 },  // ชื่อตัวชี้วัด
        { wch: 12 },  // ระดับ
        { wch: 20 },  // กลุ่มงาน
        { wch: 15 },  // เกณฑ์
        { wch: 20 },  // ประเภทตัวชี้วัด
        { wch: 12 },  // ผลงาน
        { wch: 12 },  // สถานะ
        { wch: 20 },  // Excellence
      ];
      ws['!cols'] = colWidths;

      // Generate filename with current date
      const today = new Date();
      const dateStr = today.toLocaleDateString('th-TH').replace(/\//g, '-');
      const filename = `รายการตัวชี้วัด_${dateStr}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล Excel กรุณาลองใหม่');
    }
  };

  // Fetch data from database
  const fetchDataFromDatabase = async () => {
    try {
      setLoading(true);
      setError(null);

      // ใช้ /api/kpi/dashboard เพื่อให้สถานะตรงกับ Dashboard
      const params = new URLSearchParams();
      params.set('moneyYear', String(moneyYear));
      
      // ถ้าเลือกอำเภอเฉพาะ ให้กรองตามอำเภอนั้น
      if (selectedDistrictScope && selectedDistrictScope !== 'ALL') {
        params.set('areaName', selectedDistrictScope);
      }
      
      const url = `/api/kpi/dashboard?${params.toString()}`;

      console.log('🔄 Fetching data from URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch data');
      }
      
      const apiData = await response.json();
      console.log('📊 Raw API response:', apiData);
      const sourceArray = apiData.data || [];
      console.log('📋 Source array length:', sourceArray.length);

      const rows: KPIItem[] = sourceArray.map((raw: any, index: number) => {
        const areaLevel: string = raw.area_level ?? raw.areaLevel ?? '';

        let level: KPIItem['level'] = 'province';
        if (areaLevel === 'อำเภอ') level = 'district';
        if (areaLevel === 'จังหวัด') level = 'province';

        // ใช้ status ที่ API คำนวณมาแล้วโดยตรง (เหมือนกับ Dashboard)
        const apiStatus = raw.status as KPIStatus || 'pending';
        
        return {
          id: String(raw.id ?? `KPI-${index + 1}`),
          name: String(raw.name ?? ''),
          excellence: String(raw.excellence ?? ''),
          criteria: String(raw.evaluation_criteria ?? ''),
          level,
          department: String(raw.ssj_department ?? ''),
          result: raw.sum_result && raw.sum_result !== '' ? String(raw.sum_result) : null,
          status: apiStatus,
          target: typeof raw.target_result === 'number' ? raw.target_result : undefined,
          sum_kpi_target: typeof raw.sum_kpi_target === 'number' ? raw.sum_kpi_target : undefined,
          condition: raw.condition,
          kpiType: raw.kpi_type,
          rateFormula: raw.rate_formula ?? raw.rateFormula,
          template_url: raw.template_url,
          ssj_pm: raw.ssj_pm,
          moph_department: raw.moph_department,
          lastUpdated: raw.last_synced_at ? new Date(raw.last_synced_at).toLocaleDateString('th-TH') : undefined,
        };
      });

      console.log('✨ Transformed rows:', rows.length);
      console.log('📝 Sample row:', rows[0]);
      setRemoteData(rows);
      console.log('✅ Data set to remoteData state');
    } catch (err: any) {
      console.error('❌ Error in fetchDataFromDatabase:', err);
      setError(err?.message || 'ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data && data.length > 0) return;

    let cancelled = false;
    const fetchData = async () => {
      if (!cancelled) {
        await fetchDataFromDatabase();
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [data, selectedDistrictScope, moneyYear]);

  // Refetch data when refreshVersion changes (triggered by navbar sync)
  useEffect(() => {
    if (refreshVersion && refreshVersion > 0) {
      console.log('🔄 Refresh triggered by navbar sync, version:', refreshVersion);
      fetchDataFromDatabase();
    }
  }, [refreshVersion]);

  useEffect(() => {
    if (initialDepartment && initialDepartment !== 'ทั้งหมด') {
      setSelectedDepartment(initialDepartment);
    }
  }, [initialDepartment]);

  // Fetch user department from account_user
  useEffect(() => {
    if (session?.user) {
      const rawProfile = (session.user as any)?.profile;
      if (rawProfile) {
        try {
          const profile = JSON.parse(rawProfile);
          const providerId = profile.provider_id;
          if (providerId) {
            fetch(`/api/account/role?provider_id=${providerId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success && data.department) {
                  setUserDepartment(data.department);
                  setSelectedDepartment(data.department);
                }
              })
              .catch(() => {});
          }
        } catch {}
      }
    }
  }, [session]);

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
      if (item.kpiType) {
        item.kpiType.split(',').forEach((rawToken) => {
          const token = rawToken.trim();
          if (token) {
            set.add(token);
          }
        });
      }
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
    const matchKpiType =
      selectedKpiType === 'ทั้งหมด' ||
      (item.kpiType &&
        item.kpiType
          .split(',')
          .map((t) => t.trim())
          .includes(selectedKpiType));
    const matchDepartment =
      selectedDepartment === 'ทั้งหมด' || item.department === selectedDepartment;

    const matchAreaLevel =
      selectedAreaLevel === 'ทั้งหมด' ||
      (selectedAreaLevel === 'จังหวัด' && item.level === 'province') ||
      (selectedAreaLevel === 'อำเภอ' && item.level === 'district');
    
    const matches = matchText && matchStatus && matchKpiType && matchDepartment && matchAreaLevel;
    
    // Debug: Log first few items that don't match filters
    if (sortedData.indexOf(item) < 3 && !matches) {
      console.log(`❌ Item ${item.id} filtered out:`, {
        matchText,
        matchStatus,
        matchKpiType,
        matchDepartment,
        matchAreaLevel,
        filters: { searchTerm, selectedStatus, selectedKpiType, selectedDepartment },
        item: { name: item.name, department: item.department, kpiType: item.kpiType, status: getEvaluatedStatus(item) }
      });
    }
    
    return matches;
  });

  console.log(`📊 Filtered ${sortedData.length} items down to ${filteredData.length}`);

  const totalCount = filteredData.length;
  const mophCount = filteredData.filter((item: KPIItem) => item.kpiType === 'KPR').length;
  const provinceCount = totalCount - mophCount;

  const totalColumns = 9;

  const getStatusBadge = (kpi: KPIItem) => {
    const evaluatedStatus = getEvaluatedStatus(kpi);

    if (evaluatedStatus === 'pass') {
      return (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
        >
          ผ่าน
        </span>
      );
    }

    if (evaluatedStatus === 'fail') {
      return (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
        >
          ไม่ผ่าน
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
      >
        รอ...
      </span>
    );
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
            value={selectedAreaLevel}
            onChange={(e) => setSelectedAreaLevel(e.target.value as 'ทั้งหมด' | 'จังหวัด' | 'อำเภอ')}
          >
            <option value="ทั้งหมด">ระดับพื้นที่ทั้งหมด</option>
            <option value="จังหวัด">จังหวัด</option>
            <option value="อำเภอ">อำเภอ</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'ทั้งหมด' | KPIStatus)}
          >
            <option value="ทั้งหมด">สถานะทั้งหมด</option>
            <option value="pass">ผ่าน</option>
            <option value="fail">ไม่ผ่าน</option>
            <option value="pending">รอประเมิน</option>
          </select>
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            title="ล้างตัวกรองทั้งหมด"
          >
            <RotateCcw size={14} />
            ล้างตัวกรอง
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 hover:bg-green-100 flex items-center gap-2 text-green-700"
            title="ส่งออกข้อมูลตามการกรองปัจจุบันเป็นไฟล์ Excel"
            disabled={filteredData.length === 0}
          >
            <Download size={14} />
            ส่งออก Excel
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
              <th className="px-6 py-4 text-center">รายละเอียด</th>
              <th className="px-6 py-4 text-center">อัพเดทล่าสุด</th>
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
                    <div className="text-[11px] mt-0.5">
                      <span className="text-blue-500">
                        {EXCELLENCE_MAP[kpi.excellence] ?? kpi.excellence}
                      </span>
                      {kpi.kpiType && (
                        <>
                          {' · '}
                          <span className="text-green-500">
                            {kpi.kpiType
                              .split(',')
                              .map((t) => t.trim())
                              .filter(Boolean)
                              .map((t) => getKpiTypeLabel(t))
                              .join(', ')}
                          </span>
                        </>
                      )}
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
                    ) : kpi.result === '0' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-200">
                        0.00
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
            fetchDataFromDatabase();
          }}
          kpiId={selectedKpiId}
          moneyYear={moneyYear}
          session={session}
        />
      )}
    </div>
  );
};

export default KPITable;
