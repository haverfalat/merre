import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { useViewport } from '~/hooks/useViewport';

export function MapTileError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
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
      <View style={{ width: '100%', maxWidth: 270, gap: 8 }}>
        <Button label={t('map_tiles_error')} onPress={onRetry} />
        <Button
          label={t('map_style_fallback')}
          onPress={() => useUIStore.getState().setMapStyle('auto')}
        />
      </View>
    </View>
  );
}
