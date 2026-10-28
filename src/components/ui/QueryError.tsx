import { useTranslation } from '@/hooks/useTranslation';
import { View } from 'react-native';
import { useTheme } from '~/lib/theme';
import { Button } from './Button';
import { Text } from './Text';

export function QueryError({ retry, stale }: { retry: () => void; stale?: boolean }) {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surface,
      }}
    >
      <Text style={{ flex: 1, color: c.warning, fontSize: 14 }}>
        {t(stale ? 'stale_data' : 'data_error')}
      </Text>
      <Button label={t('retry')} onPress={retry} />
    </View>
  );
}
