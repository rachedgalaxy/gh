
import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import { Student, AttendanceRecord, STATUS_LABELS, STATUS_COLORS, Class, AttendanceStatus } from '../types';
import { Search, RotateCcw, History, FileCode, CheckCircle, AlertCircle, XCircle, Shirt, Calendar, Users } from 'lucide-react';

const AttendanceHistory: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAttendance(storage.getAttendance());
    setStudents(storage.getStudents());
    setClasses(storage.getClasses());
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterClass('all');
    setFilterDateStart('');
    setFilterDateEnd('');
  };

  const getStatusLetter = (status: AttendanceStatus) => {
    switch(status) {
      case 'present': return 'ح';
      case 'pe_kit': return 'أ';
      case 'justified': return 'ب';
      case 'absent': return 'ج';
      default: return '-';
    }
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      let matchesDate = true;
      if (filterDateStart && record.date < filterDateStart) matchesDate = false;
      if (filterDateEnd && record.date > filterDateEnd) matchesDate = false;
      
      const student = students.find(s => s.id === record.studentId);
      if (!student) return false;
      
      const matchesClass = filterClass === 'all' || student.classId === filterClass;
      const matchesSearch = searchTerm === '' || student.name.includes(searchTerm) || student.id.includes(searchTerm);
      
      return matchesDate && matchesClass && matchesSearch;
    });
  }, [attendance, students, filterDateStart, filterDateEnd, filterClass, searchTerm]);

  const summaryStats = useMemo(() => {
    return {
      h: filteredAttendance.filter(a => a.status === 'present').length,
      a: filteredAttendance.filter(a => a.status === 'pe_kit').length,
      b: filteredAttendance.filter(a => a.status === 'justified').length,
      j: filteredAttendance.filter(a => a.status === 'absent').length
    };
  }, [filteredAttendance]);

  const groupedData = useMemo(() => {
    const groups: Record<string, AttendanceRecord[]> = {};
    filteredAttendance.forEach(record => {
      if (!groups[record.studentId]) groups[record.studentId] = [];
      groups[record.studentId].push(record);
    });

    return students
      .filter(student => {
        const matchesClass = filterClass === 'all' || student.classId === filterClass;
        const matchesSearch = searchTerm === '' || student.name.includes(searchTerm) || student.id.includes(searchTerm);
        return matchesClass && matchesSearch && (groups[student.id] || searchTerm !== '');
      })
      .map(student => ({
        ...student,
        records: (groups[student.id] || []).sort((a, b) => b.date.localeCompare(a.date)),
        className: classes.find(c => c.id === student.classId)?.name || 'قسم غير معروف',
        schoolName: classes.find(c => c.id === student.classId)?.schoolName || ''
      }));
  }, [students, classes, filteredAttendance, searchTerm, filterClass]);

  const generatePrintableHTML = () => {
    const uniqueDates = (Array.from(new Set(filteredAttendance.map(a => a.date))) as string[])
      .sort((a, b) => a.localeCompare(b));

    const currentClass = filterClass !== 'all' ? classes.find(c => c.id === filterClass) : null;
    const currentClassName = currentClass ? currentClass.name : 'جميع الأقسام';
    const currentSchoolName = currentClass ? currentClass.schoolName : '';

    let htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>تقرير حضور - ${currentClassName}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 20px; color: #1e293b; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #000; padding-bottom: 15px; }
            .school-name { font-size: 22px; font-weight: 900; margin-bottom: 5px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
            th, td { border: 1px solid #000; text-align: center; padding: 8px 4px; font-size: 10px; overflow: hidden; }
            th { background-color: #f8fafc; font-weight: 900; }
            .student-name-col { width: 180px; text-align: right; padding-right: 10px; font-weight: bold; font-size: 11px; }
            .status-h { color: #059669; font-weight: 900; }
            .status-a { color: #2563eb; font-weight: 900; }
            .status-b { color: #d97706; font-weight: 900; }
            .status-j { color: #dc2626; font-weight: 900; }
            .footer-info { margin-top: 30px; display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; }
            .legend { margin-top: 20px; display: flex; gap: 20px; justify-content: center; padding: 10px; background: #f1f5f9; border-radius: 8px; font-size: 11px; }
            @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="school-name">${currentSchoolName || 'الجمهورية الجزائرية الديمقراطية الشعبية'}</div>
            <h1 style="font-size: 20px; margin: 10px 0;">سجل متابعة غيابات التلاميذ (ح، أ، ب، ج)</h1>
            <p><strong>القسم:</strong> ${currentClassName} | <strong>الفترة:</strong> من ${filterDateStart || 'البداية'} إلى ${filterDateEnd || 'اليوم'}</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th class="student-name-col">الاسم واللقب</th>
                    ${uniqueDates.map(date => `<th>${date.split('-').slice(1).reverse().join('/')}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${groupedData.map(student => `
                    <tr>
                        <td class="student-name-col">${student.name}</td>
                        ${uniqueDates.map(date => {
                            const record = student.records.find(r => r.date === date);
                            const letter = record ? getStatusLetter(record.status) : '';
                            const statusClass = record ? `status-${record.status === 'absent' ? 'j' : record.status.charAt(0)}` : '';
                            return `<td><span class="${statusClass}">${letter}</span></td>`;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="legend">
            <span class="status-h">ح: حاضر ببدلة</span>
            <span class="status-a">أ: حاضر بدون بدلة</span>
            <span class="status-b">ب: غياب مبرر</span>
            <span class="status-j">ج: غياب غير مبرر</span>
        </div>
        <div class="footer-info">
            <span>توقيع الأستاذ: ..........................</span>
            <span>توقيع الإدارة: ..........................</span>
        </div>
        <div class="no-print" style="position: fixed; bottom: 20px; left: 20px;">
            <button onclick="window.print()" style="padding:15px 30px; background:#1e293b; color:#fff; border:none; cursor:pointer; font-family:Cairo; font-weight:900; border-radius:12px; shadow: 0 10px 15px rgba(0,0,0,0.2);">إصدار أمر الطباعة</button>
        </div>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 font-cairo">
      {/* Search & Stats Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">سجل الغيابات والمتابعة</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase">إدارة الأرشيف والبحث المتقدم</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'ح', value: summaryStats.h, color: 'emerald', icon: CheckCircle },
              { label: 'أ', value: summaryStats.a, color: 'blue', icon: Shirt },
              { label: 'ب', value: summaryStats.b, color: 'amber', icon: AlertCircle },
              { label: 'ج', value: summaryStats.j, color: 'rose', icon: XCircle }
            ].map((stat, idx) => (
              <div key={idx} className={`flex items-center gap-2 px-4 py-2 bg-${stat.color}-50 rounded-2xl border border-${stat.color}-100`}>
                <stat.icon size={14} className={`text-${stat.color}-600`} />
                <span className={`text-xs font-black text-${stat.color}-900`}>{stat.label}: {stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-50">
          <div className="lg:col-span-2 relative">
            <Search className="absolute right-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الرقم..." 
              className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all appearance-none"
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
          >
            <option value="all">جميع الأقسام</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2 font-bold text-[11px] text-slate-900 outline-none" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
            <input type="date" className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2 font-bold text-[11px] text-slate-900 outline-none" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={resetFilters} className="bg-slate-100 p-3 rounded-2xl text-slate-600 hover:bg-slate-200 transition-all shadow-sm"><RotateCcw size={20} /></button>
            <button onClick={generatePrintableHTML} className="flex-1 bg-slate-900 text-white p-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all">
              <FileCode size={18} /> طباعة السجل
            </button>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">التلميذ</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">القسم والمدرسة</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">آخر النشاطات</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">نسبة الحضور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Users size={64} />
                      <p className="font-black text-xl">لا توجد بيانات تطابق البحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                groupedData.map((student) => {
                  const presenceCount = student.records.filter(r => r.status === 'present' || r.status === 'pe_kit').length;
                  const total = student.records.length;
                  const percentage = total > 0 ? Math.round((presenceCount / total) * 100) : 0;
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-900 text-base">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {student.id}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl block mb-1">
                          {student.className}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 block truncate max-w-[150px] mx-auto">
                          {student.schoolName}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          {student.records.slice(0, 8).map((record) => (
                            <div 
                              key={record.id}
                              title={`${record.date}: ${STATUS_LABELS[record.status]}`}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] text-white font-black shadow-sm transform hover:scale-110 transition-transform cursor-help ${
                                record.status === 'present' ? 'bg-emerald-500' : 
                                record.status === 'pe_kit' ? 'bg-indigo-500' : 
                                record.status === 'justified' ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            >
                              {getStatusLetter(record.status)}
                            </div>
                          ))}
                          {student.records.length > 8 && <span className="text-[10px] font-bold text-slate-300 self-center">+</span>}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden border border-slate-200">
                             <div 
                              className={`h-full transition-all duration-1000 ${percentage > 80 ? 'bg-emerald-500' : percentage > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${percentage}%` }}
                             />
                          </div>
                          <span className={`text-sm font-black ${percentage > 80 ? 'text-emerald-600' : percentage > 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
