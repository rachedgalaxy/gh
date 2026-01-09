
import { Student, Class, AttendanceRecord, FullBackup } from '../types';

const KEYS = {
  STUDENTS: 'ams_v3_students',
  CLASSES: 'ams_v3_classes',
  ATTENDANCE: 'ams_v3_attendance',
  INITIALIZED: 'ams_v3_initialized',
};

const DEFAULT_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

export const storage = {
  getStudents: (): Student[] => {
    try {
      const data = localStorage.getItem(KEYS.STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  
  saveStudents: (students: Student[]) => {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },
  
  getClasses: (): Class[] => {
    try {
      const data = localStorage.getItem(KEYS.CLASSES);
      if (data) return JSON.parse(data);
      
      const isInitialized = localStorage.getItem(KEYS.INITIALIZED);
      if (isInitialized === 'true') return [];
    } catch (e) {}
    
    return [
      { id: 'c1', name: 'القسم الأول', schoolName: 'مدرسة النجاح الابتدائية', startTime: '08:00', endTime: '12:00', days: DEFAULT_DAYS },
      { id: 'c2', name: 'القسم الثاني', schoolName: 'مدرسة النجاح الابتدائية', startTime: '13:00', endTime: '17:00', days: DEFAULT_DAYS }
    ];
  },
  
  saveClasses: (classes: Class[]) => {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
    localStorage.setItem(KEYS.INITIALIZED, 'true');
  },
  
  getAttendance: (): AttendanceRecord[] => {
    try {
      const data = localStorage.getItem(KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  
  saveAttendance: (records: AttendanceRecord[]) => {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
  },
  
  getFullBackup: (): FullBackup => {
    return {
      students: storage.getStudents(),
      classes: storage.getClasses(),
      attendance: storage.getAttendance(),
      exportDate: new Date().toISOString(),
      version: "3.2"
    };
  },
  
  restoreFromBackup: (backup: any): boolean => {
    if (!backup || typeof backup !== 'object') return false;
    
    try {
      if (backup.students) localStorage.setItem(KEYS.STUDENTS, JSON.stringify(backup.students));
      if (backup.classes) localStorage.setItem(KEYS.CLASSES, JSON.stringify(backup.classes));
      if (backup.attendance) localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(backup.attendance));
      localStorage.setItem(KEYS.INITIALIZED, 'true');
      return true;
    } catch (e) {
      console.error("Backup Restore Error:", e);
      return false;
    }
  }
};
