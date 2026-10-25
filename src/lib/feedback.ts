import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function feedback() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
}
