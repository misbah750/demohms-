import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, Clinic, UserRole } from "@/lib/types";

interface ClinicStore {
  // Auth state
  profile: Profile | null;
  clinic: Clinic | null;
  role: UserRole | null;

  // UI state
  sidebarCollapsed: boolean;
  activeClinicId: string | null;

  // Actions
  setProfile: (profile: Profile | null) => void;
  setClinic: (clinic: Clinic | null) => void;
  setRole: (role: UserRole | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveClinicId: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  profile: null,
  clinic: null,
  role: null,
  sidebarCollapsed: false,
  activeClinicId: null,
};

export const useClinicStore = create<ClinicStore>()(
  persist(
    (set) => ({
      ...initialState,

      setProfile: (profile) => set({ profile, role: profile?.role ?? null }),
      setClinic: (clinic) => set({ clinic, activeClinicId: clinic?.id ?? null }),
      setRole: (role) => set({ role }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setActiveClinicId: (id) => set({ activeClinicId: id }),
      reset: () => set(initialState),
    }),
    {
      name: "hms-clinic-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeClinicId: state.activeClinicId,
      }),
    }
  )
);
