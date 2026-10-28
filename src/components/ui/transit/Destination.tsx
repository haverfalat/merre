import { destinationBoarding } from '@/lib/boarding';
import { View } from 'react-native';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { fonts } from '~/lib/theme';
import { DirectionArrow, type TransitDirection } from './DirectionArrow';
import { FrontDoorBadge } from './FrontDoorBadge';

export function Destination({
  destination,
  direction = 'outgoing',
  size = 'regular',
  lines = 1,
  boarding = 'none',
}: {
  destination?: string | null;
  direction?: TransitDirection;
  size?: 'regular' | 'compact';
  lines?: number;
  boarding?: 'none' | 'front-door';
}) {
  const { headsign } = destinationBoarding(destination || '');
  if (!headsign) return null;
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 0, flexShrink: 1 }}
    >
      <DirectionArrow direction={direction} />
      <TransitLabel
        html={headsign}
        placeName
        numberOfLines={lines}
        style={{
          flexShrink: 1,
          fontSize: size === 'compact' ? 14 : 16,
          fontFamily: fonts.semibold,
        }}
      />
      {boarding === 'front-door' && direction === 'outgoing' && (
        <FrontDoorBadge size={size === 'compact' ? 16 : 18} />
      )}
    </View>
  );
}
