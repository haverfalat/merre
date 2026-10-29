import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useViewport } from '~/hooks/useViewport';
import { elevation, radii, useTheme } from '~/lib/theme';

export function MapTileError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const c = useTheme();
  const { insets } = useViewport();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + 100,
        left: insets.left + 12,
        right: insets.right + 70,
        alignItems: 'flex-end',
      }}
    >
      <View style={{ width: '100%', maxWidth: 300, padding: 12, gap: 8,
        backgroundColor: c.card, borderRadius: radii.card, boxShadow: elevation.map }}>
        <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, lineHeight: 21, color: c.warning }}>
          {t('map_tiles_error')}
        </Text>
        <Button label={t('retry')} onPress={onRetry} />
        <Button
          variant="ghost"
          label={t('map_style_fallback')}
          onPress={() => useUIStore.getState().setMapStyle('auto')}
        />
      </View>
    </View>
  );
}
