import { contrastTextColor, getRouteColor } from '@/lib/transit/colors';
import { View } from 'react-native';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { fonts } from '~/lib/theme';

export function RouteBadge({
  label,
  mode,
  color,
  size,
}: {
  label?: string | null;
  mode?: string | null;
  color?: string | null;
  size?: 'compact' | 'regular' | 'tiny';
}) {
  const backgroundColor = getRouteColor(mode, color).primary;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: 4,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size === 'tiny' ? 2 : 5,
          maxWidth: 140,
        },
        { backgroundColor },
        {
          paddingHorizontal: size === 'tiny' ? 2 : size === 'compact' ? 5 : 6,
          paddingVertical: size === 'tiny' ? 0 : size === 'compact' ? 2 : 3,
        },
      ]}
    >
      <TransitLabel
        html={label || '?'}
        numberOfLines={1}
        style={{
          fontFamily: fonts.mono,
          fontWeight: '700',
          fontSize: size === 'tiny' ? 8 : size === 'compact' ? 10 : 12,
          lineHeight: size === 'tiny' ? 10 : size === 'compact' ? 14 : 16,
          includeFontPadding: false,
          textAlign: 'center',
          color: contrastTextColor(backgroundColor),
        }}
      />
    </View>
  );
}
