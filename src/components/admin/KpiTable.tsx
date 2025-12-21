'use client';

import React from 'react';

interface KpiTableProps {
  kpis: any[];
  onEdit: (kpi: any) => void;
  onDelete: (id: string) => void;
}

export default function KpiTable({ kpis, onEdit, onDelete }: KpiTableProps) {
  const getAreaLevelBadge = (level: string) => {
    if (level === 'จังหวัด') {
      return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">จังหวัด</span>;
    }
    if (level === 'อำเภอ') {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">อำเภอ</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">{level}</span>;
  };

  const getKpiTypeBadge = (type: string) => {
    if (type === 'ตัวชี้วัดจังหวัด') {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">จังหวัด</span>;
    }
    if (type === 'ตรวจราชการ') {
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">ตรวจราชการ</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">{type}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Area Level
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Target
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Excellence
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {kpis.map((kpi) => (
            <tr key={kpi.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {kpi.id}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <div className="max-w-xs truncate" title={kpi.name}>
                  {kpi.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getKpiTypeBadge(kpi.kpi_type)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getAreaLevelBadge(kpi.area_level)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {kpi.ssj_department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {kpi.target_result}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {kpi.excellence}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(kpi)}
                  className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(kpi.id)}
                  className="text-red-600 hover:text-red-900 cursor-pointer"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {kpis.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No KPIs found
        </div>
      )}
    </div>
  );
}
