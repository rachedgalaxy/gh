
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../services/storage';
import { Class, Student, WEEK_DAYS } from '../types';
import { 
  Trash2, Plus, Clock, CalendarDays, School, Edit3, 
  CheckCircle2, UserPlus, FileSpreadsheet, Users, 
  X, Search, UserMinus, AlertTriangle, ShieldAlert,
  AlertOctagon, KeyRound, Eraser, AlertCircle, Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';

type DeleteAction = {
  type: 'class' | 'student' | 'clear_all';
  id?: string;
  name: string;
};

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [isAddStudentMode, setIsAddStudentMode] = useState(false);
  const [newStudentData, setNewStudentData] = useState({ id: '', name: '' });
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<DeleteAction | null>(null);
  const [securityCode, setSecurityCode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Omit<Class, 'id'>>({
    name: '',
    schoolName: '',
    startTime: '08:00',
    endTime: '12:00',
    days: WEEK_DAYS.slice(0, 5)
  });

  useEffect(() => {
    setClasses(storage.getClasses());
  }, []);

  useEffect(() => {
    if (selectedClassForStudents) {
      refreshStudentList();
    }
  }, [selectedClassForStudents]);

  const refreshStudentList = () => {
    if (!selectedClassForStudents) return;
    const all = storage.getStudents();
    setClassStudents(all.filter(s => s.classId === selectedClassForStudents.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.schoolName) return;

    let updatedClasses: Class[];
    if (editingId) {
      updatedClasses = classes.map(c => c.id === editingId ? { ...formData, id: editingId } : c);
    } else {
      const newClass: Class = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9)
      };
      updatedClasses = [...classes, newClass];
    }

    setClasses(updatedClasses);
    storage.saveClasses(updatedClasses);
    resetForm();
  };

  // Fix: Added missing handleImportStudents function
  const handleImportStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClassForStudents) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        const importedStudents: Student[] = data.map(row => {
          const id = String(row['رقم التعريف'] || row['ID'] || row['رقم التسجيل'] || row['id']);
          let fullName = '';
          if (row['اللقب'] && row['الاسم']) {
            fullName = `${row['اللقب']} ${row['الاسم']}`;
          } else {
            fullName = String(row['الاسم الكامل'] || row['الاسم'] || row['Name'] || row['name']);
          }

          return {
            id: id.trim(),
            name: fullName.trim(),
            classId: selectedClassForStudents.id,
          };
        }).filter(s => s.id && s.id !== "undefined" && s.name && s.name !== "undefined");

        if (importedStudents.length === 0) {
          alert('لم يتم العثور على بيانات صالحة في الملف.');
          return;
        }

        const allStudents = storage.getStudents();
        const updated = [...allStudents, ...importedStudents];
        const uniqueUpdated = Array.from(new Map(updated.map(item => [item.id, item])).values());
        
        storage.saveStudents(uniqueUpdated);
        refreshStudentList();
        alert(`تم استيراد ${importedStudents.length} تلاميذ بنجاح للقسم: ${selectedClassForStudents.name}`);
      } catch (err) {
        alert('خطأ في قراءة الملف.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmAction = () => {
    if (securityCode !== '6723' || !pendingDelete) return;

    if (pendingDelete.type === 'class' && pendingDelete.id) {
      const updatedClasses = classes.filter(cls => cls.id !== pendingDelete.id);
      setClasses(updatedClasses);
      storage.saveClasses(updatedClasses);

      const allStudents = storage.getStudents();
      storage.saveStudents(allStudents.filter(s => s.classId !== pendingDelete.id));

      const allAttendance = storage.getAttendance();
      storage.saveAttendance(allAttendance.filter(a => a.classId !== pendingDelete.id));
    } 
    else if (pendingDelete.type === 'student' && pendingDelete.id) {
      const all = storage.getStudents();
      const updated = all.filter(s => s.id !== pendingDelete.id);
      storage.saveStudents(updated);

      const allAttendance = storage.getAttendance();
      storage.saveAttendance(allAttendance.filter(a => a.studentId !== pendingDelete.id));
      
      refreshStudentList();
    } 
    else if (pendingDelete.type === 'clear_all' && selectedClassForStudents) {
      const allStudents = storage.getStudents();
      const remainingStudents = allStudents.filter(s => s.classId !== selectedClassForStudents.id);
      storage.saveStudents(remainingStudents);

      const allAttendance = storage.getAttendance();
      const remainingAttendance = allAttendance.filter(a => a.classId !== selectedClassForStudents.id);
      storage.saveAttendance(remainingAttendance);

      setClassStudents([]);
    }

    setPendingDelete(null);
    setSecurityCode('');
  };

  const resetForm = () => {
    setFormData({ name: '', schoolName: '', startTime: '08:00', endTime: '12:00', days: WEEK_DAYS.slice(0, 5) });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (c: Class) => {
    setFormData({
      name: c.name,
      schoolName: c.schoolName || '',
      startTime: c.startTime,
      endTime: c.endTime,
      days: c.days
    });
    setEditingId(c.id);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <input type="file" className="hidden" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleImportStudents} />

      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <School className="text-blue-600" /> إدارة الأقسام والقوائم
          </h3>
          <p className="text-sm text-slate-500 font-bold mt-1">تخصيص المؤسسات والأفواج التربوية</p>
        </div>
        {!isFormOpen && (
          <button onClick={() => setIsFormOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all">
            <Plus size={20} /> إضافة قسم
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 animate-in fade-in zoom-in-95 duration-200 space-y-8">
           <div className="flex items-center gap-2 text-blue-700">
            <Edit3 size={20} />
            <h4 className="font-black">{editingId ? 'تعديل بيانات القسم' : 'إنشاء قسم دراسي جديد'}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 lg:col-span-1">
              <label className="block text-sm font-black text-slate-700">اسم المؤسسة (المدرسة)</label>
              <div className="relative">
                <Building2 className="absolute right-3 top-3.5 text-slate-400" size={18} />
                <input type="text" className="w-full border-slate-300 bg-slate-50 rounded-2xl pr-10 pl-4 py-3 font-black text-black outline-none focus:ring-2 focus:ring-blue-600" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} placeholder="ابتدائيّة الشهيد..." required />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-1">
              <label className="block text-sm font-black text-slate-700">اسم القسم</label>
              <input type="text" className="w-full border-slate-300 bg-slate-50 rounded-2xl px-4 py-3 font-black text-black outline-none focus:ring-2 focus:ring-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="خامسة ابتدائي" required />
            </div>
            <div className="space-y-2"><label className="block text-sm font-black text-slate-700">توقيت البدء</label><input type="time" className="w-full border-slate-300 bg-slate-50 rounded-2xl px-4 py-3 font-black text-black outline-none" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} /></div>
            <div className="space-y-2"><label className="block text-sm font-black text-slate-700">توقيت الانتهاء</label><input type="time" className="w-full border-slate-300 bg-slate-50 rounded-2xl px-4 py-3 font-black text-black outline-none" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} /></div>
          </div>
          <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
            <button type="button" onClick={resetForm} className="px-8 py-3 rounded-2xl font-black text-slate-500">إلغاء</button>
            <button type="submit" className="bg-green-600 text-white px-12 py-3 rounded-2xl font-black shadow-lg">حفظ البيانات</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all group">
            <div className="flex justify-between mb-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl"><School size={24} /></div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(c)} className="p-2 text-slate-500 hover:text-blue-600 transition-all"><Edit3 size={18} /></button>
                <button onClick={() => setPendingDelete({ type: 'class', id: c.id, name: c.name })} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Building2 size={12} />
                <span className="text-[10px] font-bold uppercase truncate max-w-[200px]">{c.schoolName || 'لم يحدد اسم المدرسة'}</span>
              </div>
              <h4 className="text-xl font-black text-slate-900">{c.name}</h4>
            </div>
            <button onClick={() => setSelectedClassForStudents(c)} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-md hover:bg-blue-700 transition-all">
              <Users size={18} /> إدارة التلاميذ
            </button>
          </div>
        ))}
      </div>

      {selectedClassForStudents && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">إدارة تلاميذ القسم: {selectedClassForStudents.name}</h3>
                  <p className="text-xs text-slate-500 font-bold">{selectedClassForStudents.schoolName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClassForStudents(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-green-700 transition-all"
              >
                <FileSpreadsheet size={18} /> استيراد من إكسيل
              </button>
              <button 
                onClick={() => setPendingDelete({ type: 'clear_all', name: 'كافة التلاميذ في هذا القسم' })}
                className="bg-red-50 text-red-600 border border-red-100 px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-red-100 transition-all"
              >
                <Eraser size={18} /> مسح القائمة الحالية
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 border rounded-2xl">
              <table className="w-full text-right border-collapse">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b">
                    <th className="px-6 py-4 font-black text-slate-600 text-sm">رقم التعريف</th>
                    <th className="px-6 py-4 font-black text-slate-600 text-sm">الاسم الكامل</th>
                    <th className="px-6 py-4 font-black text-slate-600 text-sm text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold">لا يوجد تلاميذ في هذا القسم حالياً</td>
                    </tr>
                  ) : (
                    classStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-mono text-sm">{s.id}</td>
                        <td className="px-6 py-3 font-black text-slate-800">{s.name}</td>
                        <td className="px-6 py-3 text-center">
                          <button 
                            onClick={() => setPendingDelete({ type: 'student', id: s.id, name: s.name })}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <UserMinus size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl border-t-8 border-red-600 animate-in zoom-in-95">
            <div className="flex justify-center">
              <div className="p-4 bg-red-50 rounded-full text-red-600"><AlertOctagon size={48} /></div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">تأكيد الإجراء الخطير</h3>
              <p className="text-slate-500 font-bold mt-2 leading-relaxed">
                هل أنت متأكد من حذف <span className="text-red-600">"{pendingDelete.name}"</span>؟ 
                <br /> هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700">أدخل رمز الأمان (6723) للمتابعة:</label>
              <input 
                type="text" 
                maxLength={4} 
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 text-center font-black text-3xl tracking-[0.5em] focus:border-red-600 outline-none transition-all" 
                value={securityCode} 
                onChange={e => setSecurityCode(e.target.value)} 
                autoFocus 
              />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={handleConfirmAction} 
                disabled={securityCode !== '6723'} 
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-100 disabled:opacity-30 active:scale-95 transition-all"
              >
                تأكيد التنفيذ
              </button>
              <button onClick={() => { setPendingDelete(null); setSecurityCode(''); }} className="w-full text-slate-400 py-2 font-black">تراجع</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
