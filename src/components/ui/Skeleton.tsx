import { useTranslation } from '@/hooks/useTranslation';
import {
  Platform,
  RefreshControl,
  View,
  type RefreshControlProps,
  type ViewStyle,
} from 'react-native';
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
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: 4, backgroundColor: c.strong, opacity: 0.6 }, style]}
    />
  );
}
export function SkeletonRows({ count = 5 }: { count?: number }) {
  const { t } = useTranslation();
  return (
    <View
      testID="loading-rows"
      accessibilityLabel={t('connecting')}
      accessibilityState={{ busy: true }}
      aria-busy
      style={{ padding: 10, gap: 16 }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{ minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 9 }}
        >
          <Skeleton width={30} height={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width={index % 2 ? '62%' : '82%'} />
            <Skeleton width="40%" height={8} />
          </View>
          <Skeleton width={36} height={16} />
        </View>
      ))}
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
  return (
    <View aria-busy={active} style={{ height: 3, opacity: active ? 1 : 0 }}>
      <Skeleton width="100%" height={3} />
    </View>
  );
}
