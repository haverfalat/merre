import { useTranslation } from '@/hooks/useTranslation';
import { formatDelay } from '@/lib/transit/delay';
import { Clock } from 'lucide-react-native';
import { fonts, useTheme } from '~/lib/theme';
import { InfoBadge } from '../InfoBadge';
import { Text } from '../Text';

export function DelayBadge({ seconds }: { seconds?: number | null }) {
  const { t } = useTranslation();
  const c = useTheme();
  const delay = formatDelay(seconds);
  const label =
    delay.status === 'on_time'
      ? t('on_time')
      : delay.status === 'unknown'
        ? t('unknown_delay')
        : delay.status === 'early'
          ? t('early', { min: Math.abs(delay.minutes) })
          : t('delay_min', { min: delay.minutes });
  const color =
    delay.status === 'on_time'
      ? c.success
      : delay.status === 'early'
        ? c.accent
        : delay.status === 'major_delay'
          ? c.danger
          : delay.status === 'minor_delay'
            ? c.warning
            : c.textMuted;
  const background =
    delay.status === 'on_time'
      ? c.successMuted
      : delay.status === 'early'
        ? c.accentMuted
        : delay.status === 'major_delay'
          ? c.dangerMuted
          : delay.status === 'minor_delay'
            ? c.warningMuted
            : c.raised;
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
        borderRadius: 7,
        borderWidth: 1,
        borderColor: `${color}4d`,
        backgroundColor: background,
      }}
    >
      <Clock size={13} color={color} />
      <Text style={{ color, fontSize: 11, fontFamily: fonts.semibold }}>
        {delay.status === 'on_time' || delay.status === 'early' ? label : delay.text}
      </Text>
    </InfoBadge>
  );
}
