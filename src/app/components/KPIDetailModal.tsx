'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, TrendingUp, Target, Users, Award, Building, Save } from 'lucide-react';
import { kpiDataCache } from '../../utils/kpiDataCache';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MONTH_NAMES, MONTH_FIELDS, DISTRICTS } from '@/config/constants';
import { toast } from 'react-toastify';
import { getStatusFromCondition } from '@/utils/conditionEvaluator';

interface KPIDetail {
  id: string;
  name: string;
  criteria: string;
  level: string;
  department: string;
  target: number | null;
  divideNumber: number | null;
  divisionNumber: number | null;
  lastUpdated: string | null;
  grade?: string;
  template_url?: string;
  excellence?: string;
  ssj_pm?: string;
  moph_department?: string;
  kpiType?: string;
  condition?: string;
}

interface MonthlyData {
  month: string;
  value: number | null;
}

interface DistrictData {
  area_name: string;
  target: number | null;
  monthlyValues: (number | null)[];
  total: number;
  rate: number;
  status: string;
}

interface KPIDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiId: string;
  moneyYear?: number;
  session?: any;
}

export default function KPIDetailModal({ 
  isOpen, 
  onClose, 
  kpiId, 
  moneyYear = 2569,
  session
}: KPIDetailModalProps) {
  const [kpiDetail, setKpiDetail] = useState<KPIDetail | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [districtData, setDistrictData] = useState<DistrictData[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('ทั้งหมด');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<Record<string, Record<string, string>>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !kpiId) return;

    const fetchKPIDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, fetch KPI metadata from database
        let kpiMetadata = null;
        try {
          const allKpis = await kpiDataCache.loadData();
          kpiMetadata = allKpis.find((kpi: any) => String(kpi.id) === kpiId);
        } catch (err) {
          console.warn('Failed to fetch KPI metadata from database:', err);
        }

        // If we have no metadata, show error
        if (!kpiMetadata) {
          throw new Error('ไม่พบข้อมูล KPI นี้ในระบบ (Mockup)');
        }

        // Set KPI details from metadata
        const sourceData = kpiMetadata || {};
        setKpiDetail({
          id: kpiId,
          name: kpiMetadata?.name || 'ตัวชี้วัดตัวอย่าง (Mockup)',
          criteria: kpiMetadata?.evaluation_criteria || 'เกณฑ์การประเมินตัวอย่าง',
          level: kpiMetadata?.area_level === 'อำเภอ' ? 'อำเภอ' : 'จังหวัด',
          department: kpiMetadata?.ssj_department || sourceData.area_name || 'ไม่ทราบ',
          target: kpiMetadata?.target_result || sourceData.kpi_target || null,
          divideNumber: kpiMetadata?.divide_number || sourceData.divide_number || null,
          divisionNumber: kpiMetadata?.divide_number || sourceData.divide_number || null,
          lastUpdated: new Date().toISOString(),
          grade: kpiMetadata?.grade || '',
          template_url: kpiMetadata?.template_url || '',
          excellence: kpiMetadata?.excellence || '',
          ssj_pm: kpiMetadata?.ssj_pm || '',
          moph_department: kpiMetadata?.moph_department || '',
          kpiType: kpiMetadata?.kpi_type || '',
          condition: kpiMetadata?.condition || '',
        });

        // Prepare monthly data for chart and district data for table
        let chartData: MonthlyData[] = [];
        let districtTableData: DistrictData[] = [];
        
        // Try to fetch real data from database
        try {
          const response = await fetch(`/api/kpi/report?moneyYear=${moneyYear}&kpiId=${kpiId}`);
          
          if (response.ok) {
            const result = await response.json();
            const realData = result.reports || [];
            
            if (realData.length > 0) {
              // Process real data from database
              districtTableData = realData.map((record: any) => {
                const monthlyValues = MONTH_FIELDS.map(field => 
                  record[field] !== null && record[field] !== undefined 
                    ? Number(record[field]) 
                    : null
                );
                
                const total = monthlyValues.reduce((sum: number, val) => sum + (val || 0), 0);
                const target = record.kpi_target !== null && record.kpi_target !== undefined 
                  ? Number(record.kpi_target) 
                  : null;
                const divideNumber = kpiMetadata?.divide_number !== null && kpiMetadata?.divide_number !== undefined 
                  ? Number(kpiMetadata.divide_number) 
                  : 1;
                const rate = target !== null && target !== undefined && target > 0
                  ? Math.round((total / target) * divideNumber * 100) / 100
                  : 0;

                // คำนวณสถานะแยกรายพื้นที่
                const conditionStr = (kpiMetadata?.condition ?? '').toString().trim();
                const targetForStatus = kpiMetadata?.target_result;
                let status = 'pending';

                if (
                  target !== null &&
                  target !== undefined &&
                  target > 0 &&
                  conditionStr &&
                  targetForStatus !== null &&
                  targetForStatus !== undefined &&
                  !Number.isNaN(Number(targetForStatus))
                ) {
                  status = getStatusFromCondition(
                    conditionStr,
                    Number(targetForStatus),
                    rate
                  );
                }
                
                return {
                  area_name: record.area_name,
                  target,
                  monthlyValues,
                  total,
                  rate,
                  status,
                };
              });

              // Create aggregated chart data (sum of all districts)
              chartData = MONTH_NAMES.map((month, index) => {
                const monthlySum = realData.reduce((sum: number, record: any) => {
                  const value = record[MONTH_FIELDS[index]];
                  return sum + (value !== null && value !== undefined ? Number(value) : 0);
                }, 0);
                
                return {
                  month,
                  value: monthlySum > 0 ? monthlySum : null,
                };
              });
            } else {
              // No real data found, use mockup
              throw new Error('No real data found');
            }
          } else {
            throw new Error('Failed to fetch real data');
          }
        } catch (fetchError) {
          console.warn('Using empty template data due to fetch error or missing report:', fetchError);

          // สร้างแถวว่างสำหรับให้ user กรอกเอง ตามระดับตัวชี้วัด
          const isDistrictLevel = kpiMetadata?.area_level === 'อำเภอ';
          const areaNames = isDistrictLevel ? DISTRICTS : ['จังหวัด'];

          districtTableData = areaNames.map((areaName: string) => ({
            area_name: areaName,
            // ยังไม่มี KpiReport => ยังไม่มี kpi_target ให้แสดง ให้เริ่มจาก null เพื่อให้ user กรอกเอง
            target: null,
            monthlyValues: MONTH_FIELDS.map(() => null),
            total: 0,
            rate: 0,
            status: 'pending',
          }));

          // กราฟว่าง (ไม่มีค่าจริง) แต่โครงสร้างเดือนครบ
          chartData = MONTH_NAMES.map((month) => ({
            month,
            value: null,
          }));
        }

        setMonthlyData(chartData);
        setDistrictData(districtTableData);
      } catch (err: any) {
        console.error('Error fetching KPI detail:', err);
        setError(err?.message || 'ไม่สามารถดึงข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };

    fetchKPIDetail();
  }, [kpiId, moneyYear, isOpen]);

  // When entering edit mode, focus the first editable cell (first row, target column)
  useEffect(() => {
    if (!isOpen || !isEditing || !session || districtData.length === 0) return;

    // Determine first visible area based on current selection and DISTRICTS ordering
    let firstAreaName: string | undefined;
    if (selectedArea === 'ทั้งหมด') {
      const sorted = [...districtData].sort((a, b) => {
        const aIndex = DISTRICTS.indexOf(a.area_name);
        const bIndex = DISTRICTS.indexOf(b.area_name);
        return aIndex - bIndex;
      });
      firstAreaName = sorted[0]?.area_name;
    } else {
      firstAreaName = selectedArea;
    }

    if (!firstAreaName) return;

    // Wait for inputs to be rendered in the DOM
    setTimeout(() => {
      const selector = `input[data-area="${firstAreaName}"][data-field="target"]`;
      const firstInput = document.querySelector<HTMLInputElement>(selector);
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 0);
  }, [isOpen, isEditing, session, districtData, selectedArea]);

  // Initialize editable data when district data changes
  useEffect(() => {
    if (districtData.length > 0) {
      const initialEditableData: Record<string, Record<string, string>> = {};
      districtData.forEach(district => {
        initialEditableData[district.area_name] = {
          target: district.target?.toString() || '',
          ...MONTH_FIELDS.reduce((acc, field, index) => {
            acc[field] = district.monthlyValues[index]?.toString() || '';
            return acc;
          }, {} as Record<string, string>)
        };
      });
      setEditableData(initialEditableData);
    }
  }, [districtData]);

  // Handle cell value changes
  const handleCellChange = (areaName: string, field: string, value: string) => {
    setEditableData(prev => ({
      ...prev,
      [areaName]: {
        ...prev[areaName],
        [field]: value
      }
    }));
  };

  const handleCellKeyDown = (
    areaName: string,
    field: string,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (!isEditing) return;

    const key = event.key;
    if (
      key !== 'ArrowUp' &&
      key !== 'ArrowDown' &&
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight'
    ) {
      return;
    }

    event.preventDefault();

    const columns = ['target', ...MONTH_FIELDS];
    const currentColIndex = columns.indexOf(field);
    if (currentColIndex === -1) return;

    let targetArea = areaName;
    let targetField = field;

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const delta = key === 'ArrowRight' ? 1 : -1;
      const newColIndex = currentColIndex + delta;
      if (newColIndex < 0 || newColIndex >= columns.length) return;
      targetField = columns[newColIndex];
    } else {
      const visibleAreas =
        selectedArea === 'ทั้งหมด'
          ? [...districtData]
              .sort((a, b) => {
                const aIndex = DISTRICTS.indexOf(a.area_name);
                const bIndex = DISTRICTS.indexOf(b.area_name);
                return aIndex - bIndex;
              })
              .map((d) => d.area_name)
          : [selectedArea];

      const currentRowIndex = visibleAreas.indexOf(areaName);
      if (currentRowIndex === -1) return;

      const delta = key === 'ArrowDown' ? 1 : -1;
      const newRowIndex = currentRowIndex + delta;
      if (newRowIndex < 0 || newRowIndex >= visibleAreas.length) return;

      targetArea = visibleAreas[newRowIndex];
    }

    const selector = `input[data-area="${targetArea}"][data-field="${targetField}"]`;
    const nextInput = document.querySelector<HTMLInputElement>(selector);
    if (nextInput) {
      nextInput.focus();
      nextInput.select();
    }
  };

  // Save changes
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Call API to save data
      const response = await fetch('/api/kpi/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moneyYear,
          kpiId,
          kpiName: kpiDetail?.name || '',
          divisionNumber: kpiDetail?.divisionNumber,
          editableData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data');
      }
      
      const result = await response.json();
      
      // Update district data with new values
      const updatedDistrictData = districtData.map(district => {
        const editable = editableData[district.area_name];
        if (editable) {
          const target = parseFloat(editable.target) || null;
          const monthlyValues = MONTH_FIELDS.map(field => parseFloat(editable[field]) || null);
          const total = monthlyValues.reduce((sum: number, val) => sum + (val || 0), 0);
          
          let rate = 0; // Default to 0 instead of null
          if (target !== null && target !== undefined && target > 0) {
            const divideNumber = kpiDetail?.divisionNumber || 1;
            rate = Math.round((total / target) * divideNumber * 100) / 100;
          }

          // Recompute status per area using same logic as KPITable
          let status = 'pending';
          const conditionStr = (kpiDetail?.condition ?? '').toString().trim();
          const targetForStatus = kpiDetail?.target;
          if (
            target !== null &&
            target !== undefined &&
            target > 0 &&
            conditionStr &&
            targetForStatus !== null &&
            targetForStatus !== undefined &&
            !Number.isNaN(Number(targetForStatus))
          ) {
            status = getStatusFromCondition(
              conditionStr,
              Number(targetForStatus),
              rate
            );
          }
          
          return {
            ...district,
            target,
            monthlyValues,
            total: total || 0, // Ensure total is never null for DistrictData type
            rate,
            status,
          };
        }
        return district;
      });

      // Recompute aggregated monthlyData for the line chart ("ทั้งหมด")
      const aggregatedMonthlyData: MonthlyData[] = MONTH_NAMES.map((month, index) => {
        const monthlySum = updatedDistrictData.reduce((sum: number, dist) => {
          const val = dist.monthlyValues[index];
          return sum + (val ?? 0);
        }, 0);

        return {
          month,
          value: monthlySum > 0 ? monthlySum : null,
        };
      });

      setDistrictData(updatedDistrictData);
      setMonthlyData(aggregatedMonthlyData);
      setIsEditing(false);
      
      // Show success message via toast (no item count)
      toast.success('บันทึกข้อมูลสำเร็จ!');
      
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    // Reset editable data to original district data
    const resetData: Record<string, Record<string, string>> = {};
    districtData.forEach(district => {
      resetData[district.area_name] = {
        target: district.target?.toString() || '',
        ...MONTH_FIELDS.reduce((acc, field, index) => {
          acc[field] = district.monthlyValues[index]?.toString() || '';
          return acc;
        }, {} as Record<string, string>)
      };
    });
    setEditableData(resetData);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full mx-5 my-5 h-[calc(100vh-40px)] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Target size={18} className="text-green-600" />
              รายละเอียดตัวชี้วัด
            </h3>
            {kpiDetail && (
              <p className="text-sm text-gray-800 font-semibold mt-1">
                {kpiDetail.id} - {kpiDetail.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {session && districtData.length > 0 && (
              <>
                {!isEditing ? (
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    onClick={() => setIsEditing(true)}
                  >
                    <FileText size={14} />
                    แก้ไขข้อมูล
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                      onClick={handleSave}
                    >
                      <Save size={14} />
                      บันทึก
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center gap-1"
                      onClick={handleCancel}
                    >
                      <X size={14} />
                      ยกเลิก
                    </button>
                  </>
                )}
              </>
            )}
            <button
              type="button"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              onClick={onClose}
              aria-label="ปิด"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mr-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error || !kpiDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500 mr-4">
                <TrendingUp size={48} />
              </div>
              <p className="text-red-600">{error || 'ไม่พบข้อมูล KPI'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Left Column - KPI Description (30%) */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl border p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ชื่อตัวชี้วัด</label>
                      <p className="text-gray-800 font-medium text-sm">{kpiDetail.name}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">กลุ่มงาน</label>
                      <p className="text-gray-800 font-medium text-sm">{kpiDetail.department}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">ระดับ</label>
                      <p className="text-gray-800 font-medium text-sm">{kpiDetail.level}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">เป้าหมาย</label>
                      <p className="text-gray-800 font-medium text-sm">
                        {kpiDetail.target !== null ? kpiDetail.target : '-'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">เกณฑ์การประเมิน</label>
                      <p className="text-gray-800 text-xs leading-relaxed">{kpiDetail.criteria}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Calendar size={14} />
                        ปีงบประมาณ
                      </label>
                      <p className="text-gray-800 font-medium text-sm">{moneyYear}</p>
                    </div>

                    {kpiDetail.divisionNumber !== null && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">ตัวเลขที่ใช้คิดอัตรา</label>
                        <p className="text-gray-800 font-medium text-sm">{kpiDetail.divisionNumber}</p>
                      </div>
                    )}

                    {kpiDetail.lastUpdated && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">อัพเดทล่าสุด</label>
                        <p className="text-gray-800 text-xs">
                          {new Date(kpiDetail.lastUpdated).toLocaleString('th-TH')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Table and Chart (70%) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Data Table */}
                {districtData.length > 0 && (
                  <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Building className="text-blue-600" size={20} />
                        <h4 className="text-sm font-bold text-gray-800">ตารางข้อมูลรายเดือน</h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-500">เลือกพื้นที่:</label>
                        <select
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ทั้งหมด">ทั้งหมด</option>
                          {[...districtData].sort((a, b) => {
                            const aIndex = DISTRICTS.indexOf(a.area_name);
                            const bIndex = DISTRICTS.indexOf(b.area_name);
                            return aIndex - bIndex;
                          }).map((district) => (
                            <option key={district.area_name} value={district.area_name}>
                              {district.area_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
                          <tr>
                            <th className="px-2 py-2 text-left border border-gray-200">พื้นที่</th>
                            <th className="px-2 py-2 text-center border border-gray-200">เป้า</th>
                            {MONTH_NAMES.map((month) => (
                              <th key={month} className="px-2 py-2 text-center border border-gray-200">
                                {month}
                              </th>
                            ))}
                            <th className="px-2 py-2 text-center border border-gray-200">รวม</th>
                            <th className="px-2 py-2 text-center border border-gray-200">Rate</th>
                            <th className="px-2 py-2 text-center border border-gray-200">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(selectedArea === 'ทั้งหมด' 
                            ? [...districtData].sort((a, b) => {
                                const aIndex = DISTRICTS.indexOf(a.area_name);
                                const bIndex = DISTRICTS.indexOf(b.area_name);
                                return aIndex - bIndex;
                              })
                            : districtData.filter(d => d.area_name === selectedArea)
                          ).map((district) => (
                            <tr key={district.area_name} className="hover:bg-gray-50">
                              <td className="px-2 py-2 font-medium text-gray-800 border border-gray-200 text-xs">
                                {district.area_name}
                              </td>
                              <td className="px-2 py-2 text-center border border-gray-200 text-xs">
                                {session && isEditing ? (
                                  <input
                                    type="number"
                                    value={editableData[district.area_name]?.target || ''}
                                    onChange={(e) => handleCellChange(district.area_name, 'target', e.target.value)}
                                    onKeyDown={(e) => handleCellKeyDown(district.area_name, 'target', e)}
                                    data-area={district.area_name}
                                    data-field="target"
                                    className="w-16 px-1 py-0.5 text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                    placeholder="0"
                                  />
                                ) : (
                                  district.target !== null && district.target > 0 ? district.target : '-'
                                )}
                              </td>
                              {district.monthlyValues.map((value, index) => (
                                <td key={index} className="px-2 py-2 text-center border border-gray-200 text-xs">
                                  {session && isEditing ? (
                                    <input
                                      type="number"
                                      value={editableData[district.area_name]?.[MONTH_FIELDS[index]] || ''}
                                      onChange={(e) => handleCellChange(district.area_name, MONTH_FIELDS[index], e.target.value)}
                                      onKeyDown={(e) => handleCellKeyDown(district.area_name, MONTH_FIELDS[index], e)}
                                      data-area={district.area_name}
                                      data-field={MONTH_FIELDS[index]}
                                      className="w-16 px-1 py-0.5 text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                      placeholder="0"
                                    />
                                  ) : (
                                    value !== null && value > 0 ? value : '-'
                                  )}
                                </td>
                              ))}
                              <td className="px-2 py-2 text-center font-bold border border-gray-200 text-xs">
                                {district.total > 0 ? district.total : '-'}
                              </td>
                              <td className="px-2 py-2 text-center border border-gray-200 text-xs">
                                <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-bold ${
                                  district.rate >= 100 
                                    ? 'bg-green-100 text-green-800' 
                                    : district.rate >= 80 
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}>
                                  {district.target !== null && district.target !== undefined && district.target > 0
                                    ? district.rate.toFixed(2)
                                    : '-'}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center border border-gray-200 text-xs">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    district.status === 'pass'
                                      ? 'bg-green-100 text-green-800'
                                      : district.status === 'fail'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {district.status === 'pass'
                                    ? 'ผ่าน'
                                    : district.status === 'fail'
                                      ? 'ไม่ผ่าน'
                                      : 'รอประเมิน'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {/* Summary Row */}
                          {selectedArea === 'ทั้งหมด' && districtData.length > 0 && (() => {
                            const visibleData = [...districtData].sort((a, b) => {
                              const aIndex = DISTRICTS.indexOf(a.area_name);
                              const bIndex = DISTRICTS.indexOf(b.area_name);
                              return aIndex - bIndex;
                            });
                            
                            const totalTarget = visibleData.reduce((sum, d) => sum + (d.target || 0), 0);
                            const monthlyTotals = MONTH_NAMES.map((_, monthIndex) => 
                              visibleData.reduce((sum, d) => sum + (d.monthlyValues[monthIndex] || 0), 0)
                            );
                            const grandTotal = visibleData.reduce((sum, d) => sum + d.total, 0);
                            const divideNumber = kpiDetail?.divideNumber || 1;
                            const summaryRate = totalTarget > 0 
                              ? Math.round((grandTotal / totalTarget) * divideNumber * 100) / 100
                              : 0;

                            // Compute overall summary status using same logic as per-area rows
                            let summaryStatus: 'pass' | 'fail' | 'pending' = 'pending';
                            const conditionStr = (kpiDetail?.condition ?? '').toString().trim();
                            const targetForStatus = kpiDetail?.target;
                            if (
                              totalTarget > 0 &&
                              conditionStr &&
                              targetForStatus !== null &&
                              targetForStatus !== undefined &&
                              !Number.isNaN(Number(targetForStatus))
                            ) {
                              summaryStatus = getStatusFromCondition(
                                conditionStr,
                                Number(targetForStatus),
                                summaryRate
                              );
                            }
                            
                            return (
                              <tr className="bg-gray-100 font-bold">
                                <td className="px-2 py-2 text-gray-800 border border-gray-200 text-xs">
                                  ผลรวม
                                </td>
                                <td className="px-2 py-2 text-center border border-gray-200 text-xs">
                                  {totalTarget > 0 ? totalTarget : '-'}
                                </td>
                                {monthlyTotals.map((total, index) => (
                                  <td key={index} className="px-2 py-2 text-center border border-gray-200 text-xs">
                                    {total > 0 ? total : '-'}
                                  </td>
                                ))}
                                <td className="px-2 py-2 text-center border border-gray-200 text-xs">
                                  {grandTotal > 0 ? grandTotal : '-'}
                                </td>
                                <td className="px-2 py-2 text-center border border-gray-200 text-xs">
                                  <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-bold ${
                                    summaryRate >= 100 
                                      ? 'bg-green-100 text-green-800' 
                                      : summaryRate >= 80 
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    {totalTarget > 0 ? summaryRate.toFixed(2) : '-'}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-center border border-gray-200 text-xs">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      summaryStatus === 'pass'
                                        ? 'bg-green-100 text-green-800'
                                        : summaryStatus === 'fail'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {summaryStatus === 'pass'
                                      ? 'ผ่าน'
                                      : summaryStatus === 'fail'
                                        ? 'ไม่ผ่าน'
                                        : 'รอประเมิน'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Line Chart */}
                <div className="bg-white rounded-xl border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-blue-600" size={20} />
                    <h4 className="text-sm font-bold text-gray-800">กราฟแนวโน้มผลรวมรายเดือน</h4>
                  </div>

                  {(() => {
                    // Filter chart data based on selected area
                    const filteredChartData = selectedArea === 'ทั้งหมด' 
                      ? monthlyData // Already aggregated
                      : (() => {
                          const selectedDistrict = districtData.find(d => d.area_name === selectedArea);
                          return selectedDistrict 
                            ? MONTH_NAMES.map((month, index) => ({
                                month,
                                value: selectedDistrict.monthlyValues[index],
                              }))
                            : MONTH_NAMES.map((month) => ({ month, value: null }));
                        })();

                    const hasData = filteredChartData.some(d => d.value !== null);

                    return hasData ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={filteredChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip 
                            formatter={(value: any) => [
                              value !== null ? `${value}` : '-',
                              'ผลรวม'
                            ]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                            name="ผลรวม"
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="text-gray-400" size={24} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-600 mb-1">ยังไม่มีข้อมูลผลงาน</h3>
                        <p className="text-xs text-gray-500">ตัวชี้วัดนี้ยังไม่มีการบันทึกข้อมูลในระบบ</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
