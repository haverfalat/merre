import { Play } from 'lucide-react-native';
import { useTheme } from '~/lib/theme';

export type TransitDirection = 'outgoing' | 'incoming';

export function DirectionArrow({ direction = 'outgoing' }: { direction?: TransitDirection }) {
  const c = useTheme();
  return (
    <Play
      size={10}
      fill={c.secondary}
      color={c.secondary}
      style={direction === 'incoming' ? { transform: [{ rotate: '180deg' }] } : undefined}
    />
  );
}
