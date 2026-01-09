
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Student, Class } from '../types';
import { Trash2, Edit2, UserPlus, Search, FileSpreadsheet, User, X, AlertOctagon, Save, UserCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for Modals
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  
  // State for Security
  const [securityCode, setSecurityCode] = useState('');
  const SECURITY_PIN = '6723';

  const [newStudent, setNewStudent] = useState({ id: '', name: '', classId: '' });

  useEffect(() => {
    setStudents(storage.getStudents());
    const loadedClasses = storage.getClasses();
    setClasses(loadedClasses);
    if (loadedClasses.length > 0) {
      setNewStudent(prev => ({ ...prev, classId: loadedClasses[0].id }));
    }
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.id || !newStudent.name || !newStudent.classId) return;
    
    if (students.find(s => s.id === newStudent.id)) {
      alert('هذا الرقم موجود مسبقاً لتلميذ آخر');
      return;
    }

    const updated = [...students, { ...newStudent }];
    setStudents(updated);
    storage.saveStudents(updated);
    setNewStudent({ ...newStudent, id: '', name: '' });
    setIsAdding(false);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const updated = students.map(s => s.id === editingStudent.id ? editingStudent : s);
    setStudents(updated);
    storage.saveStudents(updated);
    setEditingStudent(null);
  };

  const handleConfirmDelete = () => {
    if (securityCode !== SECURITY_PIN || !pendingDelete) return;

    const updated = students.filter(s => s.id !== pendingDelete.id);
    setStudents(updated);
    storage.saveStudents(updated);
    
    // Also cleanup attendance for this student
    const allAttendance = storage.getAttendance();
    storage.saveAttendance(allAttendance.filter(a => a.studentId !== pendingDelete.id));

    setPendingDelete(null);
    setSecurityCode('');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
            classId: newStudent.classId, 
          };
        }).filter(s => s.id && s.id !== "undefined" && s.name && s.name !== "undefined");

        if (importedStudents.length === 0) {
          alert('لم يتم العثور على بيانات صالحة في الملف.');
          return;
        }

        const updated = [...students, ...importedStudents];
        const uniqueUpdated = Array.from(new Map(updated.map(item => [item.id, item])).values());
        
        setStudents(uniqueUpdated);
        storage.saveStudents(uniqueUpdated);
        alert(`تم استيراد ${importedStudents.length} تلاميذ بنجاح.`);
      } catch (err) {
        alert('خطأ في قراءة الملف.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filtered = students.filter(s => 
    s.name.includes(searchTerm) || s.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      {/* Search & Actions Bar */}
      <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-stretch gap-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-50 active:scale-95"
          >
            <UserPlus size={22} /> تلميذ جديد
          </button>
          <label className="bg-white border-2 border-slate-300 text-slate-800 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-green-400 transition-all group">
            <FileSpreadsheet size={22} className="text-green-600 group-hover:scale-110 transition-transform" /> استيراد قائمة مسار
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} />
          </label>
        </div>

        <div className="relative flex-1 max-w-xl">
          <Search className="absolute right-4 top-4.5 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="ابحث برقم التعريف أو الاسم..." 
            className="w-full pr-12 pl-4 py-4 bg-slate-50 border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white font-black text-slate-950 placeholder:text-slate-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Add Student Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-blue-100 animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-700">
              <UserPlus size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">إضافة تلميذ جديد للقائمة</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-600 pr-1">رقم التعريف</label>
              <input 
                type="text" 
                className="w-full border-slate-300 bg-slate-50 rounded-2xl py-3.5 px-4 font-mono font-black text-slate-950 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                value={newStudent.id}
                onChange={e => setNewStudent({...newStudent, id: e.target.value})}
                placeholder="12345678"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-600 pr-1">الاسم الكامل</label>
              <input 
                type="text" 
                className="w-full border-slate-300 bg-slate-50 rounded-2xl py-3.5 px-4 font-black text-slate-950 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                value={newStudent.name}
                onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                placeholder="اللقب والاسم"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-600 pr-1">القسم المستهدف</label>
              <select 
                className="w-full border-slate-300 bg-slate-50 rounded-2xl py-3.5 px-4 font-black text-slate-950 focus:ring-2 focus:ring-blue-600 focus:bg-white appearance-none transition-all outline-none"
                value={newStudent.classId}
                onChange={e => setNewStudent({...newStudent, classId: e.target.value})}
                required
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button type="button" onClick={() => setIsAdding(false)} className="px-10 py-4 rounded-2xl font-black text-slate-600 hover:bg-slate-100 transition-all">إلغاء</button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
               حفظ التلميذ
            </button>
          </div>
        </form>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-6 text-slate-600 font-black text-xs uppercase tracking-wider">رقم التعريف</th>
                <th className="px-8 py-6 text-slate-600 font-black text-xs uppercase tracking-wider">الاسم الكامل</th>
                <th className="px-8 py-6 text-slate-600 font-black text-xs uppercase tracking-wider">القسم</th>
                <th className="px-8 py-6 text-slate-600 font-black text-xs uppercase tracking-wider text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                       <User size={64} className="opacity-20" />
                       <p className="font-black text-xl">لا توجد سجلات حالياً</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(student => (
                  <tr key={student.id} className="group hover:bg-blue-50/40 transition-colors">
                    <td className="px-8 py-5 text-slate-600 font-mono font-black text-sm">{student.id}</td>
                    <td className="px-8 py-5 text-slate-950 font-black text-base">{student.name}</td>
                    <td className="px-8 py-5">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-black border border-blue-200">
                        {classes.find(c => c.id === student.classId)?.name || 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setEditingStudent(student)}
                          className="p-3 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-200"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => setPendingDelete(student)}
                          className="p-3 text-slate-500 hover:text-red-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-200"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Edit2 size={24} /></div>
                <h3 className="text-xl font-black text-slate-900">تعديل بيانات التلميذ</h3>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 mr-1">رقم التعريف (لا يمكن تغييره)</label>
                <input type="text" disabled className="w-full bg-slate-100 border-slate-200 rounded-2xl py-3 px-4 font-mono font-black text-slate-400 cursor-not-allowed" value={editingStudent.id} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 mr-1">الاسم الكامل</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-slate-300 rounded-2xl py-3 px-4 font-black text-slate-950 focus:ring-2 focus:ring-blue-600 outline-none"
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 mr-1">القسم</label>
                <select 
                  className="w-full bg-slate-50 border-slate-300 rounded-2xl py-3 px-4 font-black text-slate-950 focus:ring-2 focus:ring-blue-600 outline-none"
                  value={editingStudent.classId}
                  onChange={e => setEditingStudent({...editingStudent, classId: e.target.value})}
                  required
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                  <UserCheck size={20} /> حفظ التعديلات
                </button>
                <button type="button" onClick={() => setEditingStudent(null)} className="w-full py-2 text-slate-400 font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Delete Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl border-t-8 border-red-600 animate-in zoom-in-95">
            <div className="flex justify-center">
              <div className="p-4 bg-red-50 rounded-full text-red-600"><AlertOctagon size={48} /></div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">حذف تلميذ نهائياً</h3>
              <p className="text-slate-500 font-bold mt-2 leading-relaxed">
                هل أنت متأكد من حذف التلميذ <span className="text-red-600">"{pendingDelete.name}"</span>؟ 
                <br /> سيتم حذف كافة سجلات غيابه أيضاً.
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
                onClick={handleConfirmDelete} 
                disabled={securityCode !== SECURITY_PIN} 
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-100 disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={20} /> تأكيد الحذف النهائي
              </button>
              <button onClick={() => { setPendingDelete(null); setSecurityCode(''); }} className="w-full text-slate-400 py-2 font-black">تراجع</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentManagement;
