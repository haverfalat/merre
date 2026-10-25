import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useNativeMapPreferences = create<{
  appleSatellite3D: boolean;
  setAppleSatellite3D: (enabled: boolean) => void;
}>()(
  persist(
    (set) => ({
      appleSatellite3D: false,
      setAppleSatellite3D: (appleSatellite3D) => set({ appleSatellite3D }),
    }),
    {
      name: 'tkterkep-native-map',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ appleSatellite3D }) => ({ appleSatellite3D }),
      merge: (saved, current) => ({
        ...current,
        appleSatellite3D:
          (saved as { appleSatellite3D?: unknown } | null)?.appleSatellite3D === true,
      }),
    },
  ),
);
