import { useTranslation } from '@/hooks/useTranslation';
import { delayLabel, formatDelay } from '@/lib/transit/delay';
import { Clock } from 'lucide-react-native';
import { fonts, useTheme } from '~/lib/theme';
import { InfoBadge } from '../InfoBadge';
import { Text } from '../Text';

export function DelayBadge({ seconds }: { seconds?: number | null }) {
  const { t } = useTranslation();
  const c = useTheme();
  const delay = formatDelay(seconds);
  if (delay.status === 'unknown' || delay.minutes === 0) return null;
  const label = delayLabel(delay, t);
  const color = c[delay.tone];
  return (
    <InfoBadge
      accessibilityLabel={label}
      style={{
        minHeight: 32,
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        borderRadius: 3,
        backgroundColor: c[delay.surface],
      }}
    >
      <Clock size={13} color={color} />
      <Text style={{ color, fontSize: 13, fontFamily: fonts.semibold }}>{label}</Text>
    </InfoBadge>
  );
}
