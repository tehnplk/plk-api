"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { Database, RefreshCw, Trash2, Eye } from 'lucide-react';

interface DbTable {
  name: string;
  label: string;
  records: number;
  canClear: boolean;
  canSync: boolean;
}

export default function DbManagePage() {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTable, setViewTable] = useState<DbTable | null>(null);
  const [viewRows, setViewRows] = useState<any[]>([]);
  const [viewColumns, setViewColumns] = useState<string[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);
  const [filterKpiId, setFilterKpiId] = useState('');
  const [filterKpiName, setFilterKpiName] = useState('');
  const [filterAreaLevel, setFilterAreaLevel] = useState('');
  const [filterReportKpiId, setFilterReportKpiId] = useState('');
  const [filterReportYear, setFilterReportYear] = useState('');
  const [filterReportAreaLevel, setFilterReportAreaLevel] = useState('');

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/db/tables');
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
      } else {
        setError(data.message || 'ไม่สามารถโหลดข้อมูลตารางได้');
      }
    } catch (err) {
      console.error('Error loading DB tables:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลตาราง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (viewTable?.name === 'kpis' || viewTable?.name === 'kpi_report') {
      applyFilters();
    } else {
      setFilteredRows([]);
    }
  }, [
    viewRows,
    viewTable?.name,
    filterKpiId,
    filterKpiName,
    filterAreaLevel,
    filterReportKpiId,
    filterReportYear,
    filterReportAreaLevel,
  ]);

  const applyFilters = () => {
    if (viewTable?.name === 'kpis') {
      let filtered = viewRows;

      if (filterKpiId.trim()) {
        filtered = filtered.filter((row) =>
          String(row.id || '')
            .toLowerCase()
            .includes(filterKpiId.toLowerCase())
        );
      }

      if (filterKpiName.trim()) {
        filtered = filtered.filter((row) =>
          String(row.name || '')
            .toLowerCase()
            .includes(filterKpiName.toLowerCase())
        );
      }

      if (filterAreaLevel.trim()) {
        filtered = filtered.filter((row) => row.area_level === filterAreaLevel);
      }

      setFilteredRows(filtered);
      return;
    }

    if (viewTable?.name === 'kpi_report') {
      let filtered = viewRows;

      if (filterReportKpiId.trim()) {
        filtered = filtered.filter((row) =>
          String(row.kpi_id || '')
            .toLowerCase()
            .includes(filterReportKpiId.toLowerCase())
        );
      }

      if (filterReportYear.trim()) {
        filtered = filtered.filter(
          (row) => String(row.money_year || '') === String(filterReportYear)
        );
      }

      if (filterReportAreaLevel.trim()) {
        filtered = filtered.filter((row) => row.area_level === filterReportAreaLevel);
      }

      setFilteredRows(filtered);
      return;
    }

    setFilteredRows([]);
  };

  const clearFilters = () => {
    if (viewTable?.name === 'kpis') {
      setFilterKpiId('');
      setFilterKpiName('');
      setFilterAreaLevel('');
      return;
    }

    if (viewTable?.name === 'kpi_report') {
      setFilterReportKpiId('');
      setFilterReportYear('');
      setFilterReportAreaLevel('');
      return;
    }
  };

  const resetAllFilters = () => {
    setFilterKpiId('');
    setFilterKpiName('');
    setFilterAreaLevel('');
    setFilterReportKpiId('');
    setFilterReportYear('');
    setFilterReportAreaLevel('');
    setFilteredRows([]);
  };

  const handleClear = async (table: DbTable) => {
    // TODO: เชื่อมต่อ API ล้างข้อมูลตาราง
    if (!table.canClear) return;

    const doClear = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/db/clear-table', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ table: table.name }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(data.message || 'ไม่สามารถล้างข้อมูลตารางได้');
          return;
        }

        toast.success(`ล้างข้อมูลตาราง ${table.label} เรียบร้อยแล้ว`);
        await loadTables();
      } catch (err) {
        console.error('Error clearing table:', err);
        toast.error('เกิดข้อผิดพลาดในการล้างข้อมูลตาราง');
      } finally {
        setLoading(false);
      }
    };

    const result = await Swal.fire({
      title: 'ยืนยันการล้างข้อมูล',
      text: `ต้องการล้างข้อมูลทั้งหมดในตาราง "${table.label}" หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      void doClear();
    }
  };

  const handleSync = async (table: DbTable) => {
    // TODO: เชื่อมต่อ API sync ข้อมูลตาราง
    if (!table.canSync || isSyncing) return;

    // ตอนนี้รองรับ Sync เฉพาะตาราง kpis โดยเรียก /api/kpi/sync แบบเดียวกับปุ่มที่หน้า /home
    if (table.name !== 'kpis') {
      toast.info(`ฟังก์ชัน Sync ของตาราง ${table.name} ยังไม่ได้เชื่อมต่อ API`);
      return;
    }

    const doSync = async () => {
      try {
        setIsSyncing(true);
        setLoading(true);
        const response = await fetch('/api/kpi/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (result.success) {
          toast.success(`Sync สำเร็จ! อัปเดต ${result.count} รายการ`);
          await loadTables();
        } else {
          toast.error(result.message || 'Sync ล้มเหลว');
        }
      } catch (error) {
        console.error('Sync error:', error);
        toast.error('Sync ล้มเหลว กรุณาลองใหม่');
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    };

    const result = await Swal.fire({
      title: 'ยืนยันการ Sync ข้อมูล',
      text: 'ต้องการ Sync ข้อมูลตัวชี้วัด (kpis) จาก Google Sheets หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      void doSync();
    }
  };

  const handleView = async (table: DbTable) => {
    try {
      setViewTable(table);
      setViewLoading(true);
      setViewError(null);
      setViewRows([]);
      setViewColumns([]);
      resetAllFilters();

      const limitParam = table.name === 'kpi_report' ? '&limit=1000' : '';
      const res = await fetch(
        `/api/db/table-rows?table=${encodeURIComponent(table.name)}${limitParam}`
      );
      const data = await res.json();

      if (data.success) {
        setViewColumns(data.columns || []);
        setViewRows(data.rows || []);
      } else {
        setViewError(data.message || 'ไม่สามารถโหลดข้อมูลจากตารางได้');
      }
    } catch (err) {
      console.error('Error loading table rows:', err);
      setViewError('เกิดข้อผิดพลาดในการโหลดข้อมูลจากตาราง');
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setViewTable(null);
    setViewRows([]);
    setViewColumns([]);
    setViewError(null);
    setViewLoading(false);
    resetAllFilters();
  };

  const isFilterableTable = viewTable?.name === 'kpis' || viewTable?.name === 'kpi_report';
  const displayedRows = isFilterableTable ? filteredRows : viewRows;
  const displayedCount = isFilterableTable ? filteredRows.length : viewRows.length;
  const totalCount = viewRows.length;
  const reportYearOptions =
    viewTable?.name === 'kpi_report'
      ? Array.from(
          new Set(
            viewRows
              .map((r) => (r?.money_year === null || r?.money_year === undefined ? '' : String(r.money_year)))
              .filter(Boolean)
          )
        ).sort((a, b) => Number(b) - Number(a))
      : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Header แบบเดียวกับหน้า /account */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shadow">
            <Database size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">จัดการฐานข้อมูล</h1>
            <p className="text-xs text-gray-500">
              ตารางข้อมูลหลัก {tables.length} ตาราง
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">รายการตารางข้อมูล</p>
              <p className="text-xs text-gray-400">แสดงเฉพาะตารางหลักที่ใช้ในระบบ KPI</p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw size={14} className="animate-spin" />
                กำลังโหลด...
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-800 text-sm border-b border-red-200">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    ลำดับ
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อตาราง
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    เรคอร์ด
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map((table, index) => (
                  <tr key={table.name}>
                    <td className="px-4 py-2 text-gray-700">{index + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{table.label}</span>
                        <span className="text-xs text-gray-400">{table.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-800">
                      {table.records.toLocaleString('th-TH')}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={!table.canClear}
                          onClick={() => handleClear(table)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            table.canClear
                              ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                              : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 size={14} />
                          ล้าง
                        </button>
                        <button
                          type="button"
                          disabled={!table.canSync || isSyncing}
                          onClick={() => handleSync(table)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            table.canSync && !isSyncing
                              ? 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'
                              : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          }`}
                        >
                          <RefreshCw size={14} />
                          Sync
                        </button>
                        <button
                          type="button"
                          onClick={() => handleView(table)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && !error && tables.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={4}>
                      ไม่พบข้อมูลตารางในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewTable && (
        <div className="fixed inset-0 z-50 flex bg-black/40">
          <div className="bg-white shadow-xl w-full h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  แสดงข้อมูลตาราง: {viewTable.label}
                </h2>
                <p className="text-xs text-gray-400">{viewTable.name} (แสดง {displayedCount} แถวจาก {totalCount} แถวทั้งหมด)</p>
              </div>
              <button
                type="button"
                onClick={closeViewModal}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ปิด
              </button>
            </div>

            {viewError && (
              <div className="px-4 py-2 bg-red-50 text-red-800 text-xs border-b border-red-200">
                {viewError}
              </div>
            )}

            {viewLoading ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                <RefreshCw size={16} className="animate-spin mr-2" />
                กำลังโหลดข้อมูล...
              </div>
            ) : (
              <div className="flex-1 overflow-auto flex flex-col">
                {/* Filter Section - แสดงเฉพาะตาราง kpis */}
                {viewTable.name === 'kpis' && (
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="text-xs font-medium text-gray-700 mb-2">กรองข้อมูล KPI</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="ค้นหา KPI ID (เช่น KPI01)"
                          value={filterKpiId}
                          onChange={(e) => setFilterKpiId(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="ค้นหา ชื่อ KPI"
                          value={filterKpiName}
                          onChange={(e) => setFilterKpiName(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-1">
                        <select
                          value={filterAreaLevel}
                          onChange={(e) => setFilterAreaLevel(e.target.value)}
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- ทั้งหมด --</option>
                          <option value="จังหวัด">จังหวัด</option>
                          <option value="อำเภอ">อำเภอ</option>
                        </select>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="px-2 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 rounded-md"
                        >
                          ล้าง
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter Section - ตาราง kpi_report */}
                {viewTable.name === 'kpi_report' && (
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="text-xs font-medium text-gray-700 mb-2">กรองข้อมูลรายงานผล (kpi_report)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="ค้นหา KPI ID (เช่น KPI01)"
                          value={filterReportKpiId}
                          onChange={(e) => setFilterReportKpiId(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <select
                          value={filterReportYear}
                          onChange={(e) => setFilterReportYear(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- ทุกปีงบประมาณ --</option>
                          {reportYearOptions.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-1">
                        <select
                          value={filterReportAreaLevel}
                          onChange={(e) => setFilterReportAreaLevel(e.target.value)}
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- ทั้งหมด --</option>
                          <option value="จังหวัด">จังหวัด</option>
                          <option value="อำเภอ">อำเภอ</option>
                        </select>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="px-2 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 rounded-md"
                        >
                          ล้าง
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {viewRows.length === 0 ? (
                  <div className="flex-1 p-4 text-center text-sm text-gray-500 flex items-center justify-center">
                    ไม่พบข้อมูลในตารางนี้
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {viewColumns.map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {displayedRows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {viewColumns.map((col) => (
                            <td
                              key={col}
                              className="px-3 py-1.5 text-gray-800 align-top whitespace-nowrap max-w-xs truncate"
                              title={
                                row[col] === null || row[col] === undefined
                                  ? ''
                                  : typeof row[col] === 'object'
                                  ? JSON.stringify(row[col])
                                  : String(row[col])
                              }
                            >
                              {row[col] === null || row[col] === undefined
                                ? ''
                                : typeof row[col] === 'object'
                                ? JSON.stringify(row[col])
                                : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
