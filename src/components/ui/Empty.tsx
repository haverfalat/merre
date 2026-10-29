import { View } from 'react-native';
import { useTheme } from '~/lib/theme';
import { SkeletonRows } from './Skeleton';
import { Text } from './Text';

export function Empty({ message, loading }: { message?: string; loading?: boolean }) {
  const c = useTheme();
  if (loading) return <SkeletonRows />;
  return (
    <View accessibilityRole="summary" accessibilityLiveRegion="polite" style={{ paddingHorizontal: 16, paddingVertical: 24, gap: 8 }}>
      {message && (
        <Text style={{ color: c.secondary, fontSize: 14, lineHeight: 21 }}>{message}</Text>
      )}
    </View>
  );
}
