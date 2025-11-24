'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, TrendingUp, Target, Users, Award, Building } from 'lucide-react';
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
  lastUpdated: string | null;
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
}

export default function KPIDetailModal({ 
  isOpen, 
  onClose, 
  kpiId, 
  moneyYear = 2569 
}: KPIDetailModalProps) {
  const [kpiDetail, setKpiDetail] = useState<KPIDetail | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [districtData, setDistrictData] = useState<DistrictData[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('ทั้งหมด');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // First, fetch KPI metadata from cache
        let kpiMetadata = null;
        try {
          const cachedData = kpiDataCache.getCachedData();
          let allKpis = [];
          
          if (cachedData) {
            allKpis = cachedData;
          } else {
            // Cache miss, fetch and cache
            allKpis = await kpiDataCache.loadData();
          }
          
          kpiMetadata = allKpis.find((kpi: any) => String(kpi.id) === kpiId);
        } catch (err) {
          console.warn('Failed to fetch KPI metadata from cache:', err);
        }

        // Mockup mode - use sample data instead of database
        const mockDatabaseResults = [
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
          lastUpdated: new Date().toISOString(),
        });

        // Prepare monthly data for chart and district data for table
        let chartData: MonthlyData[] = [];
        let districtTableData: DistrictData[] = [];
        
        if (mockDatabaseResults.length > 0) {
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
        } else {
          // Show empty chart if no database data
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
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            onClick={onClose}
            aria-label="ปิด"
          >
            <X size={18} />
          </button>
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
                      <label className="text-sm font-medium text-gray-500">หน่วยงาน</label>
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
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Calendar size={14} />
                        ปีงบประมาณ
                      </label>
                      <p className="text-gray-800 font-medium text-sm">{moneyYear}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">เกณฑ์การประเมิน</label>
                      <p className="text-gray-800 text-xs leading-relaxed">{kpiDetail.criteria}</p>
                    </div>

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
                                {district.target !== null && district.target > 0 ? district.target : '-'}
                              </td>
                              {district.monthlyValues.map((value, index) => (
                                <td key={index} className="px-2 py-2 text-center border border-gray-200 text-xs">
                                  {value !== null && value > 0 ? value : '-'}
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
