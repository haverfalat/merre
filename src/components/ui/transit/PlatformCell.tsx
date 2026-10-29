import { View, useWindowDimensions } from 'react-native';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts, useTheme } from '~/lib/theme';
import { platformColumnWidth } from '~/lib/transit-table';
import { Text } from '../Text';

export function PlatformCell({ value, color }: { value?: string | null; color?: string }) {
  const { fontScale } = useWindowDimensions();
  const { t } = useTranslation();
  const c = useTheme();
  const platform = value?.trim() || '—';
  return (
    <View testID="platform-cell" style={{ width: platformColumnWidth(fontScale), flexShrink: 0,
      alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
      <Text accessibilityLabel={`${t('platform')} ${platform}`}
        style={{ fontFamily: fonts.mono, fontSize: 14, lineHeight: 20, textAlign: 'center', color: color ?? c.secondary }}>
        {platform}
      </Text>
    </View>
  );
}
