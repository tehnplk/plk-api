import React from 'react';

export default function KpiFormFields({
  mode,
  kpi,
}: {
  mode: 'create' | 'edit';
  kpi?: any;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">KPI ID *</label>
          <input
            type="text"
            name="id"
            defaultValue={kpi?.id ?? ''}
            required
            readOnly={mode === 'edit'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area Level *</label>
          <select
            name="area_level"
            defaultValue={kpi?.area_level ?? 'อำเภอ'}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="อำเภอ">อำเภอ</option>
            <option value="จังหวัด">จังหวัด</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name *</label>
        <textarea
          name="name"
          defaultValue={kpi?.name ?? ''}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Criteria *</label>
        <textarea
          name="evaluation_criteria"
          defaultValue={kpi?.evaluation_criteria ?? ''}
          required
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
        <input
          type="text"
          name="condition"
          defaultValue={kpi?.condition ?? ''}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Result *</label>
          <input
            type="number"
            step="0.01"
            name="target_result"
            defaultValue={kpi?.target_result ?? ''}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Divide Number</label>
          <input
            type="number"
            step="0.01"
            name="divide_number"
            defaultValue={kpi?.divide_number ?? 100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Excellence *</label>
          <input
            type="text"
            name="excellence"
            defaultValue={kpi?.excellence ?? ''}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">KPI Type *</label>
          <select
            name="kpi_type"
            defaultValue={kpi?.kpi_type ?? 'ตัวชี้วัดจังหวัด'}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ตัวชี้วัดจังหวัด">ตัวชี้วัดจังหวัด</option>
            <option value="ตรวจราชการ">ตรวจราชการ</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SSJ Department *</label>
          <input
            type="text"
            name="ssj_department"
            defaultValue={kpi?.ssj_department ?? ''}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SSJ PM</label>
          <input
            type="text"
            name="ssj_pm"
            defaultValue={kpi?.ssj_pm ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MOPH Department</label>
          <input
            type="text"
            name="moph_department"
            defaultValue={kpi?.moph_department ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
          <input
            type="text"
            name="grade"
            defaultValue={kpi?.grade ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Template URL</label>
        <input
          type="url"
          name="template_url"
          defaultValue={kpi?.template_url ?? ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sum Result</label>
        <input
          type="text"
          name="sum_result"
          defaultValue={kpi?.sum_result ?? ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
