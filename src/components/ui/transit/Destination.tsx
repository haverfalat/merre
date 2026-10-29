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
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 0 }}
    >
      <DirectionArrow direction={direction} />
      <TransitLabel
        html={headsign}
        placeName
        numberOfLines={lines}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: size === 'compact' ? 14 : 16,
          lineHeight: size === 'compact' ? 20 : 22,
          fontFamily: fonts.medium,
        }}
      />
      {boarding === 'front-door' && direction === 'outgoing' && (
        <FrontDoorBadge size={size === 'compact' ? 16 : 18} />
      )}
    </View>
  );
}
