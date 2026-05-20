import { create } from 'zustand';
import type { AccessLevel, AppView, PracticeType, DenialRecord, HealthScanReport } from './types';
import { sampleDenials } from './sample-data';
import { generateHealthScan } from './health-scan';

interface AppState {
  currentView: AppView;
  accessLevel: AccessLevel | null;
  practiceType: PracticeType | null;
  practiceName: string;
  contractSigned: boolean;
  selectedDenialId: string | null;
  denials: DenialRecord[];
  healthScan: HealthScanReport | null;
  isUploading: boolean;
  sidebarOpen: boolean;

  // Actions
  setView: (view: AppView) => void;
  setAccessLevel: (level: AccessLevel) => void;
  setPracticeType: (type: PracticeType) => void;
  setPracticeName: (name: string) => void;
  setContractSigned: (signed: boolean) => void;
  selectDenial: (id: string | null) => void;
  setDenials: (denials: DenialRecord[]) => void;
  setHealthScan: (report: HealthScanReport) => void;
  setUploading: (uploading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  simulateUpload: () => void;
  updateDenialStatus: (id: string, status: DenialRecord['status']) => void;

  // Helpers
  canAccess: (requiredLevel: AccessLevel) => boolean;
  getSelectedDenial: () => DenialRecord | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'landing',
  accessLevel: null,
  practiceType: null,
  practiceName: '',
  contractSigned: false,
  selectedDenialId: null,
  denials: [],
  healthScan: null,
  isUploading: false,
  sidebarOpen: false,

  setView: (view) => set({ currentView: view }),
  setAccessLevel: (level) => set({ accessLevel: level }),
  setPracticeType: (type) => set({ practiceType: type }),
  setPracticeName: (name) => set({ practiceName: name }),
  setContractSigned: (signed) => set({ contractSigned: signed }),
  selectDenial: (id) => set({ selectedDenialId: id }),
  setDenials: (denials) => set({ denials }),
  setHealthScan: (report) => set({ healthScan: report }),
  setUploading: (uploading) => set({ isUploading: uploading }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  simulateUpload: () => {
    set({ isUploading: true });
    const state = get();
    const denials = sampleDenials(state.practiceType || 'medical');
    const healthScan = generateHealthScan(
      denials,
      state.practiceName || 'Sample Medical Practice',
      state.practiceType || 'medical'
    );
    setTimeout(() => {
      set({
        denials,
        healthScan,
        isUploading: false,
        currentView: 'dashboard',
      });
    }, 2000);
  },

  updateDenialStatus: (id, status) => {
    set((state) => ({
      denials: state.denials.map((d) =>
        d.id === id ? { ...d, status } : d
      ),
    }));
  },

  canAccess: (requiredLevel) => {
    const { accessLevel } = get();
    if (!accessLevel) return false;
    return accessLevel >= requiredLevel;
  },

  getSelectedDenial: () => {
    const { denials, selectedDenialId } = get();
    return denials.find((d) => d.id === selectedDenialId);
  },
}));
