import { useTranslation } from '~/hooks/useTranslation';

import { formatTimeOfDay } from '@/lib/transit/time/format';

import { View } from 'react-native';

import { Text } from '~/components/ui/Text';

import { formatDelay } from '~/lib/transit/delay';
import { fonts, useTheme } from '~/lib/theme';
export function ScheduleTime({
  scheduled,
  realtime,
  delay,
  canceled,
  compact = false,
}: {
  scheduled?: number | null;
  realtime?: number | null;
  delay?: number | null;
  canceled?: boolean;
  compact?: boolean;
}) {
  const c = useTheme();
  const { t } = useTranslation();
  const sched = formatTimeOfDay(scheduled);
  const real = formatTimeOfDay(realtime);
  const changed = !!real && !!sched && real !== sched;
  const status = formatDelay(delay).status;
  const color = canceled ? c.danger : !changed ? c.secondary
    : status === 'major_delay' ? c.danger : status === 'early' ? c.early
      : status === 'minor_delay' ? c.warning : c.secondary;
  return (
    <View
      accessible
      accessibilityLabel={`${real || sched || '-'}, ${t(canceled ? 'canceled' : real ? 'estimated' : 'scheduled')}`}
      style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 0 }}
    >
      {changed && (
        <Text style={{ fontFamily: fonts.mono, fontVariant: ['tabular-nums'],
          fontSize: compact ? 10 : 12, lineHeight: compact ? 12 : 14,
          includeFontPadding: false,
          color: c.muted, textDecorationLine: 'line-through',
        }}>{sched}</Text>
      )}
      <Text style={{ fontFamily: fonts.mono, fontVariant: ['tabular-nums'],
        fontSize: compact ? 13 : 18, lineHeight: compact ? 18 : 22,
        includeFontPadding: false, textAlignVertical: 'bottom',
        color, textDecorationLine: canceled ? 'line-through' : 'none' }}>
        {real || sched || '-'}
      </Text>
    </View>
  );
}
