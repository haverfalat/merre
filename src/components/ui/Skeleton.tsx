import { useTranslation } from '@/hooks/useTranslation';
import { useEffect } from 'react';
import {
  Platform,
  RefreshControl,
  View,
  type RefreshControlProps,
  type ViewStyle,
} from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '~/lib/theme';

export function Skeleton({
  width,
  height = 12,
  style,
}: {
  width?: ViewStyle['width'];
  height?: number;
  style?: ViewStyle;
}) {
  const c = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.65);
  useEffect(() => {
    opacity.set(reduced ? 0.65 : withRepeat(withTiming(0.35, {
      duration: 850, easing: Easing.bezier(0.45, 0, 0.55, 1),
    }), -1, true));
    return () => cancelAnimation(opacity);
  }, [opacity, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: 3, backgroundColor: c.strong }, style, animated]}
    />
  );
}
export type SkeletonVariant = 'departure' | 'search' | 'timeline' | 'timetable';

export function SkeletonRows({ count = 5, variant = 'departure' }: { count?: number; variant?: SkeletonVariant }) {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <View
      testID="loading-rows"
      accessibilityLabel={t('loading')}
      accessibilityState={{ busy: true }}
      aria-busy
      style={{ paddingHorizontal: 10 }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{ minHeight: variant === 'search' ? 64 : variant === 'timetable' ? 40 : 52,
            paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10,
            borderBottomWidth: 1, borderColor: c.border }}
        >
          <Skeleton width={variant === 'timeline' ? 10 : 28} height={variant === 'timeline' ? 10 : 20}
            style={{ borderRadius: variant === 'timeline' ? 5 : 3 }} />
          {variant === 'timetable' ? (
            <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {Array.from({ length: index % 2 ? 4 : 6 }, (_, minute) => <Skeleton key={minute} width={28} height={24} />)}
            </View>
          ) : (
            <>
              <View style={{ flex: 1, gap: 7 }}>
                <Skeleton width={index % 2 ? '62%' : '82%'} />
                <Skeleton width="40%" height={9} />
              </View>
              {variant !== 'search' && <View style={{ gap: 6, alignItems: 'flex-end' }}>
                <Skeleton width={44} height={16} />
                <Skeleton width={30} height={9} />
              </View>}
            </>
          )}
        </View>
      ))}
    </View>
  );
}

export function SkeletonCards({ kind, count = 2 }: { kind: 'ticket' | 'journey'; count?: number }) {
  const c = useTheme();
  const { t } = useTranslation();
  return (
    <View testID={`loading-${kind}-cards`} accessibilityLabel={t('loading')} accessibilityState={{ busy: true }} aria-busy style={{ gap: 12 }}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={{ padding: 16, gap: 12, backgroundColor: c.surface, borderRadius: 6 }}>
          {kind === 'ticket' ? (
            <>
              <Skeleton width="45%" height={10} />
              <Skeleton width="72%" height={22} />
              <Skeleton width={72} height={14} />
              <View style={{ gap: 6, paddingVertical: 4 }}>
                {[0, 1].map((row) => <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton width="24%" height={10} /><Skeleton width="50%" height={12} />
                </View>)}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton width="42%" height={36} /><Skeleton width="42%" height={36} />
              </View>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Skeleton width={62} height={22} /><Skeleton width={62} height={22} />
                <View style={{ flex: 1 }} /><Skeleton width={48} height={14} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton width={42} height={20} /><Skeleton width={50} height={20} /><Skeleton width={36} height={20} />
              </View>
              <Skeleton width="100%" height={4} />
              <Skeleton width="62%" height={11} />
            </>
          )}
        </View>
      ))}
    </View>
  );
}

export function SkeletonPanel({ variant = 'departure' }: { variant?: SkeletonVariant | 'planner' }) {
  return (
    <View style={{ flex: 1, paddingTop: 12, gap: 12 }}>
      <View style={{ paddingHorizontal: 12, gap: 8 }}>
        <Skeleton width="65%" height={20} /><Skeleton width="40%" height={12} />
      </View>
      {variant === 'planner' ? <View style={{ padding: 12 }}><SkeletonCards kind="journey" /></View>
        : <SkeletonRows variant={variant} />}
    </View>
  );
}

export function SkeletonRefreshControl(props: RefreshControlProps) {
  // React Native Web clones this element with the scroll view as its children.
  // Forward every prop so the wrapper preserves that content and its layout.
  return (
    <RefreshControl
      {...props}
      tintColor="transparent"
      colors={['transparent']}
      progressBackgroundColor="transparent"
      style={[props.style, Platform.OS !== 'web' && { opacity: 0 }]}
    />
  );
}
export function RefreshSkeleton({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <View pointerEvents="none" aria-busy={active} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 1 }}>
      <Skeleton width="100%" height={3} />
    </View>
  );
}
