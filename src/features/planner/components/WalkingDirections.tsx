import { View } from 'react-native';
import {
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
  RotateCw,
  MoveVertical,
} from 'lucide-react-native';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import type { JourneyLeg } from '~/lib/transit/types/plan';
import { useTheme } from '~/lib/theme';

const turns = {
  LEFT: { icon: CornerUpLeft, key: 'planner_turn_left' },
  HARD_LEFT: { icon: CornerUpLeft, key: 'planner_turn_left' },
  RIGHT: { icon: CornerUpRight, key: 'planner_turn_right' },
  HARD_RIGHT: { icon: CornerUpRight, key: 'planner_turn_right' },
  SLIGHTLY_LEFT: { icon: ArrowUpLeft, key: 'planner_slight_left' },
  SLIGHTLY_RIGHT: { icon: ArrowUpRight, key: 'planner_slight_right' },
  UTURN_LEFT: { icon: RotateCcw, key: 'planner_turn_back' },
  UTURN_RIGHT: { icon: RotateCw, key: 'planner_turn_back' },
  CIRCLE_CLOCKWISE: { icon: RotateCw, key: 'planner_roundabout' },
  CIRCLE_COUNTERCLOCKWISE: { icon: RotateCcw, key: 'planner_roundabout' },
  ELEVATOR: { icon: MoveVertical, key: 'planner_elevator' },
} as const;
const compass = {
  NORTH: 'planner_north',
  NORTHEAST: 'planner_northeast',
  EAST: 'planner_east',
  SOUTHEAST: 'planner_southeast',
  SOUTH: 'planner_south',
  SOUTHWEST: 'planner_southwest',
  WEST: 'planner_west',
  NORTHWEST: 'planner_northwest',
} as const;
export function WalkingDirections({ steps }: { steps: JourneyLeg['steps'] }) {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <View style={{ gap: 12, paddingVertical: 7 }}>
      {steps.map((step, index) => {
        const turn = turns[step.direction as keyof typeof turns];
        const Icon = turn?.icon || ArrowUp;
        return (
          <View key={index} style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start' }}>
            <Icon size={16} color={c.muted} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 13, color: c.secondary }}>
                {step.direction === 'DEPART' && compass[step.heading as keyof typeof compass]
                  ? t('planner_head', {
                      direction: t(compass[step.heading as keyof typeof compass]),
                    })
                  : t(turn?.key || 'planner_continue_walking')}
                {step.street ? ` · ${step.street}` : ''}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: c.muted }}>{Math.round(step.distance)} m</Text>
          </View>
        );
      })}
    </View>
  );
}
