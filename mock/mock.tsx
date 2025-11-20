import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  LayoutDashboard, FileText, LogIn, LogOut, ChevronRight, Filter, Search, 
  Save, User, Activity, CheckCircle, XCircle, AlertCircle, Menu, X, MapPin, Target
} from 'lucide-react';

// --- Configuration & Constants ---

const THEME = {
  primary: '#00A651', // MOPH Green
  secondary: '#A3D9A5',
  accent: '#F59E0B',
  bg: '#F3F4F6',
  white: '#FFFFFF',
  textMain: '#1F2937',
  textLight: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6'
};

const DISTRICTS = [
  'เมืองพิษณุโลก', 'นครไทย', 'ชาติตระการ', 'บางระกำ', 'บางกระทุ่ม', 
  'พรหมพิราม', 'วัดโบสถ์', 'วังทอง', 'เนินมะปราง'
];

const EXCELLENCE_STRATEGIES = [
  'PP&P Excellence', 
  'Service Excellence', 
  'People Excellence', 
  'Governance Excellence',
  'Health-Related Economy Excellence'
];

const MONTHS = [
  'ต.ค. 68', 'พ.ย. 68', 'ธ.ค. 68', 'ม.ค. 69', 'ก.พ. 69', 'มี.ค. 69',
  'เม.ย. 69', 'พ.ค. 69', 'มิ.ย. 69', 'ก.ค. 69', 'ส.ค. 69', 'ก.ย. 69'
];

const DEPARTMENTS = [
  { id: 'D01', name: 'กลุ่มงานยุทธศาสตร์ฯ' },
  { id: 'D02', name: 'กลุ่มงานควบคุมโรค' },
  { id: 'D03', name: 'กลุ่มงานส่งเสริมสุขภาพ' },
  { id: 'D04', name: 'กลุ่มงานบริหารทรัพยากรบุคคล' },
  { id: 'D05', name: 'กลุ่มงานทันตสาธารณสุข' }
];

// --- Mock Data Generation ---

const generateMockKPIs = () => {
  const kpis = [];
  for (let i = 1; i <= 25; i++) {
    const level = Math.random() > 0.4 ? 'district' : 'province';
    const statusRandom = Math.random();
    let status = 'pending';
    if (statusRandom > 0.6) status = 'pass';
    else if (statusRandom > 0.3) status = 'fail';

    // Generate random criteria
    const criteriaTypes = ['> 80%', '< 5 ต่อแสนประชากร', 'ผ่านเกณฑ์ระดับ 5', '> 90%', '100%'];
    const criteria = criteriaTypes[Math.floor(Math.random() * criteriaTypes.length)];

    kpis.push({
      id: `KPI-${String(i).padStart(3, '0')}`,
      name: `ตัวชี้วัดที่ ${i} : ${level === 'district' ? 'อัตราการครอบคลุมวัคซีน (รายอำเภอ)' : 'ร้อยละความพึงพอใจผู้รับบริการ (จังหวัด)'}`,
      level: level,
      excellence: EXCELLENCE_STRATEGIES[Math.floor(Math.random() * EXCELLENCE_STRATEGIES.length)],
      department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)].name,
      criteria: criteria,
      target: 80,
      result: status === 'pending' ? null : (Math.random() * 20 + 70).toFixed(2),
      status: status, // pass, fail, pending
      lastUpdated: '15 พ.ย. 68'
    });
  }
  return kpis;
};

const mockKPIs = generateMockKPIs();

// --- Components ---

