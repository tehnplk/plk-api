"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
  moneyYear: number;
  onClose: () => void;
  onTargetChange: (district: string, value: string) => void;
  onCellChange: (district: string, month: string, value: string) => void;
  onSaved?: () => void;
}

export default function ReportKpiModal({
  activeKpi,
  months,
  rowKeys,
  gridData,
  targetData,
  moneyYear,
  onClose,
  onTargetChange,
  onCellChange,
  onSaved,
}: ReportKpiModalProps) {
  const router = useRouter();
  const [activeRow, setActiveRow] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  // ฟังก์ชันช่วยเลือก cell ตามตำแหน่งแถว/คอลัมน์ แล้ว focus + select ค่าในช่อง
  const focusCell = (rowIndex: number, colIndex: number) => {
    const selector = `input[data-cell-row="${rowIndex}"][data-cell-col="${colIndex}"]`;
    const next = document.querySelector<HTMLInputElement>(selector);
    if (next) {
      next.focus();
      next.select?.();
    }
  };
  // จัดการการเลื่อนโฟกัสด้วยปุ่มลูกศร 4 ทิศระหว่าง cell ต่าง ๆ
  const handleArrowKey = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const key = e.key;
    if (
      key !== "ArrowUp" &&
      key !== "ArrowDown" &&
      key !== "ArrowLeft" &&
      key !== "ArrowRight"
    ) {
      return;
    }

    e.preventDefault();

    const maxRow = rowKeys.length - 1;
    const maxCol = months.length; // col 0 = เป้า, 1..months.length = เดือน

    let nextRow = rowIndex;
    let nextCol = colIndex;

    if (key === "ArrowUp" && rowIndex > 0) {
      nextRow = rowIndex - 1;
    } else if (key === "ArrowDown" && rowIndex < maxRow) {
      nextRow = rowIndex + 1;
    } else if (key === "ArrowLeft" && colIndex > 0) {
      nextCol = colIndex - 1;
    } else if (key === "ArrowRight" && colIndex < maxCol) {
      nextCol = colIndex + 1;
    }

    // ถ้าไม่มีการเปลี่ยนแถว/คอลัมน์ (อยู่ขอบ) ให้หยุด
    if (nextRow === rowIndex && nextCol === colIndex) return;

    focusCell(nextRow, nextCol);
  };

  // ถ้า modal เพิ่งเปิดและยังไม่มี cell ไหนถูก focus
  // ถ้า user กดปุ่มลูกศรครั้งแรก ให้โฟกัสไปที่ cell แรก (แถวแรก คอลัมน์เป้า)
  React.useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (
        activeRow === null &&
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight")
      ) {
        e.preventDefault();
        focusCell(0, 0);
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [activeRow]);

  // เปลี่ยนค่า input เป้า ระหว่างพิมพ์ (ยังไม่บังคับเป็นค่าบวก)
  // ปล่อยให้ blur เป็นคนจัดการ validation แทน
  const handleTargetInputChange = (district: string, raw: string) => {
    // อนุญาตให้พิมพ์ค่าอะไรก็ได้ระหว่างแก้ไข (รวมถึงค่าลบ)
    // เดี๋ยวตอน blur จะจัดการแปลงเป็นค่าบวกให้เองถ้าจำเป็น
    onTargetChange(district, raw);
  };

  // ตอนหลุดโฟกัสจากช่องเป้า ถ้าค่าติดลบ ให้แปลงเป็นค่าบวก (absolute)
  const handleTargetBlur = (district: string, raw: string) => {
    if (raw === "" || raw === "-") {
      onTargetChange(district, "");
      return;
    }

    const num = parseFloat(raw);
    if (isNaN(num)) {
      onTargetChange(district, "");
      return;
    }

    const fixed = Math.abs(num);
    onTargetChange(district, fixed.toString());
  };

  // เปลี่ยนค่าใน cell รายเดือน ระหว่างพิมพ์ (ยอมให้เป็นค่าลบชั่วคราวได้)
  const handleCellInputChange = (
    district: string,
    month: string,
    raw: string
  ) => {
    onCellChange(district, month, raw);
  };

  // ตอนหลุดโฟกัสช่องรายเดือน ถ้าค่าติดลบหรือไม่ใช่ตัวเลข
  // จะถูกเคลียร์เป็นว่าง หรือแปลงเป็นค่าบวกตามกรณี
  const handleCellBlur = (district: string, month: string, raw: string) => {
    if (raw === "" || raw === "-") {
      onCellChange(district, month, "");
      return;
    }

    const num = parseFloat(raw);
    if (isNaN(num)) {
      onCellChange(district, month, "");
      return;
    }

    const fixed = Math.abs(num);
    onCellChange(district, month, fixed.toString());
  };

  // ฟังก์ชันบันทึกข้อมูลลง Prisma SQLite
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/kpi/save-prisma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kpiId: activeKpi.id,
          kpiName: activeKpi.name,
          targetData,
          gridData,
          months,
          moneyYear,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // ใช้ toast แทน alert เมื่อบันทึกสำเร็จ
        const { toast } = await import('react-toastify');
        toast.success('บันทึกข้อมูลเรียบร้อยแล้ว');
        router.refresh();
        onSaved?.();
        onClose();
      } else {
        const { toast } = await import('react-toastify');
        toast.error('เกิดข้อผิดพลาดในการบันทึก: ' + (result.error || 'ไม่ทราบสาเหตุ'));
      }
    } catch (error) {
      console.error('Save error:', error);
      const { toast } = await import('react-toastify');
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsSaving(false);
    }
  };
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
            <p className="text-xs text-gray-600 mt-0.5">
              เกณฑ์: {activeKpi.criteria}
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
          <form>
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border border-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-3 py-2 border-b border-r text-left text-gray-600"
                    rowSpan={2}
                  >
                    
                  </th>
                  <th
                    className="px-3 py-2 border-b border-r text-center text-gray-600 whitespace-nowrap"
                    rowSpan={2}
                  >
                    เป้า
                  </th>
                  <th
                    className="px-3 py-2 border-b border-r text-center text-gray-600 bg-emerald-50"
                    colSpan={3}
                  >
                    ไตรมาส 1
                  </th>
                  <th
                    className="px-3 py-2 border-b border-r text-center text-gray-600 bg-blue-50"
                    colSpan={3}
                  >
                    ไตรมาส 2
                  </th>
                  <th
                    className="px-3 py-2 border-b border-r text-center text-gray-600 bg-amber-50"
                    colSpan={3}
                  >
                    ไตรมาส 3
                  </th>
                  <th
                    className="px-3 py-2 border-b border-r text-center text-gray-600 bg-rose-50"
                    colSpan={3}
                  >
                    ไตรมาส 4
                  </th>
                  <th
                    className="px-3 py-2 border-b text-center text-gray-600 whitespace-nowrap"
                    rowSpan={2}
                  >
                    Total
                  </th>
                  <th
                    className="px-3 py-2 border-b text-center text-gray-600 whitespace-nowrap"
                    rowSpan={2}
                  >
                    Rate
                  </th>
                </tr>
                <tr>
                  {months.map((m, idx) => {
                    let quarterBg = "";
                    if (idx < 3) quarterBg = "bg-emerald-50"; // Q1
                    else if (idx < 6) quarterBg = "bg-blue-50"; // Q2
                    else if (idx < 9) quarterBg = "bg-amber-50"; // Q3
                    else quarterBg = "bg-rose-50"; // Q4

                    return (
                      <th
                        key={m}
                        className={`px-3 py-2 border-b border-r text-center text-gray-600 whitespace-nowrap ${quarterBg}`}
                      >
                        {m}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rowKeys.map((dist, rowIndex) => {
                  const rowTotal = months.reduce((sum, m) => {
                    const v = parseFloat(gridData[dist]?.[m] || "0");
                    return sum + (isNaN(v) ? 0 : v);
                  }, 0);

                  const target = parseFloat(targetData[dist] || "0");
                  const divideNumber = activeKpi?.divideNumber ?? 1;
                  const rate =
                    target > 0 ? (rowTotal / target) * (divideNumber || 1) : 0;

                  // เมื่อแถวนี้คือแถวที่มี focus อยู่ ให้หนาเส้นขอบบน/ล่าง และเปลี่ยนสีเส้น
                  const activeBorder =
                    activeRow === rowIndex
                      ? " border-t-2 border-b-2 border-blue-700"
                      : "";

                  return (
                    <tr key={dist}>
                      <td
                        className={
                          "px-3 py-2 border-b border-r text-sm text-gray-700 whitespace-nowrap" +
                          activeBorder
                        }
                      >
                        {dist}
                      </td>
                      <td
                        className={
                          "px-2 py-2 border-b border-r text-center bg-gray-50" +
                          activeBorder
                        }
                      >
                        <input
                          type="number"
                          min={0}
                          className="w-full text-center text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                          value={targetData[dist] ?? ""}
                          onChange={(e) =>
                            handleTargetInputChange(dist, e.target.value)
                          }
                          onBlur={(e) =>
                            handleTargetBlur(dist, e.target.value)
                          }
                          data-cell-row={rowIndex}
                          data-cell-col={0}
                          onFocus={() => setActiveRow(rowIndex)}
                          onKeyDown={(e) => handleArrowKey(e, rowIndex, 0)}
                        />
                      </td>
                      {months.map((m, monthIndex) => (
                        <td
                          key={m}
                          className={
                            "px-2 py-2 border-b border-r text-center" +
                            activeBorder
                          }
                        >
                          <input
                            type="number"
                            min={0}
                            className="w-full text-center text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                            value={gridData[dist]?.[m] ?? ""}
                            onChange={(e) =>
                              handleCellInputChange(dist, m, e.target.value)
                            }
                            onBlur={(e) =>
                              handleCellBlur(dist, m, e.target.value)
                            }
                            data-cell-row={rowIndex}
                            data-cell-col={monthIndex + 1}
                            onFocus={() => setActiveRow(rowIndex)}
                            onKeyDown={(e) =>
                              handleArrowKey(e, rowIndex, monthIndex + 1)
                            }
                          />
                        </td>
                      ))}
                      <td
                        className={
                          "px-3 py-2 border-b text-right text-gray-700 font-semibold bg-gray-50" +
                          activeBorder
                        }
                      >
                        {rowTotal.toLocaleString("th-TH")}
                      </td>
                      <td
                        className={
                          "px-3 py-2 border-b text-right text-gray-700 font-semibold bg-gray-50" +
                          activeBorder
                        }
                      >
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
                  <td className="px-3 py-2 border-t text-right text-gray-900 font-bold">
                    {(() => {
                      const targetTotal = rowKeys.reduce((sum, dist) => {
                        const v = parseFloat(targetData[dist] || "0");
                        return sum + (isNaN(v) ? 0 : v);
                      }, 0);
                      const grandTotal = rowKeys.reduce((sumDist, dist) => {
                        return (
                          sumDist +
                          months.reduce((sumMonth, m) => {
                            const v = parseFloat(gridData[dist]?.[m] || "0");
                            return sumMonth + (isNaN(v) ? 0 : v);
                          }, 0)
                        );
                      }, 0);
                      const divideNumber = activeKpi?.divideNumber ?? 1;
                      const rate =
                        targetTotal > 0
                          ? (grandTotal / targetTotal) * (divideNumber || 1)
                          : 0;
                      return rate ? rate.toFixed(2) : "-";
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
