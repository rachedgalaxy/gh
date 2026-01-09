
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../services/storage';
import { Class, Student, WEEK_DAYS } from '../types';
import { 
  Trash2, Plus, Clock, CalendarDays, School, Edit3, 
  CheckCircle2, UserPlus, FileSpreadsheet, Users, 
  X, Search, UserMinus, AlertTriangle, ShieldAlert,
  AlertOctagon, KeyRound, Eraser, AlertCircle, Building2, User
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
  const [pendingDelete, setPendingDelete] = useState<DeleteAction | null>(null);
  const [securityCode, setSecurityCode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Omit<Class, 'id'>>({
    name: '',
    schoolName: '',
    teacherName: '',
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

        const allStudents = storage.getStudents();
        const updated = [...allStudents, ...importedStudents];
        const uniqueUpdated = Array.from(new Map(updated.map(item => [item.id, item])).values());
        
        storage.saveStudents(uniqueUpdated);
        refreshStudentList();
        alert(`تم استيراد ${importedStudents.length} تلاميذ بنجاح.`);
      } catch (err) { alert('خطأ في القراءة.'); }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmAction = () => {
    if (securityCode !== '6723' || !pendingDelete) return;
    // Logic for deletion remains same
    if (pendingDelete.type === 'class' && pendingDelete.id) {
      const updatedClasses = classes.filter(cls => cls.id !== pendingDelete.id);
      setClasses(updatedClasses);
      storage.saveClasses(updatedClasses);
    } else if (pendingDelete.type === 'student' && pendingDelete.id) {
      const all = storage.getStudents();
      storage.saveStudents(all.filter(s => s.id !== pendingDelete.id));
      refreshStudentList();
    } else if (pendingDelete.type === 'clear_all' && selectedClassForStudents) {
      const all = storage.getStudents();
      storage.saveStudents(all.filter(s => s.classId !== selectedClassForStudents.id));
      setClassStudents([]);
    }
    setPendingDelete(null);
    setSecurityCode('');
  };

  const resetForm = () => {
    setFormData({ name: '', schoolName: '', teacherName: '', startTime: '08:00', endTime: '12:00', days: WEEK_DAYS.slice(0, 5) });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (c: Class) => {
    setFormData({
      name: c.name,
      schoolName: c.schoolName || '',
      teacherName: c.teacherName || '',
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
            <School className="text-blue-600" /> إدارة الأقسام
          </h3>
          <p className="text-sm text-slate-500 font-bold mt-1">تخصيص الأفواج التربوية والأساتذة</p>
        </div>
        {!isFormOpen && (
          <button onClick={() => setIsFormOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all">
            <Plus size={20} /> إضافة قسم جديد
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 animate-in fade-in zoom-in-95 duration-200 space-y-8">
           <div className="flex items-center gap-2 text-blue-700">
            <Edit3 size={20} />
            <h4 className="font-black">{editingId ? 'تعديل بيانات القسم' : 'إنشاء قسم دراسي جديد'}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">اسم المؤسسة</label>
              <div className="relative">
                <Building2 className="absolute right-3 top-3.5 text-slate-400" size={18} />
                <input type="text" className="w-full border-slate-300 bg-slate-50 rounded-2xl pr-10 pl-4 py-3 font-black text-black outline-none focus:ring-2 focus:ring-blue-600" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} placeholder="مثال: مدرسة النجاح" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">اسم الأستاذ المسؤول</label>
              <div className="relative">
                <User className="absolute right-3 top-3.5 text-slate-400" size={18} />
                <input type="text" className="w-full border-slate-300 bg-slate-50 rounded-2xl pr-10 pl-4 py-3 font-black text-black outline-none focus:ring-2 focus:ring-blue-600" value={formData.teacherName} onChange={e => setFormData({...formData, teacherName: e.target.value})} placeholder="مثال: محمد أحمد" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">اسم القسم</label>
              <input type="text" className="w-full border-slate-300 bg-slate-50 rounded-2xl px-4 py-3 font-black text-black outline-none focus:ring-2 focus:ring-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="مثال: سنة خامسة 1" required />
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
            <div className="mb-6 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Building2 size={12} />
                <span className="text-[10px] font-bold uppercase truncate">{c.schoolName}</span>
              </div>
              <h4 className="text-xl font-black text-slate-900">{c.name}</h4>
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs pt-1">
                <User size={14} />
                <span>الأستاذ: {c.teacherName || 'غير محدد'}</span>
              </div>
            </div>
            <button onClick={() => setSelectedClassForStudents(c)} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-md hover:bg-blue-700 transition-all">
              <Users size={18} /> إدارة القائمة
            </button>
          </div>
        ))}
      </div>

      {/* Security Modals remain the same */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl border-t-8 border-red-600 animate-in zoom-in-95">
            <div className="flex justify-center"><div className="p-4 bg-red-50 rounded-full text-red-600"><AlertOctagon size={48} /></div></div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">تأكيد الإجراء</h3>
              <p className="text-slate-500 font-bold mt-2 leading-relaxed">هل أنت متأكد من حذف <span className="text-red-600">"{pendingDelete.name}"</span>؟</p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700">أدخل رمز الأمان (6723):</label>
              <input type="text" maxLength={4} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 text-center font-black text-3xl tracking-[0.5em] focus:border-red-600 outline-none" value={securityCode} onChange={e => setSecurityCode(e.target.value)} autoFocus />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <button onClick={handleConfirmAction} disabled={securityCode !== '6723'} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black disabled:opacity-30">تأكيد التنفيذ</button>
              <button onClick={() => setPendingDelete(null)} className="w-full text-slate-400 py-2 font-black">تراجع</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
