import { useTranslation } from '@/hooks/useTranslation';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { lazy, Suspense } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { Empty } from '~/components/ui/Empty';
import { useTheme } from '~/lib/theme';
import { useSheetGesture } from './useSheetGesture';

const StopPanel = lazy(() =>
  import('~/features/stops/StopPanel').then((m) => ({ default: m.StopPanel })),
);
const TripPanel = lazy(() =>
  import('~/features/trips/TripPanel').then((m) => ({ default: m.TripPanel })),
);
const RoutePanel = lazy(() =>
  import('~/features/routes/RoutePanel').then((m) => ({ default: m.RoutePanel })),
);
export function DetailsSheet({
  desktop,
  height,
  top,
  bottom,
  left,
  right,
}: {
  desktop: boolean;
  height: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
}) {
  const trip = useMapStore((s) => s.selectedVehicle);
  const stop = useMapStore((s) => s.selectedStopId);
  const route = useMapStore((s) => s.selectedRouteId);
  const focused = useUIStore((s) => s.searchFocused);
  const c = useTheme();
  const { t } = useTranslation();
  const { fraction, animatedHeight, pan, toggle, expanded, adjust } = useSheetGesture(height);
  if (!trip && !stop && !route) return null;
  return (
    <Animated.View
      testID="details-sheet"
      pointerEvents={focused ? 'none' : 'auto'}
      style={[
        {
          position: 'absolute',
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.border,
          overflow: 'hidden',
          opacity: focused ? 0 : 1,
          boxShadow: '0 8px 32px #00000050',
        },
        desktop
          ? { top: top + 66, left: left + 16, bottom: 16, width: 388, borderRadius: 16 }
          : {
              left: 0,
              right: 0,
              bottom: 0,
              height: animatedHeight,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: bottom,
              paddingLeft: left,
              paddingRight: right,
            },
      ]}
    >
      {!desktop && (
        <View
          {...pan.panHandlers}
          style={{
            height: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Pressable
            accessibilityRole="adjustable"
            accessibilityLabel={t('resize_panel')}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
            accessibilityActions={[
              { name: 'increment', label: t('expand_panel') },
              { name: 'decrement', label: t('collapse_panel') },
            ]}
            onAccessibilityAction={({ nativeEvent }) => adjust(nativeEvent.actionName)}
            onPress={toggle}
            style={{ flex: 1, minHeight: 24, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ width: 38, height: 4, borderRadius: 4, backgroundColor: c.strong }} />
          </Pressable>
          <Button
            size="icon"
            icon={expanded ? ChevronDown : ChevronUp}
            label={t(expanded ? 'collapse_panel' : 'expand_panel')}
            onPress={toggle}
            style={{
              minHeight: 24,
              position: 'absolute',
              right: 8,
            }}
          />
        </View>
      )}
      <Suspense fallback={<Empty loading />}>
        {trip ? (
          <TripPanel key={`trip-${trip.tripId}-${trip.serviceDay}`} />
        ) : stop ? (
          <StopPanel key={`stop-${stop}`} />
        ) : (
          <RoutePanel key={`route-${route}`} />
        )}
      </Suspense>
    </Animated.View>
  );
}