const StatCard = ({ title, value, subtext, color, icon: Icon }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 transition-all hover:shadow-md" style={{ borderLeftColor: color }}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold" style={{ color: THEME.textMain }}>{value}</h3>
        {subtext && <p className="text-xs mt-2 text-gray-400">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
        <Icon size={24} color={color} />
      </div>
    </div>
  </div>
);

// New Detailed Excellence Box
const ExcellenceBox = ({ title, total, pass, fail, pending, percent }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-bold text-gray-800 text-sm h-10 flex items-center w-2/3">{title}</h4>
      <div className="text-right">
        <span className="block text-2xl font-bold text-green-600">{percent}%</span>
        <span className="text-xs text-gray-400">ประสิทธิผล</span>
      </div>
    </div>
    
    <div className="grid grid-cols-4 gap-2 text-center divide-x divide-gray-100">
      <div>
        <div className="text-xs text-gray-400">ทั้งหมด</div>
        <div className="font-bold text-gray-700">{total}</div>
      </div>
      <div>
        <div className="text-xs text-green-500">ผ่าน</div>
        <div className="font-bold text-green-600">{pass}</div>
      </div>
      <div>
        <div className="text-xs text-red-500">ไม่ผ่าน</div>
        <div className="font-bold text-red-600">{fail}</div>
      </div>
      <div>
        <div className="text-xs text-yellow-500">รอ</div>
        <div className="font-bold text-yellow-600">{pending}</div>
      </div>
    </div>
    
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
      <div 
        className="h-1.5 rounded-full transition-all duration-500" 
        style={{ width: `${percent}%`, backgroundColor: percent >= 80 ? THEME.success : percent >= 50 ? THEME.warning : THEME.danger }}
      ></div>
    </div>
  </div>
);

const KPITable = ({ data }) => {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredData = data.filter(item => {
    const matchText = item.name.toLowerCase().includes(filterText.toLowerCase()) || item.id.toLowerCase().includes(filterText.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchText && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pass': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">ผ่านเกณฑ์</span>;
      case 'fail': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">ไม่ผ่าน</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">รอประเมิน</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText size={20} className="text-green-600"/> รายการตัวชี้วัด
        </h3>
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <div className="relative w-full md:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="ค้นหารหัส หรือ ชื่อตัวชี้วัด..." 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-64"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="pass">ผ่านเกณฑ์</option>
            <option value="fail">ไม่ผ่านเกณฑ์</option>
            <option value="pending">รอประเมิน</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">รหัส</th>
              <th className="px-6 py-4 w-1/3">ชื่อตัวชี้วัด</th>
              <th className="px-6 py-4 text-center">เกณฑ์</th>
              <th className="px-6 py-4 text-center">ระดับ</th>
              <th className="px-6 py-4">กลุ่มงาน</th>
              <th className="px-6 py-4 text-center">ผลลัพธ์</th>
              <th className="px-6 py-4 text-center">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.map((kpi) => (
              <tr key={kpi.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-green-700">{kpi.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{kpi.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{kpi.excellence}</div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600 bg-gray-50/50 font-mono text-xs">
                  {kpi.criteria}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded border ${kpi.level === 'province' ? 'border-blue-200 text-blue-600 bg-blue-50' : 'border-orange-200 text-orange-600 bg-orange-50'}`}>
                    {kpi.level === 'province' ? 'จังหวัด' : 'อำเภอ'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{kpi.department}</td>
                <td className="px-6 py-4 text-center font-bold">
                  {kpi.result ? `${kpi.result}%` : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  {getStatusBadge(kpi.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="p-8 text-center text-gray-400">ไม่พบข้อมูลตัวชี้วัด</div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard, login, report
  const [user, setUser] = useState(null);
  const [selectedDistrictScope, setSelectedDistrictScope] = useState('ALL'); // ALL or District Name
  
  // Derived Statistics
  const stats = useMemo(() => {
    
    const total = mockKPIs.length;
    const pass = mockKPIs.filter(k => k.status === 'pass').length;
    const fail = mockKPIs.filter(k => k.status === 'fail').length;
    const pending = mockKPIs.filter(k => k.status === 'pending').length;
    const percentPass = total > 0 ? ((pass / (total - pending)) * 100).toFixed(1) : 0;
    
    // Mock District Performance Data (% only)
    let districtData = DISTRICTS.map(d => ({
      name: d,
      percent: Math.floor(Math.random() * 40 + 60)
    }));

    // Mock District Comparison Data (Stacked Bar Chart: Pass, Fail, Pending)
    // Generating realistic counts for each district
    const districtComparisonData = DISTRICTS.map(d => {
      const passCount = Math.floor(Math.random() * 15) + 5; // Random 5-20
      const failCount = Math.floor(Math.random() * 5);      // Random 0-4
      const pendingCount = Math.floor(Math.random() * 5);   // Random 0-4
      return {
        name: d,
        pass: passCount,
        fail: failCount,
        pending: pendingCount,
        total: passCount + failCount + pendingCount
      };
    });


    // Excellence Grouping
    const excellenceStats = EXCELLENCE_STRATEGIES.map(strat => {
      const group = mockKPIs.filter(k => k.excellence === strat);
      const gTotal = group.length;
      const gPass = group.filter(k => k.status === 'pass').length;
      const gFail = group.filter(k => k.status === 'fail').length;
      const gPending = group.filter(k => k.status === 'pending').length;
      const denominator = gTotal - gPending;
      return {
        title: strat,
        total: gTotal,
        pass: gPass,
        fail: gFail,
        pending: gPending,
        percent: denominator > 0 ? ((gPass / denominator) * 100).toFixed(0) : 0
      };
    });

    return { total, pass, fail, pending, percentPass, districtData, districtComparisonData, excellenceStats };
  }, [selectedDistrictScope]);

  const handleLogin = (deptId) => {
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    setUser({ ...dept, name: 'สมชาย ใจดี', position: 'นักวิชาการสาธารณสุข' });
    setCurrentPage('report');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  // --- Reporting Page Inner Component ---
  const ReportingPage = () => {
    const [selectedKPI, setSelectedKPI] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
    const [formData, setFormData] = useState({
      province: { target: '', result: '' },
      districts: DISTRICTS.reduce((acc, dist) => ({ ...acc, [dist]: { target: '', result: '' } }), {})
    });

    // Reset form when KPI changes
    useEffect(() => {
      setFormData({
        province: { target: '', result: '' },
        districts: DISTRICTS.reduce((acc, dist) => ({ ...acc, [dist]: { target: '', result: '' } }), {})
      });
    }, [selectedKPI]);

    const kpiObj = mockKPIs.find(k => k.id === selectedKPI);

    const handleDistrictChange = (district, field, value) => {
      setFormData(prev => ({
        ...prev,
        districts: {
          ...prev.districts,
          [district]: { ...prev.districts[district], [field]: value }
        }
      }));
    };

    const calculateOverview = () => {
      if (!kpiObj) return { result: 0, percent: 0 };
      
      if (kpiObj.level === 'province') {
        const t = parseFloat(formData.province.target) || 0;
        const r = parseFloat(formData.province.result) || 0;
        return { result: r, percent: t > 0 ? ((r / t) * 100).toFixed(2) : 0 };
      } else {
        // Sum of all districts
        let sumTarget = 0;
        let sumResult = 0;
        Object.values(formData.districts).forEach(d => {
          sumTarget += parseFloat(d.target) || 0;
          sumResult += parseFloat(d.result) || 0;
        });
        return { result: sumResult, percent: sumTarget > 0 ? ((sumResult / sumTarget) * 100).toFixed(2) : 0 };
      }
    };

    const overview = calculateOverview();

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-green-100">
          <div>
             <h2 className="text-xl font-bold text-green-800">บันทึกผลการดำเนินงาน</h2>
             <p className="text-sm text-gray-500">ผู้รายงาน: {user.name} ({user.department})</p>
          </div>
          <button onClick={() => setCurrentPage('dashboard')} className="text-gray-500 hover:text-green-600 flex items-center gap-1">
            <LayoutDashboard size={18} /> กลับหน้าแดชบอร์ด
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Selection */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">เลือกเดือนที่รายงาน</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">เลือกตัวชี้วัด</label>
              <select 
                value={selectedKPI}
                onChange={(e) => setSelectedKPI(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- กรุณาเลือก --</option>
                {mockKPIs.filter(k => k.department === user.department || true).map(k => ( 
                  // NOTE: Remove || true in production to filter by dept strictly
                  <option key={k.id} value={k.id}>[{k.id}] {k.name.substring(0, 40)}...</option>
                ))}
              </select>
              {kpiObj && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                  <p><strong>ระดับ:</strong> {kpiObj.level === 'province' ? 'จังหวัด' : 'อำเภอ'}</p>
                  <p><strong>Excellence:</strong> {kpiObj.excellence}</p>
                  <p><strong>เกณฑ์:</strong> {kpiObj.criteria}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Data Entry */}
          <div className="md:col-span-2">
            {selectedKPI && kpiObj ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-green-600 p-4 text-white flex justify-between items-center">
                  <h3 className="font-bold">แบบฟอร์มรายงานข้อมูล</h3>
                  <div className="text-right">
                    <div className="text-xs opacity-80">ภาพรวมผลงานจังหวัด</div>
                    <div className="text-2xl font-bold">{overview.percent}%</div>
                  </div>
                </div>
                
                <div className="p-6 max-h-[500px] overflow-y-auto">
                  {kpiObj.level === 'province' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">เป้าหมาย (B)</label>
                        <input 
                          type="number" 
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="ระบุเป้าหมาย"
                          value={formData.province.target}
                          onChange={e => setFormData({...formData, province: {...formData.province, target: e.target.value}})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ผลงาน (A)</label>
                        <input 
                          type="number" 
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="ระบุผลงาน"
                          value={formData.province.result}
                          onChange={e => setFormData({...formData, province: {...formData.province, result: e.target.value}})}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-2 text-sm font-bold text-gray-500 border-b pb-2">
                        <div className="col-span-4">อำเภอ</div>
                        <div className="col-span-3 text-center">เป้าหมาย (B)</div>
                        <div className="col-span-3 text-center">ผลงาน (A)</div>
                        <div className="col-span-2 text-center">ร้อยละ</div>
                      </div>
                      {DISTRICTS.map((dist, idx) => {
                        const t = parseFloat(formData.districts[dist].target) || 0;
                        const r = parseFloat(formData.districts[dist].result) || 0;
                        const p = t > 0 ? ((r/t)*100).toFixed(2) : 0;
                        return (
                          <div key={dist} className="grid grid-cols-12 gap-2 items-center hover:bg-gray-50 p-1 rounded">
                            <div className="col-span-4 text-sm text-gray-800 font-medium">{idx+1}. {dist}</div>
                            <div className="col-span-3">
                              <input 
                                type="number" 
                                className="w-full p-1 border border-gray-300 rounded text-center text-sm"
                                value={formData.districts[dist].target}
                                onChange={e => handleDistrictChange(dist, 'target', e.target.value)}
                              />
                            </div>
                            <div className="col-span-3">
                              <input 
                                type="number" 
                                className="w-full p-1 border border-gray-300 rounded text-center text-sm"
                                value={formData.districts[dist].result}
                                onChange={e => handleDistrictChange(dist, 'result', e.target.value)}
                              />
                            </div>
                            <div className="col-span-2 text-center text-sm font-bold text-green-600">
                              {p}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                  <button className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">ยกเลิก</button>
                  <button 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 shadow-md"
                    onClick={() => alert('บันทึกข้อมูลสำเร็จ! ในระบบจริงจะบันทึกลง Google Sheet')}
                  >
                    <Save size={16} /> บันทึกรายงาน
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-300">
                <FileText size={48} className="mb-2 opacity-20" />
                <p>กรุณาเลือกตัวชี้วัดเพื่อเริ่มรายงาน</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- View Rendering ---

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#F0FDF4' }}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-green-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shadow">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-green-800 leading-tight">PHITSANULOK KPI</h1>
              <p className="text-xs text-green-600 hidden md:block">ระบบรายงานตัวชี้วัด สสจ.พิษณุโลก ปีงบประมาณ 2569</p>
            </div>
          </div>

          <div>
            {user ? (
               <div className="flex items-center gap-3">
                 <div className="text-right hidden md:block">
                   <div className="text-sm font-bold text-gray-700">{user.name}</div>
                   <div className="text-xs text-gray-500">{user.department}</div>
                 </div>
                 <button 
                   onClick={handleLogout}
                   className="p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                   title="ออกจากระบบ"
                 >
                   <LogOut size={20} />
                 </button>
               </div>
            ) : (
              currentPage !== 'login' && (
                <button 
                  onClick={() => setCurrentPage('login')}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm text-sm font-medium"
                >
                  <LogIn size={16} /> เข้าสู่ระบบรายงาน
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        
        {currentPage === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Scope Selection */}
            <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-2">
                 <MapPin className="text-green-600" size={20}/>
                 <span className="text-sm font-bold text-gray-700">พื้นที่รายงาน:</span>
               </div>
               <div className="flex gap-2">
                 <select 
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  value={selectedDistrictScope}
                  onChange={(e) => setSelectedDistrictScope(e.target.value)}
                 >
                   <option value="ALL">ภาพรวมจังหวัด (ทุกอำเภอ)</option>
                   {DISTRICTS.map(d => (
                     <option key={d} value={d}>อำเภอ{d}</option>
                   ))}
                 </select>
                 <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition-colors">
                   แสดงผล
                 </button>
               </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard title={selectedDistrictScope === 'ALL' ? "ตัวชี้วัดจังหวัด" : "ตัวชี้วัดที่เกี่ยวข้อง"} value={stats.total} color={THEME.textMain} icon={FileText} />
              <StatCard title="ผ่านเกณฑ์" value={stats.pass} color={THEME.success} icon={CheckCircle} />
              <StatCard title="ไม่ผ่านเกณฑ์" value={stats.fail} color={THEME.danger} icon={XCircle} />
              <StatCard title="รอประเมิน" value={stats.pending} color={THEME.warning} icon={AlertCircle} />
              <StatCard title="ร้อยละความสำเร็จ" value={`${stats.percentPass}%`} subtext={selectedDistrictScope === 'ALL' ? "ภาพรวมจังหวัด" : `ภาพรวม${selectedDistrictScope}`} color={THEME.primary} icon={Activity} />
            </div>

            {/* Excellence Sections Grid */}
             <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Target size={20} className="text-orange-500"/> สรุปผลการดำเนินงานตามยุทธศาสตร์ (5 Excellence)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.excellenceStats.map((item, idx) => (
                    <ExcellenceBox key={idx} {...item} />
                  ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* EXISTING CHART: District Performance (%) */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">ร้อยละตัวชี้วัดผ่านเกณฑ์ (รายอำเภอ)</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.districtData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{fontSize: 12}} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        cursor={{fill: '#f0fdf4'}}
                      />
                      <Bar dataKey="percent" name="% ผ่านเกณฑ์" fill={THEME.primary} radius={[4, 4, 0, 0]}>
                         {stats.districtData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name === selectedDistrictScope ? THEME.accent : (entry.percent < 50 ? THEME.danger : entry.percent < 80 ? THEME.warning : THEME.primary)} 
                            stroke={entry.name === selectedDistrictScope ? THEME.textMain : 'none'}
                            strokeWidth={entry.name === selectedDistrictScope ? 2 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NEW CHART: District Status Breakdown (Stacked Bar) */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">สถานะตัวชี้วัดรายอำเภอ (จำนวน)</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.districtComparisonData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{fontSize: 12}} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        cursor={{fill: '#f0fdf4'}}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                      <Bar dataKey="pass" name="ผ่าน" stackId="a" fill={THEME.success} />
                      <Bar dataKey="fail" name="ไม่ผ่าน" stackId="a" fill={THEME.danger} />
                      <Bar dataKey="pending" name="รอประเมิน" stackId="a" fill={THEME.warning} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Table Section */}
            <KPITable data={mockKPIs} />
            
          </div>
        )}

        {currentPage === 'login' && (
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border-t-4 border-green-600">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <User size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบรายงาน</h2>
                <p className="text-gray-500 mt-1">เลือกกลุ่มงานเพื่อดำเนินการต่อ</p>
              </div>
              
              <div className="space-y-3">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => handleLogin(dept.id)}
                    className="w-full p-4 text-left border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all group"
                  >
                    <div className="font-semibold">{dept.name}</div>
                    <div className="text-xs text-gray-400 group-hover:text-green-600 flex items-center gap-1">
                      คลิกเพื่อเข้ารายงาน <ChevronRight size={12} />
                    </div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage('dashboard')}
                className="w-full mt-6 py-2 text-sm text-gray-400 hover:text-gray-600"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        )}

        {currentPage === 'report' && user && (
          <ReportingPage />
        )}

      </main>
    </div>
  );
}