import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: Theme;
  compactMode: boolean;
  soundEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  
  setTheme: (theme: Theme) => void;
  setCompactMode: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  setEmailEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      compactMode: false,
      soundEnabled: true,
      pushEnabled: true,
      emailEnabled: true,
      
      setTheme: (theme) => set({ theme }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      setEmailEnabled: (emailEnabled) => set({ emailEnabled }),
    }),
    {
      name: 'VELORA-settings',
    }
  )
);
