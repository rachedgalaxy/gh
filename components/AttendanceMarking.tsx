
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Student, Class, AttendanceRecord, AttendanceStatus, STATUS_LABELS, STATUS_COLORS } from '../types';
import { CheckCircle2, XCircle, Shirt, AlertCircle, Save, Users, Zap } from 'lucide-react';

const AttendanceMarking: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, AttendanceStatus | undefined>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadedClasses = storage.getClasses();
    setClasses(loadedClasses);
    if (loadedClasses.length > 0) setSelectedClassId(loadedClasses[0].id);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const allStudents = storage.getStudents();
      const classStudents = allStudents.filter(s => s.classId === selectedClassId);
      setStudents(classStudents);

      const allAttendance = storage.getAttendance();
      const existingToday = allAttendance.filter(a => a.classId === selectedClassId && a.date === date);
      
      const initialMap: Record<string, AttendanceStatus | undefined> = {};
      classStudents.forEach(s => {
        const record = existingToday.find(a => a.studentId === s.id);
        initialMap[s.id] = record ? record.status : undefined;
      });
      setCurrentAttendance(initialMap);
    }
  }, [selectedClassId, date]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setCurrentAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllAsPresent = () => {
    const newMap: Record<string, AttendanceStatus | undefined> = { ...currentAttendance };
    students.forEach(s => {
      if (!newMap[s.id]) newMap[s.id] = 'present';
    });
    setCurrentAttendance(newMap);
  };

  const handleSave = () => {
    const unMarkedCount = students.filter(s => !currentAttendance[s.id]).length;
    
    if (unMarkedCount > 0) {
      alert(`تنبيه: يوجد ${unMarkedCount} تلاميذ لم يتم تحديد حالتهم بعد.`);
      return;
    }

    const allAttendance = storage.getAttendance();
    const filteredAttendance = allAttendance.filter(a => !(a.classId === selectedClassId && a.date === date));
    
    const newRecords: AttendanceRecord[] = students.map(s => ({
      id: `${Date.now()}-${s.id}`,
      studentId: s.id,
      classId: selectedClassId,
      status: currentAttendance[s.id] as AttendanceStatus,
      date: date,
    }));

    storage.saveAttendance([...filteredAttendance, ...newRecords]);
    alert('تم حفظ كشف الحضور بنجاح.');
  };

  const markedCount = Object.values(currentAttendance).filter(v => v !== undefined).length;

  return (
    <div className="relative space-y-6 max-w-[1600px] mx-auto pb-32">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase px-1">القسم التربوي</label>
            <select 
              className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 pr-4 pl-10 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase px-1">تاريخ اليوم</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={markAllAsPresent}
          className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100 whitespace-nowrap h-[52px]"
        >
          <Zap size={18} /> تحديد البقية كـ "ح"
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {students.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <Users size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-400 font-bold text-lg">يرجى إضافة تلاميذ لهذا القسم أولاً</p>
          </div>
        ) : (
          students.map(student => {
            const status = currentAttendance[student.id];
            return (
              <div key={student.id} className={`bg-white p-5 rounded-[2rem] shadow-sm border-2 transition-all ${status ? 'border-indigo-100' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start mb-5">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">معرف: {student.id}</span>
                    <h3 className="font-black text-slate-900 text-base leading-tight mt-1 truncate">{student.name}</h3>
                  </div>
                  {status ? (
                    <div className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black border ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status].split(' ')[0]}
                    </div>
                  ) : (
                    <div className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black border border-slate-100 bg-slate-50 text-slate-400">
                      لم ينادَ
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleStatusChange(student.id, 'present')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all border ${status === 'present' ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}>
                    <CheckCircle2 size={16} /> حاضر (ح)
                  </button>
                  <button onClick={() => handleStatusChange(student.id, 'pe_kit')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all border ${status === 'pe_kit' ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}>
                    <Shirt size={16} /> بدلة (أ)
                  </button>
                  <button onClick={() => handleStatusChange(student.id, 'justified')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all border ${status === 'justified' ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}>
                    <AlertCircle size={16} /> مبرر (ب)
                  </button>
                  <button onClick={() => handleStatusChange(student.id, 'absent')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all border ${status === 'absent' ? 'bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}>
                    <XCircle size={16} /> غياب (ج)
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:right-64 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-40 no-print">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-auto flex flex-col gap-1.5">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اكتمال القائمة</span>
                <span className="text-xs font-black text-indigo-600">{markedCount} / {students.length}</span>
              </div>
              <div className="w-full sm:w-80 h-3 bg-slate-100 rounded-full border border-slate-200">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-700" 
                  style={{ width: `${(markedCount / (students.length || 1)) * 100}%` }}
                />
              </div>
            </div>
            
            <button 
              onClick={handleSave}
              className={`w-full sm:w-auto px-16 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-lg shadow-2xl ${markedCount === students.length ? 'bg-slate-900 text-white hover:bg-black active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              <Save size={24} /> حفظ كشف المنادات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
