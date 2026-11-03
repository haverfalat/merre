import { StopChoiceRow } from './StopChoiceRow';
import { useStopDetail } from '@/hooks/useStopDetail';
import { useStopRoutes } from '@/hooks/useStopRoutes';
import { useTranslation } from '@/hooks/useTranslation';
import { DEFAULT_SHEET_FRACTION } from '@/lib/mobile-sheet';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { Presence } from '~/components/ui/Presence';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { ListRow } from '~/components/ui/ListRow';
import { Skeleton } from '~/components/ui/Skeleton';
import { Text } from '~/components/ui/Text';
import { RouteDestination } from '~/components/ui/transit/RouteDestination';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { controls, elevation, fonts, radii, useTheme } from '~/lib/theme';
import { dismissStopPreview, useStopPreview, type StopBoardTab } from '~/store/useStopPreview';
import { stopPreviewContent } from './model/stop-preview';

const enterPopup = FadeInDown.duration(180).withInitialValues({ translateY: 8 }).reduceMotion(ReduceMotion.System);
const exitPopup = FadeOutDown.duration(130).withTargetValues({ translateY: 6 }).reduceMotion(ReduceMotion.System);

interface StopMapCardProps {
  width: number;
  height: number;
  topInset: number;
  bottomInset: number;
  leftInset?: number;
}

export function StopMapCard(props: StopMapCardProps) {
  const stop = useStopPreview((s) => s.stop);
  const point = useStopPreview((s) => s.point);
  return <Presence visible={!!stop && !!point} preset="popup" entering={enterPopup} exiting={exitPopup}
    pointerEvents="box-none" style={{ position: 'absolute', inset: 0 }}>
    {stop && point ? <StopPopup key={stop.id} {...props} stop={stop} point={point} /> : null}
  </Presence>;
}

function StopPopup({ width, height, topInset, bottomInset, leftInset = 0, stop, point }: StopMapCardProps & {
  stop: NonNullable<ReturnType<typeof useStopPreview.getState>['stop']>;
  point: { x: number; y: number };
}) {
  const query = useStopDetail(stop?.id ?? null);
  const alternatives = useStopPreview(s => s.alternatives);
  const routeQuery = useStopRoutes(stop?.id ?? null);
  const [choosing, setChoosing] = useState(false);
  const [cardHeight, setCardHeight] = useState(190);
  const c = useTheme();
  const { t } = useTranslation();
  const { routes, rail } = stopPreviewContent(query.data, routeQuery.data, t('unknown_origin'));
  const cardWidth = Math.min(336, width - leftInset - 24);
  const left = Math.max(leftInset + 12, Math.min(width - cardWidth - 12, point.x - cardWidth / 2));
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
    <View
      style={{ position: 'absolute', left, top, width: cardWidth }}
    >
    <Card
      testID="stop-map-card"
      onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}
      style={{
        borderRadius: radii.card,
        boxShadow: elevation.panel,
      }}
    >
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: Math.max(controls.target, height - bottomInset - topInset - 82) }}
        contentContainerStyle={{ padding: 12, gap: 6 }}
      >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <ListRow
          layout="content"
          accessibilityRole="button"
          accessibilityLabel={stop.name || t('details')}
          onPress={() => open('departures')}
          style={{ flex: 1, paddingVertical: 8, minHeight: controls.target }}
        >
          <TransitLabel
            html={query.data?.name || stop.name}
            placeName
            numberOfLines={2}
            style={{ fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 }}
          />
        </ListRow>
        <Button
          size="icon"
          icon={X}
          label={t('close')}
          onPress={dismissStopPreview}
          style={{
            paddingHorizontal: 0,
            borderWidth: 0,
            backgroundColor: 'transparent',
          }}
        />
      </View>
      {alternatives.length > 1 && <Button variant="ghost"
        label={t('choose_nearby_stop', { count: alternatives.length })}
        accessibilityState={{ expanded: choosing }}
        onPress={() => setChoosing(value => !value)} />}
      {choosing ? <View>
        {alternatives.map(candidate => <StopChoiceRow key={candidate.id}
          stop={candidate} selected={candidate.id === stop.id}
          onSelect={() => {
            setChoosing(false);
            useStopPreview.setState({ stop: candidate });
          }} />)}
      </View> : <>
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
            nestedScrollEnabled
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
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
            {t(query.isError ? 'no_stop_detail' : rail ? 'no_departures_range' : 'no_stop_events_range')}
          </Text>
        )}
      </ListRow>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Button
          variant="primary"
          label={t(rail ? 'departures' : 'stop_events')}
          onPress={() => open('departures')}
          style={{ flex: 1 }}
        />
        {rail && (
          <Button
            label={t('arrivals')}
            onPress={() => open('arrivals')}
            style={{ flex: 1 }}
          />
        )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Button
          variant="ghost"
          label={t('timetable')}
          onPress={() => open('timetable')}
          style={{ flex: 1 }}
        />
      </View>
      </>}
      </ScrollView>
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
    </View>
  );
}
