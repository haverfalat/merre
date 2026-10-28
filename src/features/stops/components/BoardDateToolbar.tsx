import { useTranslation } from '@/hooks/useTranslation';
import { serviceDayBounds } from '@/lib/transit';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { DateTimeInput } from '~/components/ui/DateTimeInput';
import { boardDateOffset } from '~/features/stops/model/board-date';
import { useTheme } from '~/lib/theme';

export function BoardDateToolbar({
  now,
  offset,
  date,
  dateLabel,
  time,
  currentTime,
  onDay,
  onTime,
  onReset,
}: {
  now: number;
  offset: number;
  date: string;
  dateLabel: string;
  time: string | null;
  currentTime: string;
  onDay: (amount: number) => void;
  onTime: (time: string) => void;
  onReset: () => void;
}) {
  const c = useTheme();
  const { t } = useTranslation();
  const buttonStyle = { minHeight: 44, width: 44, flexShrink: 0, paddingHorizontal: 3 };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 0,
        marginVertical: 0,
        paddingHorizontal: 2,

        borderBottomWidth: 1,
        borderColor: c.border,
        borderRadius: 0,
        backgroundColor: c.surface,
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        icon={ChevronLeft}
        label={t('previous_day')}
        hitSlop={0}
        disabled={offset <= -7}
        onPress={() => onDay(-1)}
        style={buttonStyle}
      />
      <DateTimeInput
        date={date}
        dateLabel={dateLabel}
        time={time || currentTime}
        minimum={serviceDayBounds(now, -7).date}
        maximum={serviceDayBounds(now, 365).date}
        afterDate={
          <Button
            variant="ghost"
            size="icon"
            icon={ChevronRight}
            label={t('next_day')}
            hitSlop={0}
            disabled={offset >= 365}
            onPress={() => onDay(1)}
            style={buttonStyle}
          />
        }
        onDate={(value) => {
          const next = boardDateOffset(value, now);
          if (Number.isFinite(next) && next >= -7 && next <= 365) onDay(next - offset);
        }}
        onTime={onTime}
      />
      <View style={{ width: 1, height: 18, backgroundColor: c.border }} />
      <Button
        variant="ghost"
        size="icon"
        icon={RotateCcw}
        label={t('today')}
        hitSlop={0}
        disabled={offset === 0 && time === null}
        onPress={onReset}
        style={buttonStyle}
      />
    </View>
  );
}
