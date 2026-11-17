import { contrastTextColor, getRouteColor } from '@/lib/transit/colors';
import { metroLineNumber } from '~/lib/metro-label';
import { ModeIcon } from './ModeIcon';
import { View } from 'react-native';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { fonts, radii } from '~/lib/theme';

export function RouteBadge({
  label,
  mode,
  color,
  size,
  showMetroIcon = true,
}: {
  label?: string | null;
  mode?: string | null;
  color?: string | null;
  size?: 'compact' | 'regular' | 'tiny';
  showMetroIcon?: boolean;
}) {
  const metroNumber = metroLineNumber(label, mode);
  const backgroundColor = getRouteColor(mode, color).primary;
  return (
    <View
      accessible={metroNumber != null}
      accessibilityLabel={metroNumber ? `M${metroNumber}` : undefined}
      style={[
        {
          flexDirection: 'row',
          gap: 4,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radii.badge,
          // A destination must never squeeze a short route identifier into an ellipsis.
          flexShrink: 0,
          maxWidth: 180,
        },
        { backgroundColor },
        {
          paddingHorizontal: size === 'tiny' ? 4 : 7,
          paddingVertical: size === 'tiny' ? 1 : 3,
          minWidth: size === 'tiny' ? 22 : size === 'compact' ? 28 : 32,
        },
      ]}
    >
      {metroNumber && showMetroIcon && <ModeIcon mode="SUBWAY"
        size={size === 'tiny' ? 13 : size === 'compact' ? 15 : 16}
        color={contrastTextColor(backgroundColor)} />}
      <TransitLabel
        html={metroNumber || label || '?'}
        numberOfLines={1}
        style={{
          fontFamily: fonts.semibold,
          fontVariant: ['tabular-nums'],
          fontSize: size === 'tiny' ? 12 : size === 'compact' ? 13 : 14,
          lineHeight: size === 'tiny' ? 16 : 18,
          includeFontPadding: false,
          textAlign: 'center',
          color: contrastTextColor(backgroundColor),
        }}
      />
    </View>
  );
}
