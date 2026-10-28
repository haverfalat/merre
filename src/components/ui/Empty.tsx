import { View } from 'react-native';
import { useTheme } from '~/lib/theme';
import { SkeletonRows } from './Skeleton';
import { Text } from './Text';

export function Empty({ message, loading }: { message?: string; loading?: boolean }) {
  const c = useTheme();
  if (loading) return <SkeletonRows />;
  return (
    <View accessibilityRole="summary" style={{ padding: 18, alignItems: 'center', gap: 8 }}>
      {message && (
        <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center' }}>{message}</Text>
      )}
    </View>
  );
}
