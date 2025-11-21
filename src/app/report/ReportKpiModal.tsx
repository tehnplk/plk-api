"use client";

import React from "react";
import { Pencil, X } from "lucide-react";
import type { KPIItem as TableKPIItem } from "../components/KPITable";

// พิมพ์ซ้ำ type ให้ component นี้ใช้เอง (โครงสร้างตรงกับใน page.tsx)
type GridData = Record<string, Record<string, string>>;
type TargetData = Record<string, string>;

interface ReportKpiModalProps {
  activeKpi: TableKPIItem;
  months: string[];
  rowKeys: string[];
  gridData: GridData;
  targetData: TargetData;
  onClose: () => void;
  onTargetChange: (district: string, value: string) => void;
  onCellChange: (district: string, month: string, value: string) => void;
}

export default function ReportKpiModal({
  activeKpi,
  months,
  rowKeys,
  gridData,
  targetData,
  onClose,
  onTargetChange,
  onCellChange,
}: ReportKpiModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full mx-5 my-5 h-[calc(100vh-40px)] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Pencil size={18} className="text-green-600" />
              บันทึกผลการดำเนินงาน
            </h3>
            <p className="text-sm text-gray-800 font-semibold mt-1">
              {activeKpi.id} - {activeKpi.name}
            </p>
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
        <div className="px-6 py-4 overflow-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border border-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 border-b border-r text-left text-gray-600">อำเภอ</th>
                  <th className="px-3 py-2 border-b border-r text-center text-gray-600 whitespace-nowrap">เป้า</th>
                  {months.map((m) => (
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
                  const rowTotal = months.reduce((sum, m) => {
                    const v = parseFloat(gridData[dist]?.[m] || "0");
                    return sum + (isNaN(v) ? 0 : v);
                  }, 0);

                  const target = parseFloat(targetData[dist] || "0");
                  const divideNumber = activeKpi?.divideNumber ?? 1;
                  const rate =
                    target > 0 ? (rowTotal / target) * (divideNumber || 1) : 0;

                  return (
                    <tr key={dist}>
                      <td className="px-3 py-2 border-b border-r text-sm text-gray-700 whitespace-nowrap">
                        {dist}
                      </td>
                      <td className="px-2 py-2 border-b border-r text-center bg-gray-50">
                        <input
                          type="number"
                          className="w-full text-center text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                          value={targetData[dist] ?? ""}
                          onChange={(e) => onTargetChange(dist, e.target.value)}
                        />
                      </td>
                      {months.map((m) => (
                        <td
                          key={m}
                          className="px-2 py-2 border-b border-r text-center"
                        >
                          <input
                            type="number"
                            className="w-full text-center text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                            value={gridData[dist]?.[m] ?? ""}
                            onChange={(e) => onCellChange(dist, m, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 border-b text-right text-gray-700 font-semibold bg-gray-50">
                        {rowTotal.toLocaleString("th-TH")}
                      </td>
                      <td className="px-3 py-2 border-b text-right text-gray-700 font-semibold bg-gray-50">
                        {rate ? rate.toFixed(2) : "-"}
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
                        const v = parseFloat(targetData[dist] || "0");
                        return sum + (isNaN(v) ? 0 : v);
                      }, 0);
                      return targetTotal.toLocaleString("th-TH");
                    })()}
                  </td>
                  {months.map((m) => {
                    const colTotal = rowKeys.reduce((sum, dist) => {
                      const v = parseFloat(gridData[dist]?.[m] || "0");
                      return sum + (isNaN(v) ? 0 : v);
                    }, 0);
                    return (
                      <td
                        key={m}
                        className="px-3 py-2 border-t border-r text-right text-gray-700 font-semibold"
                      >
                        {colTotal.toLocaleString("th-TH")}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 border-t text-right text-gray-900 font-bold">
                    {(() => {
                      const grandTotal = rowKeys.reduce((sumDist, dist) => {
                        return (
                          sumDist +
                          months.reduce((sumMonth, m) => {
                            const v = parseFloat(gridData[dist]?.[m] || "0");
                            return sumMonth + (isNaN(v) ? 0 : v);
                          }, 0)
                        );
                      }, 0);
                      return grandTotal.toLocaleString("th-TH");
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
