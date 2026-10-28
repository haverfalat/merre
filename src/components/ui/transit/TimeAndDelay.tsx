import { Text as NativeText, View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from '~/hooks/useTranslation';
import { formatDelay } from '~/lib/transit/delay';
import { fonts, useTheme } from '~/lib/theme';

/** Shared inline clock + delay presentation for every transport mode. */
export function TimeAndDelay({ label, seconds, canceled = false, size = 12, color }: {
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
  const delayLabel = delay.minutes > 0
    ? t('delay_min', { min: delay.minutes }) : t('early', { min: Math.abs(delay.minutes) });
  const delayColor = delay.status === 'major_delay' ? c.danger : delay.status === 'minor_delay'
    ? c.warning : delay.status === 'early' ? c.early : c.success;
  if (!label && !showDelay) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
      {label && <Text style={{ fontSize: size, fontFamily: fonts.mono, fontVariant: ['tabular-nums'],
        color: canceled ? c.danger : (color ?? c.secondary), textDecorationLine: canceled ? 'line-through' : 'none' }}>{label}</Text>}
      {showDelay && <NativeText style={{ color: delayColor, fontSize: 12, fontVariant: ['tabular-nums'] }}>{delayLabel}</NativeText>}
    </View>
  );
}
