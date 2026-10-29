import { useTranslation } from '@/hooks/useTranslation';
import { TRANSIT_TIME_ZONE } from '@/lib/transit';
import { View } from 'react-native';
import { Text } from '~/components/ui/Text';
import { fonts, useTheme } from '~/lib/theme';

import type { VehiclePosition } from '@/lib/transit/types/vehicle';

export function VehicleDetails({ position }: { position: VehiclePosition }) {
  const { t, language } = useTranslation();
  const c = useTheme();
  const detailLabelWidth = language === 'hu' ? 64 : 48;
  return (
    <View
      testID="vehicle-details"
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 6,
      }}
    >
      {position.vehicleModel && (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Text
            style={{
              width: detailLabelWidth,
              flexShrink: 0,
              fontSize: 14, lineHeight: 20,

              color: c.secondary,
            }}
          >
            {t('model')}
          </Text>
          <Text style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
            {position.vehicleModel}
          </Text>
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 16,
          rowGap: 5,
          alignItems: 'center',
        }}
      >
        {position.licensePlate && (
          <View
            style={{ flex: 1, minWidth: 0, flexDirection: 'row', gap: 10, alignItems: 'center' }}
          >
            <Text
              style={{
                width: detailLabelWidth,
                flexShrink: 0,
                fontSize: 14, lineHeight: 20,

                color: c.secondary,
              }}
            >
              {t('plate')}
            </Text>
            <Text selectable style={{ flexShrink: 1, fontSize: 14, fontFamily: fonts.mono }}>
              {position.licensePlate}
            </Text>
          </View>
        )}
        <Text
          style={{
            minWidth: 76,
            flexShrink: 0,
            fontSize: 14, lineHeight: 20,
            color: c.secondary,
            marginLeft: 'auto',
            textAlign: 'right',
            fontVariant: ['tabular-nums'],
          }}
        >
          {position.speed != null && Number.isFinite(position.speed)
            ? Math.round(position.speed * 3.6)
            : '-'}{' '}
          km/h
        </Text>
      </View>
      {position.uicCode && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Text style={{ width: detailLabelWidth, fontSize: 14, lineHeight: 20, color: c.secondary }}>UIC</Text>
          <Text selectable style={{ fontSize: 14, fontFamily: fonts.mono }}>
            {position.uicCode}
          </Text>
        </View>
      )}
      {position.isEstimated === false && (
        <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
          {language === 'hu'
            ? 'Két GPS-frissítés között a térképi mozgás rövid ideig becsült lehet.'
            : 'Map movement may be briefly estimated between GPS updates.'}
        </Text>
      )}
      {position.lastUpdated != null && (
        <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary, fontVariant: ['tabular-nums'] }}>
          {t('last_update', {
            time: new Date(position.lastUpdated * 1000).toLocaleTimeString(
              language === 'hu' ? 'hu-HU' : 'en-GB',
              {
                timeZone: TRANSIT_TIME_ZONE,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              },
            ),
          })}
          {position.isEstimated != null
            ? ` · ${position.isEstimated ? t('estimated') : 'GPS'}`
            : ''}
        </Text>
      )}
    </View>
  );
}
