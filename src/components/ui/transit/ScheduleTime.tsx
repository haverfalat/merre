import { formatDelay } from '@/lib/transit/delay';

import { formatTimeOfDay } from '@/lib/transit/time/format';

import { View } from 'react-native';

import { Text } from '~/components/ui/Text';

import { fonts, useTheme } from '~/lib/theme';
export function ScheduleTime({
  scheduled,
  realtime,
  delay,
  canceled,
}: {
  scheduled?: number | null;
  realtime?: number | null;
  delay?: number | null;
  canceled?: boolean;
}) {
  const c = useTheme();
  const sched = formatTimeOfDay(scheduled);
  const real = formatTimeOfDay(realtime);
  const changed = !!real && !!sched && real !== sched;
  const status = formatDelay(delay).status;
  const color = canceled
    ? c.danger
    : !changed
      ? c.secondary
      : status === 'major_delay'
        ? c.danger
        : status === 'early'
          ? c.accent
          : c.warning;
  return (
    <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 1 }}>
      {changed && (
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 9,
            color: c.muted,
            textDecorationLine: 'line-through',
          }}
        >
          {sched}
        </Text>
      )}
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 11,
          color,
          textDecorationLine: canceled ? 'line-through' : 'none',
        }}
      >
        {real || sched || '—'}
      </Text>
    </View>
  );
}
