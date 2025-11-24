'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Calendar, TrendingUp, Target, Users, Award, Building } from 'lucide-react';
import { kpiDataCache } from '../../../utils/kpiDataCache';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
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

export default function KPIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kpiId = params.id as string;
  
  const [kpiDetail, setKpiDetail] = useState<KPIDetail | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [districtData, setDistrictData] = useState<DistrictData[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('ทั้งหมด');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moneyYear, setMoneyYear] = useState<number>(2569);

  useEffect(() => {
    if (!kpiId) return;

    // Get moneyYear from URL params or default to 2569
    const urlParams = new URLSearchParams(window.location.search);
    const yearParam = urlParams.get('moneyYear');
    const year = yearParam ? parseInt(yearParam) : 2569;
    setMoneyYear(year);

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

        // Mockup mode - no database fetching
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
          department: kpiMetadata?.ssj_department || 'ไม่ทราบ',
          target: kpiMetadata?.target_result || null,
          divideNumber: kpiMetadata?.divide_number || null,
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
  }, [kpiId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !kpiDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <TrendingUp size={48} />
          </div>
          <p className="text-red-600 mb-4">{error || 'ไม่พบข้อมูล KPI'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold text-gray-800">รายละเอียด KPI</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column - KPI Description (30%) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">ข้อมูลตัวชี้วัด</h2>
                  <p className="text-sm text-gray-500">รหัส: {kpiDetail.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ชื่อตัวชี้วัด</label>
                  <p className="text-gray-800 font-medium">{kpiDetail.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">หน่วยงาน</label>
                  <p className="text-gray-800 font-medium">{kpiDetail.department}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">ระดับ</label>
                  <p className="text-gray-800 font-medium">{kpiDetail.level}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">เป้าหมาย</label>
                  <p className="text-gray-800 font-medium">
                    {kpiDetail.target !== null ? kpiDetail.target : '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar size={14} />
                    ปีงบประมาณ
                  </label>
                  <p className="text-gray-800 font-medium">{moneyYear}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">เกณฑ์การประเมิน</label>
                  <p className="text-gray-800 text-sm leading-relaxed">{kpiDetail.criteria}</p>
                </div>

                {kpiDetail.lastUpdated && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">อัพเดทล่าสุด</label>
                    <p className="text-gray-800 text-sm">
                      {new Date(kpiDetail.lastUpdated).toLocaleString('th-TH')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Table and Chart (70%) */}
          <div className="lg:col-span-7 space-y-6">

          {/* Data Table */}
          {districtData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">ตารางข้อมูลรายเดือน</h2>
                    <p className="text-sm text-gray-500">แสดงข้อมูลตามรายพื้นที่</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-500">เลือกรายพื้นที่:</label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ทั้งหมด">ทั้งหมด</option>
                    {districtData.map((district) => (
                      <option key={district.area_name} value={district.area_name}>
                        {district.area_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
                    <tr>
                      <th className="px-4 py-3 text-left border border-gray-200">รายพื้นที่</th>
                      <th className="px-4 py-3 text-center border border-gray-200">เป้า</th>
                      {MONTH_NAMES.map((month) => (
                        <th key={month} className="px-3 py-3 text-center border border-gray-200">
                          {month}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center border border-gray-200">รวม</th>
                      <th className="px-4 py-3 text-center border border-gray-200">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedArea === 'ทั้งหมด' 
                      ? districtData.sort((a, b) => {
                          const aIndex = DISTRICTS.indexOf(a.area_name);
                          const bIndex = DISTRICTS.indexOf(b.area_name);
                          return aIndex - bIndex;
                        })
                      : districtData.filter(d => d.area_name === selectedArea)
                    ).map((district) => (
                      <tr key={district.area_name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800 border border-gray-200">
                          {district.area_name}
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-200">
                          {district.target !== null ? district.target : '-'}
                        </td>
                        {district.monthlyValues.map((value, index) => (
                          <td key={index} className="px-3 py-3 text-center border border-gray-200">
                            {value !== null ? value : '-'}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center font-bold border border-gray-200">
                          {district.total}
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-200">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            district.rate >= 100 
                              ? 'bg-green-100 text-green-800' 
                              : district.rate >= 80 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {district.rate}
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Summary Row */}
                    {selectedArea === 'ทั้งหมด' && (
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-4 py-3 text-gray-800 border border-gray-200">
                          รวมทั้งหมด
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-200">
                          {kpiDetail.target !== null ? kpiDetail.target : '-'}
                        </td>
                        {MONTH_NAMES.map((month, index) => {
                          const monthTotal = districtData.reduce((sum, district) => 
                            sum + (district.monthlyValues[index] || 0), 0
                          );
                          return (
                            <td key={month} className="px-3 py-3 text-center border border-gray-200">
                              {monthTotal > 0 ? monthTotal : '-'}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center border border-gray-200">
                          {districtData.reduce((sum, district) => sum + district.total, 0)}
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-200">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            {districtData.length > 0 
                              ? Math.round((districtData.reduce((sum, district) => sum + district.rate, 0) / districtData.length) * 100) / 100
                              : 0}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Line Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">กราฟแนวโน้มผลรวมรายเดือน</h2>
                <p className="text-sm text-gray-500">แสดงผลรวมของ{selectedArea === 'ทั้งหมด' ? 'ทุกรายพื้นที่' : selectedArea}</p>
              </div>
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
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={filteredChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
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
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                        name="ผลรวม"
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Summary Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">ค่าเฉลี่ย</p>
                      <p className="text-lg font-bold text-gray-800">
                        {filteredChartData.filter(d => d.value !== null).length > 0
                          ? (filteredChartData.reduce((sum, d) => sum + (d.value || 0), 0) / 
                             filteredChartData.filter(d => d.value !== null).length).toFixed(2)
                          : '-'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-500">สูงสุด</p>
                      <p className="text-lg font-bold text-green-600">
                        {Math.max(...filteredChartData.map(d => d.value || 0)).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500">ต่ำสุด</p>
                      <p className="text-lg font-bold text-blue-600">
                        {Math.min(...filteredChartData.filter(d => d.value !== null).map(d => d.value || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">ยังไม่มีข้อมูลผลงาน</h3>
                  <p className="text-gray-500 mb-4">ตัวชี้วัดนี้ยังไม่มีการบันทึกข้อมูลในระบบ</p>
                  <p className="text-sm text-gray-400">กรุณาบันทึกข้อมูลผลงานที่หน้ารายงานเพื่อแสดงกราฟ</p>
                </div>
              );
            })()}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}