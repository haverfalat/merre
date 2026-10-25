import { useStopDetail } from '@/hooks/useStopDetail';
import { useStopRoutes } from '@/hooks/useStopRoutes';
import { useTranslation } from '@/hooks/useTranslation';
import { DEFAULT_SHEET_FRACTION } from '@/lib/mobile-sheet';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { ListRow } from '~/components/ui/ListRow';
import { Skeleton } from '~/components/ui/Skeleton';
import { Text } from '~/components/ui/Text';
import { RouteDestination } from '~/components/ui/transit/RouteDestination';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { fonts, useTheme } from '~/lib/theme';
import { dismissStopPreview, useStopPreview, type StopBoardTab } from '~/store/useStopPreview';
import { stopPreviewContent } from './model/stop-preview';

export function StopMapCard({
  width,
  height,
  topInset,
  bottomInset,
}: {
  width: number;
  height: number;
  topInset: number;
  bottomInset: number;
}) {
  const stop = useStopPreview((s) => s.stop);
  const point = useStopPreview((s) => s.point);
  const query = useStopDetail(stop?.id ?? null);
  const routeQuery = useStopRoutes(stop?.id ?? null);
  const [cardHeight, setCardHeight] = useState(190);
  const c = useTheme();
  const { t } = useTranslation();
  if (!stop || !point) return null;
  const { routes, rail } = stopPreviewContent(query.data, routeQuery.data);
  const cardWidth = Math.min(280, width - 24);
  const left = Math.max(12, Math.min(width - cardWidth - 12, point.x - cardWidth / 2));
  const top = Math.max(
    topInset + 70,
    Math.min(height - bottomInset - cardHeight - 12, point.y - cardHeight - 14),
  );
  const open = (tab: StopBoardTab) => {
    useStopPreview.setState({ board: { id: stop.id, tab } });
    useMapStore.getState().setSelectedStopId(stop.id);
    useMapStore.getState().setStopRouteFilter(tab === 'timetable' ? [] : null);
    useUIStore.getState().setMobileSheetFraction(DEFAULT_SHEET_FRACTION);
    dismissStopPreview();
  };
  return (
    <Card
      testID="stop-map-card"
      onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}
      style={{
        position: 'absolute',
        left,
        top,
        width: cardWidth,
        borderRadius: 11,
        padding: 8,
        gap: 6,
        boxShadow: '0 4px 18px #00000050',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <ListRow
          layout="content"
          accessibilityRole="button"
          accessibilityLabel={stop.name || t('details')}
          onPress={() => open('departures')}
          style={{ flex: 1, paddingVertical: 3 }}
        >
          <TransitLabel
            html={query.data?.name || stop.name}
            placeName
            numberOfLines={2}
            style={{ fontFamily: fonts.semibold, fontSize: 12 }}
          />
        </ListRow>
        <Button
          size="icon"
          icon={X}
          label={t('close')}
          onPress={dismissStopPreview}
          style={{
            minHeight: 24,
            minWidth: 24,
            paddingHorizontal: 0,
            borderWidth: 0,
            backgroundColor: 'transparent',
          }}
        />
      </View>
      <ListRow
        layout="content"
        accessibilityRole="button"
        accessibilityLabel={t('stop_board')}
        onPress={() => open('departures')}
        style={{ gap: 4 }}
      >
        {query.isPending && !routes.length ? (
          <Skeleton height={28} width="85%" />
        ) : routes.length ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 96 }}
            contentContainerStyle={{ gap: 5 }}
          >
            {routes.map((route) => (
              <RouteDestination
                key={route.id}
                leading="mode"
                size="compact"
                label={route.label}
                mode={route.mode}
                color={route.color}
                destination={route.headsign}
                boarding={route.frontDoor ? 'front-door' : 'none'}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={{ fontSize: 11, color: c.muted }}>
            {t(query.isError ? 'no_stop_detail' : 'no_departures_range')}
          </Text>
        )}
      </ListRow>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Button
          label={t('departures')}
          onPress={() => open('departures')}
          style={{ flex: 1, minHeight: 27 }}
        />
        {rail && (
          <Button
            label={t('arrivals')}
            onPress={() => open('arrivals')}
            style={{ flex: 1, minHeight: 27 }}
          />
        )}
      </View>
      <Button label={t('timetable')} onPress={() => open('timetable')} style={{ minHeight: 27 }} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -7,
          left: Math.max(14, Math.min(cardWidth - 22, point.x - left - 6)),
          width: 12,
          height: 12,
          transform: [{ rotate: '45deg' }],
          backgroundColor: c.card,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderColor: c.border,
        }}
      />
    </Card>
  );
}
