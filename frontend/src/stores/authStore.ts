import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Admin } from '../types';

interface AuthState {
  studentToken: string | null;
  student: Student | null;
  adminToken: string | null;
  admin: Admin | null;
  _hasHydrated: boolean;
  
  setStudentAuth: (token: string, student: Student) => void;
  setAdminAuth: (token: string, admin: Admin) => void;
  clearStudentAuth: () => void;
  clearAdminAuth: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      studentToken: null,
      student: null,
      adminToken: null,
      admin: null,
      _hasHydrated: false,
      
      setStudentAuth: (token, student) => {
        console.log('Setting student auth:', { token: token?.substring(0, 20) + '...', student });
        set({ studentToken: token, student });
      },
      setAdminAuth: (token, admin) => {
        console.log('Setting admin auth:', { token: token?.substring(0, 20) + '...', admin });
        set({ adminToken: token, admin });
      },
      clearStudentAuth: () => set({ studentToken: null, student: null }),
      clearAdminAuth: () => set({ adminToken: null, admin: null }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
