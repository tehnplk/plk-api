import React, { useEffect, useState } from 'react';

interface Department {
  id: string;
  name: string;
  activate: boolean;
}

export default function KpiFormFields({
  mode,
  kpi,
}: {
  mode: 'create' | 'edit';
  kpi?: any;
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(kpi?.ssj_department ?? '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/department');
        const data = await res.json();
        if (data.success) {
          setDepartments(data.data.filter((d: Department) => d.activate));
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Section 1: ข้อมูลหลัก */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">ข้อมูลหลัก</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสตัวชี้วัด *</label>
            <input
              type="text"
              name="id"
              defaultValue={kpi?.id ?? ''}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ระดับพื้นที่ *</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทตัวชี้วัด</label>
            <input
              type="text"
              name="kpi_type"
              defaultValue={kpi?.kpi_type ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อตัวชี้วัด *</label>
          <textarea
            name="name"
            defaultValue={kpi?.name ?? ''}
            required
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Section 2: เกณฑ์และเป้าหมาย */}
      <div className="bg-blue-50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-blue-800 border-b border-blue-200 pb-2">เกณฑ์และเป้าหมาย</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เกณฑ์การประเมิน *</label>
          <textarea
            name="evaluation_criteria"
            defaultValue={kpi?.evaluation_criteria ?? ''}
            required
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เงื่อนไข *</label>
            <input
              type="text"
              name="condition"
              defaultValue={kpi?.condition ?? ''}
              required
              placeholder="เช่น >=, <=, ="
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ค่าเป้าหมาย (อัตรา) *</label>
            <input
              type="number"
              step="0.01"
              name="target_result"
              defaultValue={kpi?.target_result ?? ''}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ตัวหาร</label>
            <input
              type="number"
              step="0.01"
              name="divide_number"
              defaultValue={kpi?.divide_number ?? 100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Section 3: หน่วยงานและผู้รับผิดชอบ */}
      <div className="bg-green-50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-green-800 border-b border-green-200 pb-2">หน่วยงานและผู้รับผิดชอบ</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excellence *</label>
            <input
              type="text"
              name="excellence"
              defaultValue={kpi?.excellence ?? ''}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยงาน กสธ.</label>
            <input
              type="text"
              name="moph_department"
              defaultValue={kpi?.moph_department ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">กลุ่มงาน สสจ. *</label>
            <select
              name="ssj_department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 bg-white"
            >
              <option value="">{isLoading ? '-- กำลังโหลด... --' : '-- เลือกกลุ่มงาน --'}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ผู้รับผิดชอบ สสจ.</label>
            <input
              type="text"
              name="ssj_pm"
              defaultValue={kpi?.ssj_pm ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Section 4: ลิงก์ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์เทมเพลต</label>
        <input
          type="url"
          name="template_url"
          defaultValue={kpi?.template_url ?? ''}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
