import { View } from 'react-native';
import { ModeCircle } from '~/components/ui/transit/ModeCircle';
import { useTheme } from '~/lib/theme';
import type { TimelinePosition, TimelineVehicle } from './timeline-types';

export function VehicleTimelineMarker({ mode, color }: { mode?: string | null; color: string }) {
  return <ModeCircle mode={mode} color={color} size={22} iconSize={13} outline="#ffffff" />;
}

export function TimelineTrack({
  position,
  color,
  tone,
  vehicle,
  mode,
}: {
  position: TimelinePosition;
  color: string;
  tone: 'default' | 'passed' | 'canceled';
  vehicle?: TimelineVehicle;
  mode?: string | null;
}) {
  const c = useTheme();
  const active = vehicle?.kind === 'at-stop';
  const first = position === 'first' || position === 'only';
  const last = position === 'last' || position === 'only';
  const canceled = tone === 'canceled';
  return (
    <View style={{ width: 24, alignItems: 'center' }}>
      {!first && (
        <View
          style={{
            position: 'absolute',
            width: 2,
            top: 0,
            height: active ? 11 : 16,
            zIndex: 0,
            backgroundColor: color,
          }}
        />
      )}
      {!last && (
        <View
          testID="timeline-track"
          style={{
            position: 'absolute',
            width: 2,
            top: active ? 33 : 28,
            bottom: 0,
            zIndex: 0,
            backgroundColor: color,
          }}
        />
      )}
      <View style={{ position: 'absolute', top: active ? 11 : 16, zIndex: 1 }}>
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
    </View>
  );
}
