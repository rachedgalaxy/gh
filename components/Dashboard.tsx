
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { AttendanceRecord, Student, Class } from '../types';
import { Users, UserX, UserCheck, School, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    presentToday: 0,
    absentToday: 0,
    justifiedToday: 0,
    peKitToday: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const students = storage.getStudents();
    const classes = storage.getClasses();
    const attendance = storage.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    
    const todayRecords = attendance.filter(a => a.date === today);
    
    setStats({
      totalStudents: students.length,
      totalClasses: classes.length,
      presentToday: todayRecords.filter(r => r.status === 'present').length,
      peKitToday: todayRecords.filter(r => r.status === 'pe_kit').length,
      justifiedToday: todayRecords.filter(r => r.status === 'justified').length,
      absentToday: todayRecords.filter(r => r.status === 'absent').length
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const records = attendance.filter(a => a.date === dateStr);
      return {
        date: new Date(dateStr).toLocaleDateString('ar-u-nu-latn', { weekday: 'short' }),
        'حاضر (ح)': records.filter(r => r.status === 'present').length,
        'بدون بدلة (أ)': records.filter(r => r.status === 'pe_kit').length,
        'مبرر (ب)': records.filter(r => r.status === 'justified').length,
        'غياب (ج)': records.filter(r => r.status === 'absent').length
      };
    }).reverse();

    setChartData(last7Days);
  }, []);

  const metricCards = [
    { label: 'إجمالي التلاميذ', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'حاضر (ح)', value: stats.presentToday, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'بدون بدلة (أ)', value: stats.peKitToday, icon: School, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'مبرر (ب)', value: stats.justifiedToday, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'غياب (ج)', value: stats.absentToday, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 font-cairo">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className={`${card.bg} ${card.color} p-2.5 rounded-xl`}><card.icon size={20} /></div>
              <span className="text-slate-400 text-[9px] font-bold">اليوم</span>
            </div>
            <h3 className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-tight">{card.label}</h3>
            <p className="text-2xl font-black text-slate-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={20} /> التحليل التفصيلي للحالات الأربع
            </h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ح</span>
               <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> أ</span>
               <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><span className="w-2 h-2 rounded-full bg-amber-500"></span> ب</span>
               <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><span className="w-2 h-2 rounded-full bg-rose-500"></span> ج</span>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontSize: '12px' }} 
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="حاضر (ح)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="بدون بدلة (أ)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="مبرر (ب)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="غياب (ج)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 mb-6 border-b pb-3">توزيع الحضور والغياب</h3>
          
          <div className="flex-1 space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-emerald-50 hover:border-emerald-100 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-emerald-100">ح</div>
                <div><p className="text-sm font-black text-slate-700">حاضر</p><p className="text-[10px] text-slate-500 font-bold">تلميذ حاضر ببدلته</p></div>
              </div>
              <span className="text-xl font-black text-emerald-600">{stats.presentToday}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-indigo-50 hover:border-indigo-100 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-indigo-100">أ</div>
                <div><p className="text-sm font-black text-slate-700">بدون بدلة</p><p className="text-[10px] text-slate-500 font-bold">يُحسب ضمن الحضور</p></div>
              </div>
              <span className="text-xl font-black text-indigo-600">{stats.peKitToday}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-amber-50 hover:border-amber-100 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-amber-100">ب</div>
                <div><p className="text-sm font-black text-slate-700">مبرر</p><p className="text-[10px] text-slate-500 font-bold">غياب بعذر مقبول</p></div>
              </div>
              <span className="text-xl font-black text-amber-600">{stats.justifiedToday}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-rose-50 hover:border-rose-100 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-rose-100">ج</div>
                <div><p className="text-sm font-black text-slate-700">غياب</p><p className="text-[10px] text-slate-500 font-bold">غياب غير مبرر</p></div>
              </div>
              <span className="text-xl font-black text-rose-600">{stats.absentToday}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
