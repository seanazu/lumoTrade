import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  newsDrawerOpen: boolean;
  selectedNewsIndex: number | null;
  toggleSidebar: () => void;
  openNewsDrawer: (index: number) => void;
  closeNewsDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  newsDrawerOpen: false,
  selectedNewsIndex: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openNewsDrawer: (index) =>
    set({ newsDrawerOpen: true, selectedNewsIndex: index }),

  closeNewsDrawer: () =>
    set({ newsDrawerOpen: false, selectedNewsIndex: null }),
}));

