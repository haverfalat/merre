import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isMapStyle, type MapStyle } from '@/lib/basemaps';
import { browserPreferenceStorage } from '@/lib/preference-storage';
import { DEFAULT_SHEET_FRACTION } from '@/lib/mobile-sheet';

interface UIState {
  isSettingsOpen: boolean;
  searchFocused: boolean;
  setSearchFocused: (focused: boolean) => void;
  mobileSheetFraction: number;
  setMobileSheetFraction: (fraction: number) => void;
  theme: 'dark' | 'light';
  language: 'en' | 'hu';
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;

  setIsSettingsOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setLanguage: (lang: 'en' | 'hu') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSettingsOpen: false,
      searchFocused: false,
      setSearchFocused: (searchFocused) => set({ searchFocused }),
      mobileSheetFraction: DEFAULT_SHEET_FRACTION,
      setMobileSheetFraction: (mobileSheetFraction) => set({ mobileSheetFraction }),
      theme: 'dark',
      language: 'en',
      mapStyle: 'auto',
      setMapStyle: (mapStyle) => set({ mapStyle }),

      setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'tkterkep-preferences',
      storage: createJSONStorage(() => browserPreferenceStorage),
      skipHydration: true,
      partialize: ({ theme, language, mapStyle }) => ({ theme, language, mapStyle }),
      merge: (saved, current) => {
        const preferences = saved as Partial<UIState> | null;
        return {
          ...current,
          theme:
            preferences?.theme === 'light' || preferences?.theme === 'dark'
              ? preferences.theme
              : current.theme,
          language:
            preferences?.language === 'hu' || preferences?.language === 'en'
              ? preferences.language
              : current.language,
          mapStyle: isMapStyle(preferences?.mapStyle) ? preferences.mapStyle : current.mapStyle,
        };
      },
    },
  ),
);
