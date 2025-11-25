'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, TrendingUp, Target, Users, Award, Building, Save } from 'lucide-react';
import { kpiDataCache } from '../../utils/kpiDataCache';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MONTH_NAMES, MONTH_FIELDS, DISTRICTS } from '@/config/constants';

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

        // Mockup mode - use sample data instead of database
        const mockDatabaseResults = kpiMetadata?.area_level === 'อำเภอ' ? [
          {
            area_name: 'เมืองพิษณุโลก',
            kpi_target: 85,
            result_oct: 82,
            result_nov: 84,
            result_dec: 86,
            result_jan: 83,
            result_feb: 85,
            result_mar: 87,
            result_apr: 84,
            result_may: 86,
            result_jun: 85,
            result_jul: 83,
            result_aug: 84,
            result_sep: 85,
            sum_result: 85,
            rate: 85.5
          },
          {
            area_name: 'นครไทย',
            kpi_target: 80,
            result_oct: 78,
            result_nov: 79,
            result_dec: 81,
            result_jan: 77,
            result_feb: 80,
            result_mar: 82,
            result_apr: 79,
            result_may: 81,
            result_jun: 80,
            result_jul: 78,
            result_aug: 79,
            result_sep: 80,
            sum_result: 80,
            rate: 82.3
          },
          {
            area_name: 'ชาติตระการ',
            kpi_target: 75,
            result_oct: 73,
            result_nov: 74,
            result_dec: 76,
            result_jan: 72,
            result_feb: 75,
            result_mar: 77,
            result_apr: 74,
            result_may: 76,
            result_jun: 75,
            result_jul: 73,
            result_aug: 74,
            result_sep: 75,
            sum_result: 75,
            rate: 78.9
          },
          {
            area_name: 'บางระกำ',
            kpi_target: 82,
            result_oct: 80,
            result_nov: 81,
            result_dec: 83,
            result_jan: 79,
            result_feb: 82,
            result_mar: 84,
            result_apr: 81,
            result_may: 83,
            result_jun: 82,
            result_jul: 80,
            result_aug: 81,
            result_sep: 82,
            sum_result: 82,
            rate: 84.1
          },
          {
            area_name: 'บางกระทุ่ม',
            kpi_target: 78,
            result_oct: 76,
            result_nov: 77,
            result_dec: 79,
            result_jan: 75,
            result_feb: 78,
            result_mar: 80,
            result_apr: 77,
            result_may: 79,
            result_jun: 78,
            result_jul: 76,
            result_aug: 77,
            result_sep: 78,
            sum_result: 78,
            rate: 80.5
          },
          {
            area_name: 'พรหมพิราม',
            kpi_target: 88,
            result_oct: 85,
            result_nov: 86,
            result_dec: 89,
            result_jan: 84,
            result_feb: 87,
            result_mar: 90,
            result_apr: 86,
            result_may: 88,
            result_jun: 87,
            result_jul: 85,
            result_aug: 86,
            result_sep: 87,
            sum_result: 87,
            rate: 89.2
          },
          {
            area_name: 'วัดโบสถ์',
            kpi_target: 76,
            result_oct: 74,
            result_nov: 75,
            result_dec: 77,
            result_jan: 73,
            result_feb: 76,
            result_mar: 78,
            result_apr: 75,
            result_may: 77,
            result_jun: 76,
            result_jul: 74,
            result_aug: 75,
            result_sep: 76,
            sum_result: 76,
            rate: 78.7
          },
          {
            area_name: 'วังทอง',
            kpi_target: 83,
            result_oct: 81,
            result_nov: 82,
            result_dec: 84,
            result_jan: 80,
            result_feb: 83,
            result_mar: 85,
            result_apr: 82,
            result_may: 84,
            result_jun: 83,
            result_jul: 81,
            result_aug: 82,
            result_sep: 83,
            sum_result: 83,
            rate: 85.3
          },
          {
            area_name: 'เนินมะปราง',
            kpi_target: 79,
            result_oct: 77,
            result_nov: 78,
            result_dec: 80,
            result_jan: 76,
            result_feb: 79,
            result_mar: 81,
            result_apr: 78,
            result_may: 80,
            result_jun: 79,
            result_jul: 77,
            result_aug: 78,
            result_sep: 79,
            sum_result: 79,
            rate: 81.6
          }
        ] : [
          {
            area_name: 'จังหวัด',
            kpi_target: 85,
            result_oct: 82,
            result_nov: 84,
            result_dec: 86,
            result_jan: 83,
            result_feb: 85,
            result_mar: 87,
            result_apr: 84,
            result_may: 86,
            result_jun: 85,
            result_jul: 83,
            result_aug: 84,
            result_sep: 85,
            sum_result: 85,
            rate: 85.5
          }
        ];

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
                const rate = target && target > 0 
                  ? Math.round((total / target) * divideNumber * 100) / 100
                  : 0;
                
                return {
                  area_name: record.area_name,
                  target,
                  monthlyValues,
                  total,
                  rate
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
          console.warn('Using mockup data due to fetch error:', fetchError);
          
          // Use mockup data as fallback
          const mockDatabaseResults = kpiMetadata?.area_level === 'อำเภอ' ? [
            {
              area_name: 'เมืองพิษณุโลก',
              kpi_target: 85,
              result_oct: 82,
              result_nov: 84,
              result_dec: 86,
              result_jan: 83,
              result_feb: 85,
              result_mar: 87,
              result_apr: 84,
              result_may: 86,
              result_jun: 85,
              result_jul: 83,
              result_aug: 84,
              result_sep: 85,
              sum_result: 85,
              rate: 85.5
            },
            {
              area_name: 'นครไทย',
              kpi_target: 80,
              result_oct: 78,
              result_nov: 79,
              result_dec: 81,
              result_jan: 77,
              result_feb: 80,
              result_mar: 82,
              result_apr: 79,
              result_may: 81,
              result_jun: 80,
              result_jul: 78,
              result_aug: 79,
              result_sep: 80,
              sum_result: 80,
              rate: 82.3
            },
            {
              area_name: 'ชาติตระการ',
              kpi_target: 75,
              result_oct: 73,
              result_nov: 74,
              result_dec: 76,
              result_jan: 72,
              result_feb: 75,
              result_mar: 77,
              result_apr: 74,
              result_may: 76,
              result_jun: 75,
              result_jul: 73,
              result_aug: 74,
              result_sep: 75,
              sum_result: 75,
              rate: 78.9
            },
            {
              area_name: 'บางระกำ',
              kpi_target: 82,
              result_oct: 80,
              result_nov: 81,
              result_dec: 83,
              result_jan: 79,
              result_feb: 82,
              result_mar: 84,
              result_apr: 81,
              result_may: 83,
              result_jun: 82,
              result_jul: 80,
              result_aug: 81,
              result_sep: 82,
              sum_result: 82,
              rate: 84.1
            },
            {
              area_name: 'บางกระทุ่ม',
              kpi_target: 78,
              result_oct: 76,
              result_nov: 77,
              result_dec: 79,
              result_jan: 75,
              result_feb: 78,
              result_mar: 80,
              result_apr: 77,
              result_may: 79,
              result_jun: 78,
              result_jul: 76,
              result_aug: 77,
              result_sep: 78,
              sum_result: 78,
              rate: 80.5
            },
            {
              area_name: 'พรหมพิราม',
              kpi_target: 88,
              result_oct: 85,
              result_nov: 86,
              result_dec: 89,
              result_jan: 84,
              result_feb: 87,
              result_mar: 90,
              result_apr: 86,
              result_may: 88,
              result_jun: 87,
              result_jul: 85,
              result_aug: 86,
              result_sep: 87,
              sum_result: 87,
              rate: 89.2
            },
            {
              area_name: 'วัดโบสถ์',
              kpi_target: 76,
              result_oct: 74,
              result_nov: 75,
              result_dec: 77,
              result_jan: 73,
              result_feb: 76,
              result_mar: 78,
              result_apr: 75,
              result_may: 77,
              result_jun: 76,
              result_jul: 74,
              result_aug: 75,
              result_sep: 76,
              sum_result: 76,
              rate: 78.7
            },
            {
              area_name: 'วังทอง',
              kpi_target: 83,
              result_oct: 81,
              result_nov: 82,
              result_dec: 84,
              result_jan: 80,
              result_feb: 83,
              result_mar: 85,
              result_apr: 82,
              result_may: 84,
              result_jun: 83,
              result_jul: 81,
              result_aug: 82,
              result_sep: 83,
              sum_result: 83,
              rate: 85.3
            },
            {
              area_name: 'เนินมะปราง',
              kpi_target: 79,
              result_oct: 77,
              result_nov: 78,
              result_dec: 80,
              result_jan: 76,
              result_feb: 79,
              result_mar: 81,
              result_apr: 78,
              result_may: 80,
              result_jun: 79,
              result_jul: 77,
              result_aug: 78,
              result_sep: 79,
              sum_result: 79,
              rate: 81.6
            }
          ] : [
            {
              area_name: 'จังหวัด',
              kpi_target: 85,
              result_oct: 82,
              result_nov: 84,
              result_dec: 86,
              result_jan: 83,
              result_feb: 85,
              result_mar: 87,
              result_apr: 84,
              result_may: 86,
              result_jun: 85,
              result_jul: 83,
              result_aug: 84,
              result_sep: 85,
              sum_result: 85,
              rate: 85.5
            }
          ];

          // Process district data for table
          districtTableData = mockDatabaseResults.map((record: any) => {
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
            const rate = target && target > 0 
              ? Math.round((total / target) * divideNumber * 100) / 100
              : 0;
            
            return {
              area_name: record.area_name,
              target,
              monthlyValues,
              total,
              rate
            };
          });

          // Create aggregated chart data (sum of all districts)
          chartData = MONTH_NAMES.map((month, index) => {
            const monthlySum = mockDatabaseResults.reduce((sum: number, record: any) => {
              const value = record[MONTH_FIELDS[index]];
              return sum + (value !== null && value !== undefined ? Number(value) : 0);
            }, 0);
            
            return {
              month,
              value: monthlySum > 0 ? monthlySum : null,
            };
          });
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
          if (target && target > 0 && total > 0) {
            const divideNumber = kpiDetail?.divisionNumber || 1;
            rate = Math.round((total / target) * divideNumber * 100) / 100;
          }
          
          return {
            ...district,
            target,
            monthlyValues,
            total: total || 0, // Ensure total is never null for DistrictData type
            rate
          };
        }
        return district;
      });
      
      setDistrictData(updatedDistrictData);
      setIsEditing(false);
      
      // Show success message
      alert(`บันทึกข้อมูลสำเร็จ! (${result.count} รายการ)`);
      
    } catch (error) {
      console.error('Error saving data:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
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
                            <th className="px-2 py-2 text-left border border-gray-200">รายพื้นที่</th>
                            <th className="px-2 py-2 text-center border border-gray-200">เป้า</th>
                            {MONTH_NAMES.map((month) => (
                              <th key={month} className="px-2 py-2 text-center border border-gray-200">
                                {month}
                              </th>
                            ))}
                            <th className="px-2 py-2 text-center border border-gray-200">รวม</th>
                            <th className="px-2 py-2 text-center border border-gray-200">Rate</th>
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
                                  {district.rate > 0 ? district.rate : '-'}
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
                                    {summaryRate > 0 ? summaryRate : '-'}
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
