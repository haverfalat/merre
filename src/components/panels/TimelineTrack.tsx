import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { ModeCircle } from '~/components/ui/transit/ModeCircle';
import { useTheme } from '~/lib/theme';
import type { TimelinePosition, TimelineVehicle } from './timeline-types';

export function VehicleTimelineMarker({ mode, color }: { mode?: string | null; color: string }) {
  return <ModeCircle mode={mode} color={color} size={22} iconSize={13} outline="#ffffff" />;
}

function TrackLine({
  color,
  dashed,
  style,
}: {
  color: string;
  dashed?: boolean;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: 2,
          left: 11,
          zIndex: 0,
          backgroundColor: dashed ? 'transparent' : color,
        },
        style,
      ]}
    >
      {dashed && (
        <Svg width={2} height="100%">
          <Line
            x1={1}
            y1={0}
            x2={1}
            y2="100%"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="3 4"
          />
        </Svg>
      )}
    </View>
  );
}

export function TimelineTrack({
  position,
  color,
  tone,
  vehicle,
  mode,
  dashed = false,
  marker = true,
  previousColor,
  previousDashed,
  markerOffset = 22,
}: {
  position: TimelinePosition;
  color: string;
  tone: 'default' | 'passed' | 'canceled';
  vehicle?: TimelineVehicle;
  mode?: string | null;
  dashed?: boolean;
  marker?: boolean;
  previousColor?: string;
  previousDashed?: boolean;
  markerOffset?: number;
}) {
  const c = useTheme();
  const active = vehicle?.kind === 'at-stop';
  const first = position === 'first' || position === 'only';
  const last = position === 'last' || position === 'only';
  const canceled = tone === 'canceled';
  return (
    <View style={{ width: 24, alignItems: 'center' }}>
      {!marker ? (
        <TrackLine color={color} dashed={dashed} style={{ top: 0, bottom: 0 }} />
      ) : (
        <>
          {!first && (
            <TrackLine
              color={previousColor || color}
              dashed={previousDashed ?? dashed}
              style={{ top: -1, height: markerOffset - (active ? 11 : 6) + 2 }}
            />
          )}
          {!last && (
            <TrackLine color={color} dashed={dashed} style={{ top: markerOffset + (active ? 11 : 6) - 1, bottom: -1 }} />
          )}
          <View style={{ position: 'absolute', top: markerOffset - (active ? 11 : 6), zIndex: 1 }}>
            {active ? (
              <VehicleTimelineMarker mode={mode} color={color} />
            ) : (
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 7,
                  borderWidth: 2,
                  borderColor: canceled ? c.danger : color,
                  backgroundColor: canceled ? c.danger : first || last ? color : c.card,
                }}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
}
