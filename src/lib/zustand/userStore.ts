import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserPreferences {
  theme: string;
  defaultTimeframe: string;
  maxRiskPerTrade: number;
}

interface UserState {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      preferences: {
        theme: "dark",
        defaultTimeframe: "swing",
        maxRiskPerTrade: 1,
      },

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    {
      name: "user-preferences",
    }
  )
);

