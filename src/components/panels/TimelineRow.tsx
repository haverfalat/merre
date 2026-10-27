import { getMapRouteColor } from '@/lib/transit/colors';
import { useUIStore } from '@/store/useUIStore';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { fonts, useTheme } from '~/lib/theme';
import { TimelineTrack, VehicleTimelineMarker } from './TimelineTrack';
import type { TimelineAppearance, TimelinePosition, TimelineVehicle } from './timeline-types';

export function TimelineRow({
  title,
  subtitle,
  trailing,
  color,
  appearance = { tone: 'default', emphasis: 'normal' },
  position,
  disabled,
  onPress,
  children,
  mode,
  vehicle,
  dashed,
  previousColor,
  previousDashed,
}: {
  title?: string | null;
  subtitle?: string;
  trailing?: ReactNode;
  color: string;
  appearance?: TimelineAppearance;
  position: TimelinePosition;
  disabled?: boolean;
  children?: ReactNode;
  mode?: string | null;
  vehicle?: TimelineVehicle;
  dashed?: boolean;
  previousColor?: string;
  previousDashed?: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  const theme = useUIStore((s) => s.theme);
  const trackColor = getMapRouteColor(mode ?? undefined, color, theme);
  const canceled = appearance.tone === 'canceled';
  const last = position === 'last' || position === 'only';
  return (
    <ListRow
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 0,
        minHeight: 44,
        backgroundColor: canceled ? `${c.danger}12` : pressed ? c.raised : 'transparent',
        paddingHorizontal: 10,
        paddingVertical: 0,
        overflow: 'visible',
        zIndex: vehicle ? 2 : 0,
      })}
    >
      <TimelineTrack
        position={position}
        dashed={dashed}
        previousColor={previousColor}
        previousDashed={previousDashed}
        color={trackColor}
        tone={appearance.tone}
        vehicle={vehicle}
        mode={mode}
      />
      {children || (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: 2,
            paddingHorizontal: 7,
            paddingVertical: 8,
          }}
        >
          <TransitLabel
            html={title || '?'}
            placeName
            style={{
              fontSize: 12,
              color: canceled ? c.danger : appearance.tone === 'passed' ? c.muted : c.text,
              textDecorationLine: canceled ? 'line-through' : 'none',
              fontFamily:
                vehicle?.kind === 'at-stop' || appearance.emphasis === 'strong'
                  ? fonts.semibold
                  : fonts.regular,
            }}
          />
          {subtitle && <Text style={{ fontSize: 10, color: c.muted }}>{subtitle}</Text>}
        </View>
      )}
      {trailing && (
        <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 5, paddingLeft: 4 }}>
          {trailing}
        </View>
      )}
      {vehicle?.kind === 'between' && !last && (
        <View
          accessibilityRole="image"
          accessibilityLabel={vehicle.label}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 11,
            top: `${Math.max(0.1, Math.min(0.9, vehicle.fraction)) * 100}%`,
            transform: [{ translateY: 11 }],
            zIndex: 3,
          }}
        >
          <VehicleTimelineMarker mode={mode} color={trackColor} />
        </View>
      )}
    </ListRow>
  );
}
