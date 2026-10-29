import { useOnline } from '~/hooks/useOnline';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { type, useTheme } from '~/lib/theme';
import { useViewport } from '~/hooks/useViewport';

export function OfflineGate() {
  const online = useOnline();
  const { t } = useTranslation();
  const c = useTheme();
  const { insets } = useViewport();
  if (online) return null;
  return <ScrollView style={{ position: 'absolute', inset: 0, zIndex: 1000, backgroundColor: c.background }}
    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center',
      paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24,
      paddingLeft: insets.left + 24, paddingRight: insets.right + 24 }}>
    <View style={{ width: '100%', maxWidth: 440, gap: 16 }}>
      <Text accessibilityRole="header" style={type.heading}>{t('tickets_offline_title')}</Text>
      <Text style={{ fontSize: 15, lineHeight: 22, color: c.secondary }}>{t('tickets_offline_explanation')}</Text>
      <Button variant="primary" label={t('tickets_offline_open')} onPress={() => router.push('/tickets')} />
    </View>
  </ScrollView>;
}
