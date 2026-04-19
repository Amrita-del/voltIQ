import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useReportStore = create(
  persist(
    (set) => ({
      bills: [],
      reports: [],
      addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
      setReports: (reports) => set({ reports }),
      addReport: (report) => set((state) => ({ reports: [...state.reports, report] })),
      activeReport: null,
      setActiveReport: (report) => set({ activeReport: report }),
    }),
    {
      name: 'voltiq-report-storage',
    }
  )
);
