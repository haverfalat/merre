import { useTranslation } from '@/hooks/useTranslation';
import { TRANSIT_TIME_ZONE } from '@/lib/transit';
import { View } from 'react-native';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { fonts, useTheme } from '~/lib/theme';

import type { VehiclePosition } from '@/lib/transit/types/vehicle';

export function VehicleDetails({ position }: { position: VehiclePosition }) {
  const { t, language } = useTranslation();
  const c = useTheme();
  const detailLabelWidth = language === 'hu' ? 64 : 48;
  return (
    <Card
      surface="surface"
      testID="vehicle-details"
      style={{
        margin: 10,
        paddingHorizontal: 7,
        paddingVertical: 7,
        borderRadius: 9,
        gap: 6,
      }}
    >
      {position.vehicleModel && (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Text
            numberOfLines={1}
            style={{
              width: detailLabelWidth,
              flexShrink: 0,
              fontSize: 11,
              lineHeight: 16,
              color: c.muted,
            }}
          >
            {t('model')}
          </Text>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, lineHeight: 16 }}>
            {position.vehicleModel}
          </Text>
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'nowrap',
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
              numberOfLines={1}
              style={{
                width: detailLabelWidth,
                flexShrink: 0,
                fontSize: 11,
                lineHeight: 16,
                color: c.muted,
              }}
            >
              {t('plate')}
            </Text>
            <Text
              selectable
              numberOfLines={1}
              style={{ flexShrink: 1, fontSize: 12, fontFamily: fonts.mono }}
            >
              {position.licensePlate}
            </Text>
          </View>
        )}
        <Text
          numberOfLines={1}
          style={{
            width: 76,
            flexShrink: 0,
            fontSize: 11,
            color: c.secondary,
            marginLeft: 'auto',
            textAlign: 'right',
            fontVariant: ['tabular-nums'],
          }}
        >
          {position.speed != null && Number.isFinite(position.speed)
            ? Math.round(position.speed)
            : '—'}{' '}
          km/h
        </Text>
      </View>
      {position.uicCode && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Text style={{ width: detailLabelWidth, fontSize: 11, color: c.muted }}>UIC</Text>
          <Text selectable style={{ fontSize: 12, fontFamily: fonts.mono }}>
            {position.uicCode}
          </Text>
        </View>
      )}
      {position.lastUpdated != null && (
        <Text style={{ fontSize: 11, color: c.muted, fontVariant: ['tabular-nums'] }}>
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
    </Card>
  );
}
