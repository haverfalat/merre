import { useTranslation } from '@/hooks/useTranslation';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { ArrowLeft } from 'lucide-react-native';
import { lazy, Suspense, useMemo } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import Reanimated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  ReduceMotion,
} from 'react-native-reanimated';
import { DensityContext } from '~/components/ui/Density';
import { Presence } from '~/components/ui/Presence';
import { Button } from '~/components/ui/Button';
import { SkeletonPanel } from '~/components/ui/Skeleton';
import type { LocationState } from '~/hooks/useLocation';
import { mobileSheetHeight } from '~/lib/mobile-sheet';
import { usePlannerStore } from '~/store/usePlannerStore';
import { motion, useTheme } from '~/lib/theme';
import { useSheetGesture } from './useSheetGesture';

const PlannerPanel = lazy(() =>
  import('~/features/planner/PlannerPanel').then((m) => ({ default: m.PlannerPanel })),
);
const StopPanel = lazy(() =>
  import('~/features/stops/StopPanel').then((m) => ({ default: m.StopPanel })),
);
const TripPanel = lazy(() =>
  import('~/features/trips/TripPanel').then((m) => ({ default: m.TripPanel })),
);
const RoutePanel = lazy(() =>
  import('~/features/routes/RoutePanel').then((m) => ({ default: m.RoutePanel })),
);
const contentEnter = FadeIn.duration(motion.quick).reduceMotion(ReduceMotion.System);
const desktopEnter = FadeIn.duration(motion.standard).reduceMotion(ReduceMotion.System);
const desktopExit = FadeOut.duration(motion.quick).reduceMotion(ReduceMotion.System);

export function DetailsSheet({
  location,
  desktop,
  height,
  bottom,
  left,
  right,
  keepVisibleDuringSearch = false,
}: {
  location: LocationState;
  desktop: boolean;
  height: number;
  bottom: number;
  left: number;
  right: number;
  keepVisibleDuringSearch?: boolean;
}) {
  const returnToJourney = usePlannerStore((state) => state.returnToJourney);
  const planning = usePlannerStore((state) => state.open);
  const journeyDetail = usePlannerStore((state) => state.detail);
  const journeyId = usePlannerStore((state) => state.selectedId);
  const trip = useMapStore((s) => s.selectedVehicle);
  const stop = useMapStore((s) => s.selectedStopId);
  const route = useMapStore((s) => s.selectedRouteId);
  const focused = useUIStore((s) => s.searchFocused);
  const c = useTheme();
  const { t } = useTranslation();
  const visible = !!(planning || trip || stop || route);
  const hiddenBySearch = focused && !keepVisibleDuringSearch;
  const { fraction, animatedHeight, pan, toggle, adjust } = useSheetGesture(height, visible);
  const travel = mobileSheetHeight(height, fraction, height < 500) + bottom + 24;
  const entering = useMemo(
    () => desktop ? desktopEnter : FadeInDown
      .duration(240)
      .easing(Easing.bezier(0.22, 1, 0.36, 1))
      .withInitialValues({ opacity: 1, translateY: travel })
      .reduceMotion(ReduceMotion.System),
    [desktop, travel],
  );
  const exiting = useMemo(
    () => desktop ? desktopExit : FadeOutDown
      .duration(180)
      .easing(Easing.bezier(0.55, 0, 1, 0.45))
      .withTargetValues({ opacity: 1, translateY: travel })
      .reduceMotion(ReduceMotion.System),
    [desktop, travel],
  );
  const contentKey = planning
    ? journeyDetail ? `journey-${journeyId}` : 'planner-results'
    : trip ? `trip-${trip.tripId}-${trip.serviceDay}`
      : stop ? `stop-${stop}` : `route-${route}`;
  return (
    <DensityContext.Provider value={desktop ? 'regular' : 'compact'}>
      <Presence
        visible={visible && !(desktop && hiddenBySearch)}
        preset={desktop ? 'fade' : 'sheet'}
        testID="details-sheet"
        collapsable={false}
        entering={entering}
        exiting={exiting}
        pointerEvents={hiddenBySearch ? 'none' : 'auto'}
        style={[
          desktop
            ? { flex: 1, minHeight: 0 }
            : {
                position: 'absolute',
                left: 0,
                right: 0,
                bottom,
              },
        ]}
      >
        <Animated.View
          style={[
            {
              backgroundColor: c.card,
              borderWidth: desktop ? 0 : 1,
              borderColor: c.border,
              overflow: 'hidden',
              opacity: hiddenBySearch ? 0 : 1,
              boxShadow: desktop ? 'none' : '0 6px 24px #00000028',
            },
            desktop ? { flex: 1, borderTopWidth: 0 } : {
              height: animatedHeight,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
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
                style={{
                  flex: 1,
                  minHeight: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ width: 38, height: 4, borderRadius: 4, backgroundColor: c.strong }} />
              </Pressable>
            </View>
          )}
          {!planning && returnToJourney && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderColor: c.border,
              }}
            >
              <Button
                icon={ArrowLeft}
                label={t('planner_back_to_journey')}
                variant="ghost"
                onPress={usePlannerStore.getState().resumeJourney}
                style={{ alignSelf: 'flex-start', minHeight: 24 }}
              />
            </View>
          )}
          <Reanimated.View key={contentKey} entering={Platform.OS === 'web' ? undefined : contentEnter} style={{ flex: 1 }}>
            <Suspense fallback={<SkeletonPanel variant={planning ? 'planner' : trip || route ? 'timeline' : 'departure'} />}>
              {planning ? (
                <PlannerPanel location={location} />
              ) : trip ? (
                <TripPanel />
              ) : stop ? (
                <StopPanel />
              ) : (
                <RoutePanel />
              )}
            </Suspense>
          </Reanimated.View>
        </Animated.View>
      </Presence>
    </DensityContext.Provider>
  );
}
