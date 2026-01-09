
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  History, 
  FileBarChart, 
  Settings,
  GraduationCap,
  Menu,
  X,
  School,
  Users
} from 'lucide-react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'attendance', label: 'تسجيل الحضور', icon: ClipboardCheck },
    { id: 'students', label: 'إدارة التلاميذ', icon: Users },
    { id: 'classes', label: 'الأقسام والقوائم', icon: School },
    { id: 'history', label: 'سجل الغيابات', icon: History },
    { id: 'reports', label: 'التقارير والإحصائيات', icon: FileBarChart },
    { id: 'settings', label: 'الإعدادات والنسخ', icon: Settings },
  ];

  const handleNavClick = (view: View) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-cairo overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between no-print z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <GraduationCap size={20} />
          </div>
          <h1 className="text-lg font-bold text-slate-800">دفتر الغياب الذكي</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 
        w-64 bg-white border-l border-slate-200 flex flex-col no-print
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="hidden md:flex p-6 border-b border-slate-100 items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-100">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">دفتر الغياب</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-16 md:mt-0">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <item.icon size={20} />
              <span className="font-bold whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2 border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
              إد
            </div>
            <div className="text-sm">
              <p className="font-bold text-slate-800">إدارة المؤسسة</p>
              <p className="text-slate-500 text-[10px]">نظام العمل المحلي النشط</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 no-print shrink-0">
          <h2 className="text-lg font-black text-slate-700">
            {menuItems.find(i => i.id === currentView)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-bold bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
              {new Date().toLocaleDateString('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
