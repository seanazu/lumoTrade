import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserPreferences {
  theme: string;
  defaultTimeframe: string;
  maxRiskPerTrade: number;
}

interface UserState {
  email: string | null;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
  setEmail: (email: string | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      email: null,
      onboardingCompleted: false,
      preferences: {
        theme: "dark",
        defaultTimeframe: "swing",
        maxRiskPerTrade: 1,
      },

      setEmail: (email) => set({ email }),
      
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    {
      name: "lumo-user-storage",
    }
  )
);

