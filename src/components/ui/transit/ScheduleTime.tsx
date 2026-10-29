import { useTranslation } from '~/hooks/useTranslation';
import { formatTimeOfDay } from '@/lib/transit/time/format';
import { View } from 'react-native';
import { Text } from '~/components/ui/Text';
import { formatDelay } from '~/lib/transit/delay';
import { fonts, type, useTheme } from '~/lib/theme';
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
  const formatted = formatDelay(delay ?? (
    realtime != null && scheduled != null ? realtime - scheduled : null
  ));
  const color = canceled ? c.danger
    : !changed || formatted.status === 'on_time' ? c.secondary : c[formatted.tone];
  return (
    <View
      accessible
      accessibilityLabel={`${real || sched || '-'}, ${t(canceled ? 'canceled' : real ? 'estimated' : 'scheduled')}`}
      style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 0 }}
    >
      {changed && (
        <Text style={{ fontFamily: fonts.regular, fontVariant: ['tabular-nums'],
          fontSize: 12, lineHeight: 16,
          includeFontPadding: false,
          color: c.muted, textDecorationLine: 'line-through',
        }}>{sched}</Text>
      )}
      <Text style={{ ...(compact ? type.timeCompact : type.time),
        ...(!compact ? { fontSize: 18, lineHeight: 24 } : {}),
        includeFontPadding: false, textAlignVertical: 'bottom',
        color, textDecorationLine: canceled ? 'line-through' : 'none' }}>
        {real || sched || '-'}
      </Text>
    </View>
  );
}
