import { configureTransit } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createJSONStorage } from 'zustand/middleware';

export function configureRuntime() {
  configureTransit({
    baseUrl: Platform.OS === 'web' ? '/api/mav/proxy' : 'https://mavplusz.hu',
  });
  if (Platform.OS !== 'web')
    useUIStore.persist.setOptions({ storage: createJSONStorage(() => AsyncStorage) });
}
