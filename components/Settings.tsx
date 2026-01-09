
import React, { useState, useRef, useEffect } from 'react';
import { storage } from '../services/storage';
import { 
  Download, 
  Upload, 
  Database, 
  FileJson, 
  AlertCircle,
  RefreshCcw,
  CheckCircle2,
  Eye,
  XCircle,
  Info,
  CalendarClock,
  ShieldCheck
} from 'lucide-react';

const Settings: React.FC = () => {
  const [status, setStatus] = useState<{message: string, type: 'info' | 'success' | 'error' | null}>({ message: '', type: null });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastImportDate(storage.getLastImportDate());
  }, []);

  const showStatus = (message: string, type: 'info' | 'success' | 'error') => {
    setStatus({ message, type });
    if (type !== 'info') {
      setTimeout(() => setStatus({ message: '', type: null }), 7000);
    }
  };

  const handleFullExport = () => {
    setIsExporting(true);
    showStatus('جاري معالجة طلب التصدير...', 'info');
    
    try {
      const backup = storage.getFullBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const fileName = `نسخة_دفتر_الغياب_${new Date().toISOString().split('T')[0]}.json`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        showStatus('تم حفظ ملف النسخة بنجاح في جهازك.', 'success');
      }, 1500);
    } catch (error) {
      setIsExporting(false);
      showStatus('فشل في عملية التصدير، تأكد من وجود مساحة.', 'error');
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setPreviewData({
          name: file.name,
          students: json.students?.length || 0,
          classes: json.classes?.length || 0,
          attendance: json.attendance?.length || 0,
          raw: json
        });
      } catch (err) {
        showStatus('خطأ: الملف الذي اخترته ليس ملف JSON صالح.', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const confirmImport = () => {
    if (!previewData) return;
    setIsImporting(true);
    showStatus('جاري استبدال البيانات القديمة...', 'info');

    setTimeout(() => {
      try {
        if (storage.restoreFromBackup(previewData.raw)) {
          showStatus('نجاح! تم استيراد كل السجلات بنجاح.', 'success');
          
          setTimeout(() => {
            window.location.href = window.location.pathname;
          }, 1500);
        } else {
          throw new Error();
        }
      } catch (err) {
        showStatus('حدث خطأ تقني أثناء الكتابة للذاكرة.', 'error');
        setIsImporting(false);
      }
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 px-4 font-cairo">
      
      {status.type && (
        <div className={`p-5 rounded-3xl flex items-center gap-4 border-2 shadow-2xl animate-in slide-in-from-top-4 duration-500 ${
          status.type === 'success' ? 'bg-green-100 border-green-500 text-green-900' :
          status.type === 'error' ? 'bg-red-100 border-red-500 text-red-900' :
          'bg-blue-100 border-blue-500 text-blue-900'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="shrink-0" size={28} /> : 
           status.type === 'error' ? <XCircle className="shrink-0" size={28} /> : 
           <RefreshCcw className="shrink-0 animate-spin" size={28} />}
          <p className="font-black text-base">{status.message}</p>
        </div>
      )}

      {previewData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 space-y-6 shadow-2xl border-4 border-blue-100 animate-in zoom-in-95">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                <Eye size={48} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900">معاينة ملف الاستيراد</h3>
              <p className="text-slate-500 font-bold text-sm">لقد اكتشفنا البيانات التالية في الملف:</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">التلاميذ</p>
                <p className="text-xl font-black text-slate-900">{previewData.students}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">الأقسام</p>
                <p className="text-xl font-black text-slate-900">{previewData.classes}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">السجلات</p>
                <p className="text-xl font-black text-slate-900">{previewData.attendance}</p>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
              <p className="text-xs font-black text-amber-900 leading-relaxed">
                ملاحظة: الضغط على "تأكيد" سيمسح بياناتك الحالية تماماً ويعوضها بهذه البيانات.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmImport}
                className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all"
              >
                تأكيد الاستيراد الآن
              </button>
              <button 
                onClick={() => { setPreviewData(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                className="w-full bg-white text-slate-400 py-4 rounded-[1.5rem] font-black hover:text-slate-900 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Management Card */}
      <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-5 mb-12 border-b border-slate-50 pb-8">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl">
            <Database size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">إدارة الذاكرة</h3>
            <p className="text-slate-500 font-bold mt-1">النسخ الاحتياطي والاستعادة اليدوية</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="group p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent hover:border-blue-200 transition-all space-y-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
              <Download size={32} />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">تصدير السجلات</h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed mt-2">قم بتحميل نسخة احتياطية من كافة التلاميذ والأقسام في ملف واحد بصيغة JSON.</p>
            </div>
            <button 
              onClick={handleFullExport}
              disabled={isExporting || isImporting}
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black shadow-xl active:translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isExporting ? <RefreshCcw size={24} className="animate-spin" /> : <FileJson size={24} />}
              تصدير البيانات
            </button>
          </div>

          <div className="group p-8 bg-green-50/30 rounded-[2.5rem] border-2 border-transparent hover:border-green-200 transition-all space-y-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-slate-100">
              <Upload size={32} />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">استعادة السجلات</h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed mt-2">اختر ملف نسخة احتياطية (JSON) من هاتفك لاستعادة البيانات المحفوظة.</p>
            </div>
            <label className={`w-full py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 cursor-pointer active:translate-y-1 transition-all ${
              isImporting ? 'bg-slate-300 text-slate-500' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}>
              {isImporting ? <RefreshCcw size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
              رفع واستيراد
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={onFileSelect} 
                disabled={isImporting || isExporting} 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Sync Status Card (Replaces GitHub) */}
      <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CalendarClock size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">حالة المزامنة والبيانات</h3>
            <p className="text-xs font-bold text-slate-400">سجل عمليات التحديث وتاريخ الاستيراد</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تاريخ آخر استيراد ناجح</p>
            <p className="text-lg font-black text-slate-800">
              {lastImportDate ? new Date(lastImportDate).toLocaleString('ar-DZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'لم يتم إجراء أي استيراد بعد'}
            </p>
          </div>
          
          <div className="flex items-start gap-4 p-6 bg-indigo-50/30 rounded-[2rem] border border-indigo-100">
            <ShieldCheck className="text-indigo-600 shrink-0" size={32} />
            <div className="space-y-2">
              <p className="text-xs font-black text-indigo-900">أمن وسلامة البيانات</p>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                يتم تخزين كافة بياناتك محلياً في متصفحك بشكل مشفر. لضمان عدم ضياع العمل عند تغيير المتصفح أو حذف ذاكرة التخزين المؤقت، يرجى إجراء "تصدير البيانات" بانتظام.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center opacity-30 py-8">
        <p className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">دفتر الغياب - نسخة الأوفلاين - V3.2</p>
      </div>
    </div>
  );
};

export default Settings;
