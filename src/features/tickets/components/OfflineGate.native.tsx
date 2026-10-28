import { useNetworkState } from 'expo-network';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { useTheme } from '~/lib/theme';

export function OfflineGate() {
  const state = useNetworkState();
  const { t } = useTranslation();
  const c = useTheme();
  if ((state.isInternetReachable ?? state.isConnected) !== false) return null;
  return <View style={{ position: 'absolute', inset: 0, zIndex: 1000, backgroundColor: c.background,
    alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 }}>
    <Text style={{ fontSize: 24, textAlign: 'center' }}>{t('tickets_offline_title')}</Text>
    <Text style={{ fontSize: 15, textAlign: 'center', color: c.secondary }}>{t('tickets_offline_explanation')}</Text>
    <Button variant="primary" label={t('tickets_offline_open')} onPress={() => router.push('/tickets')} />
  </View>;
}
