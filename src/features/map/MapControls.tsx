import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { Crosshair, Minus, Plus, RefreshCw, Settings } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import type { LocationState } from '~/hooks/useLocation';
import { useTheme } from '~/lib/theme';
import { WalletEntry } from '~/features/tickets/components/WalletEntry';
import { useMapControls } from './useMapControls';
import type { MapData } from './useMapData';

export function MapControls({
  data,
  location,
  bottom,
  height,
  desktop,
  safeInsets,
}: {
  data: MapData;
  location: LocationState;
  bottom: number;
  height: number;
  desktop: boolean;
  safeInsets: { top: number; left: number; right: number };
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const { focused, currentZoom, online, status, zoom, refresh } = useMapControls(data);
  const available = desktop ? height : height - bottom;
  if (focused) return null;
  return (
    <>
      {available >= 170 && (
        <View
          style={{
            position: 'absolute',
            right: safeInsets.right + 12,
            ...(desktop ? { top: safeInsets.top + 12 } : { bottom: bottom + 26 }),
            gap: 5,
          }}
        >
          {(desktop || available >= 340) && (
            <>
              <Button
                size="icon"
                icon={Settings}
                label={t('settings')}
                onPress={() => useUIStore.getState().setIsSettingsOpen(true)}
                style={{ backgroundColor: c.card }}
              />
              <Button
                size="icon"
                icon={RefreshCw}
                loading={data.vehicles.isFetching}
                disabled={data.vehicles.isFetching}
                label={t('refresh')}
                onPress={refresh}
                style={{ backgroundColor: c.card }}
              />
            </>
          )}

          <WalletEntry compact />
          <Button
            size="icon"
            icon={Crosshair}
            loading={location.locating}
            label={t(location.locating ? 'locating' : 'locate_me')}
            disabled={location.locating}
            onPress={() => {
              void location.locate();
            }}
            selected={!!location.position}
            style={{ backgroundColor: c.card }}
          />
          <Button
            size="icon"
            icon={Plus}
            label={t('zoom_in')}
            disabled={currentZoom >= 19}
            onPress={() => zoom(0.5)}
            style={{ backgroundColor: c.card }}
          />
          <Button
            size="icon"
            icon={Minus}
            label={t('zoom_out')}
            disabled={currentZoom <= 5}
            onPress={() => zoom(-0.5)}
            style={{ backgroundColor: c.card }}
          />
        </View>
      )}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: safeInsets.left + 12,
          right: safeInsets.right + 70,
          bottom: bottom + 10,
          alignItems: 'flex-start',
          gap: 7,
        }}
      >
        {location.error && (
          <View
            style={{
              backgroundColor: c.card,
              padding: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: c.warning,
              gap: 5,
            }}
          >
            <Text accessibilityLiveRegion="polite" style={{ fontSize: 12, color: c.warning }}>
              {t(location.error)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Button
                label={t('retry')}
                onPress={() => {
                  void location.locate();
                }}
              />
              <Button label={t('close')} onPress={location.dismissError} />
            </View>
          </View>
        )}
        {status && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 5,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              backgroundColor: c.card,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: c.border,
              maxWidth: 360,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 5,
                backgroundColor: !online || data.vehicles.isError ? c.warning : c.success,
              }}
            />
            <Text
              accessibilityLiveRegion="polite"
              style={{ fontSize: 10, color: c.secondary, flexShrink: 1 }}
            >
              {status}
            </Text>
            {data.vehicles.isError && (
              <Button
                label={t('retry')}
                onPress={() => {
                  void data.vehicles.refetch();
                }}
              />
            )}
          </View>
        )}
      </View>
    </>
  );
}
