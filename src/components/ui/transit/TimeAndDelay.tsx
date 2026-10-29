import { View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from '~/hooks/useTranslation';
import { delayLabel, formatDelay } from '~/lib/transit/delay';
import { fonts, useTheme } from '~/lib/theme';

/** Shared inline clock + delay presentation for every transport mode. */
export function TimeAndDelay({ label, seconds, canceled = false, size = 13, color }: {
  label?: string;
  seconds?: number | null;
  canceled?: boolean;
  size?: number;
  color?: string;
}) {
  const c = useTheme();
  const { t } = useTranslation();
  const delay = formatDelay(seconds);
  const showDelay = !canceled && delay.status !== 'unknown' && delay.minutes !== 0;
  if (!label && !showDelay) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
      {label && <Text style={{ fontSize: size, fontFamily: fonts.medium, fontVariant: ['tabular-nums'],
        color: canceled ? c.danger : (color ?? c.secondary), textDecorationLine: canceled ? 'line-through' : 'none' }}>{label}</Text>}
      {showDelay && <Text style={{ color: c[delay.tone], fontSize: size, fontVariant: ['tabular-nums'] }}>{delayLabel(delay, t)}</Text>}
    </View>
  );
}
