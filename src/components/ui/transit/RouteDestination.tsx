import { destinationBoarding } from '@/lib/boarding';
import { View } from 'react-native';
import { Destination } from './Destination';
import type { TransitDirection } from './DirectionArrow';
import { FrontDoorBadge } from './FrontDoorBadge';
import { ModeCircle } from './ModeCircle';
import { RouteBadge } from './RouteBadge';

export interface RouteDestinationProps {
  label?: string | null;
  mode?: string | null;
  color?: string | null;
  destination?: string | null;
  size?: 'regular' | 'compact';
  boarding?: 'none' | 'front-door';
  direction?: TransitDirection;
  leading?: 'badge' | 'mode';
  lines?: number;
}

export function RouteDestination({
  label,
  mode,
  color,
  destination,
  size = 'regular',
  boarding = 'none',
  direction = 'outgoing',
  leading = 'badge',
  lines = 1,
}: RouteDestinationProps) {
  const frontDoor =
    direction === 'outgoing' &&
    (boarding === 'front-door' || destinationBoarding(destination || '').frontDoor);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 0 }}>
      {leading === 'mode' && (
        <ModeCircle
          mode={mode}
          color={color}
          overlay={frontDoor ? <FrontDoorBadge size={10} /> : undefined}
        />
      )}
      <RouteBadge label={label} mode={mode} color={color} size={size} />
      <Destination
        destination={destination}
        direction={direction}
        size={size}
        lines={lines}
        boarding={leading === 'badge' && frontDoor ? 'front-door' : 'none'}
      />
    </View>
  );
}
