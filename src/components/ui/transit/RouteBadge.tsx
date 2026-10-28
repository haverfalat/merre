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
          borderRadius: 4,
          maxWidth: 180,
        },
        { backgroundColor },
        {
          paddingHorizontal: size === 'tiny' ? 4 : 7,
          paddingVertical: size === 'tiny' ? 1 : 2,
        },
      ]}
    >
      <TransitLabel
        html={label || '?'}
        numberOfLines={1}
        style={{
          fontFamily: fonts.semibold,
          fontVariant: ['tabular-nums'],
          fontSize: size === 'tiny' ? 11 : size === 'compact' ? 12 : 14,
          includeFontPadding: false,
          textAlign: 'center',
          color: contrastTextColor(backgroundColor),
        }}
      />
    </View>
  );
}
