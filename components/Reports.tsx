
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { AttendanceRecord, Class, STATUS_LABELS } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FileBarChart, TrendingUp, Users, UserX, Printer, School, Calendar, Info, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

const Reports: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  useEffect(() => {
    setAttendance(storage.getAttendance());
    setClasses(storage.getClasses());
  }, []);

  const getChartData = (classId: string) => {
    const filtered = classId === 'all' ? attendance : attendance.filter(a => a.classId === classId);
    
    const stats = {
      present: filtered.filter(a => a.status === 'present').length,
      pe_kit: filtered.filter(a => a.status === 'pe_kit').length,
      justified: filtered.filter(a => a.status === 'justified').length,
      absent: filtered.filter(a => a.status === 'absent').length,
    };

    const orderColors: Record<string, string> = {
      present: '#10b981', // ح - أخضر
      pe_kit: '#3b82f6',  // أ - أزرق
      justified: '#f59e0b', // ب - برتقالي
      absent: '#ef4444',  // ج - أحمر
    };

    return Object.entries(stats).map(([key, value]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS],
      statusKey: key,
      value,
      color: orderColors[key] || '#cbd5e1'
    }));
  };

  const chartData = getChartData(selectedClassId);
  const totalRecords = chartData.reduce((acc, curr) => acc + curr.value, 0);
  
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedClassName = selectedClassId === 'all' ? 'جميع الأقسام' : selectedClass?.name || '';
  const selectedSchoolName = selectedClassId === 'all' ? 'الجمهورية الجزائرية الديمقراطية الشعبية' : selectedClass?.schoolName || '';

  const physicalPresenceCount = chartData
    .filter(d => d.statusKey === 'present' || d.statusKey === 'pe_kit')
    .reduce((acc, d) => acc + d.value, 0);

  const handlePrint = () => {
    // التأكد من أن المتصفح يرى التحديثات قبل الطباعة
    window.print();
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20 font-cairo">
      
      {/* Header for Print - Visible only on Print */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-8 mb-10 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedSchoolName}</h2>
        <h1 className="text-2xl font-black text-slate-950 mb-4 tracking-tight">تقرير إحصائيات الحضور والغياب الدوري</h1>
        <div className="flex justify-center gap-12 text-sm font-bold text-slate-800 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2"><School size={16} /> القسم: {selectedClassName}</div>
          <div className="flex items-center gap-2"><Calendar size={16} /> التاريخ: {new Date().toLocaleDateString('ar-DZ')}</div>
        </div>
      </div>

      {/* Toolbar for Screen - Hidden on Print */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <FileBarChart size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">إحصائيات الحضور والغياب</h3>
              <p className="text-slate-500 font-bold text-sm">تحليل وتدقيق شامل لبيانات المنادات</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className="w-full md:w-72 bg-slate-50 border-slate-300 rounded-xl py-3 px-5 font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm appearance-none cursor-pointer"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="all">كل الأقسام والمؤسسات</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.schoolName?.substring(0, 15)}...
                </option>
              ))}
            </select>
            <button 
              onClick={handlePrint} 
              className="p-3.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all flex items-center gap-2 px-8 shadow-xl active:scale-95"
            >
              <Printer size={20} />
              <span className="font-black text-sm">طباعة التقرير</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1 print:gap-12">
        
        {/* Chart Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 min-h-[500px] flex flex-col print:border-none print:shadow-none print:min-h-0 print:p-0">
          <h4 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-5 flex justify-between items-center">
            <span className="flex items-center gap-2"><TrendingUp size={20} className="text-indigo-600" /> تحليل توزيع الحالات</span>
          </h4>
          
          {totalRecords > 0 ? (
            <div className="w-full h-[400px] print:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {chartData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6 py-20">
              <UserX size={80} className="opacity-10" />
              <p className="font-black text-xl text-slate-400">لا توجد بيانات لهذا الاختيار</p>
            </div>
          )}
        </div>

        {/* Data Analysis Cards */}
        <div className="space-y-6">
          
          {/* Main Counter Card */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-2 print:border-slate-100 print:shadow-none">
            <div className="relative z-10">
              <h4 className="text-xs font-black opacity-60 mb-2 uppercase tracking-widest">إجمالي الحضور والغياب</h4>
              <div className="flex items-end gap-3 mb-8">
                <span className="text-6xl font-black">{totalRecords}</span>
                <span className="text-lg font-bold mb-2 opacity-80 tracking-tight">إجمالي السجلات</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-5 rounded-3xl border border-white/10 backdrop-blur-md print:bg-slate-50 print:border-slate-100">
                  <p className="text-[10px] font-black opacity-60 uppercase mb-1">نسبة الانضباط</p>
                  <p className="text-2xl font-black">
                     {totalRecords > 0 ? ((physicalPresenceCount / totalRecords) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="bg-white/10 p-5 rounded-3xl border border-white/10 backdrop-blur-md print:bg-slate-50 print:border-slate-100">
                  <p className="text-[10px] font-black opacity-60 uppercase mb-1">الحضور الفعلي</p>
                  <p className="text-2xl font-black">{physicalPresenceCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown List Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0">
            <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-lg">
              التفصيل العددي للحالات
            </h4>
            <div className="space-y-3">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/50 print:bg-white print:border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="font-black text-slate-700 text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-lg border border-slate-100">
                      {totalRecords > 0 ? ((item.value / totalRecords) * 100).toFixed(1) : 0}%
                    </span>
                    <span className="text-xl font-black text-slate-900 w-10 text-center">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4 no-print">
              <Info className="text-blue-600 shrink-0" size={20} />
              <p className="text-[10px] font-bold text-blue-900 leading-relaxed">
                يتم احتساب هذه النسب بناءً على كافة المنادات المسجلة في قاعدة البيانات المحلية. الحالات (ب) و (ج) تؤثر مباشرة على المردود العام للقسم.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Footer for Print */}
      <div className="hidden print:flex justify-between items-center mt-20 px-10">
        <div className="text-center">
          <p className="font-black border-b border-black pb-4 mb-12 w-48 mx-auto text-sm">ختم وتوقيع المدير</p>
        </div>
        <div className="text-center">
          <p className="font-black border-b border-black pb-4 mb-12 w-48 mx-auto text-sm">ختم وتوقيع الأستاذ</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
