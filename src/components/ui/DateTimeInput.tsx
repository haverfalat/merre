import { useTranslation } from '@/hooks/useTranslation';
import { serviceDate, TRANSIT_TIME_ZONE } from '@/lib/transit';
import { useUIStore } from '@/store/useUIStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { dateTimeEpoch } from '~/lib/transit/time/service-day';
import type { DateTimeInputProps } from './DateTimeInput.types';
import { useTheme } from '~/lib/theme';

export function DateTimeInput({
  date,
  dateLabel,
  afterDate,
  time,
  minimum,
  maximum,
  onDate,
  onTime,
}: DateTimeInputProps) {
  const { t, language } = useTranslation();
  const c = useTheme();
  const theme = useUIStore((s) => s.theme);
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const value = new Date(dateTimeEpoch(date, time || '12:00') * 1000);
  const picker = (kind: 'date' | 'time') => (
    <DateTimePicker
      accessibilityLabel={t(kind === 'date' ? 'select_date' : 'select_time')}
      mode={kind}
      value={value}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      themeVariant={theme}
      textColor={c.text}
      timeZoneName={TRANSIT_TIME_ZONE}
      locale={language === 'hu' ? 'hu-HU' : 'en-GB'}
      is24Hour
      minimumDate={kind === 'date' ? new Date(dateTimeEpoch(minimum, '00:00') * 1000) : undefined}
      maximumDate={kind === 'date' ? new Date(dateTimeEpoch(maximum, '23:59') * 1000) : undefined}
      onDismiss={() => setMode(null)}
      onValueChange={(_, selected) => {
        if (Platform.OS !== 'ios') setMode(null);
        if (kind === 'date') onDate(serviceDate(selected.getTime()));
        else
          onTime(
            new Intl.DateTimeFormat('en-GB', {
              timeZone: TRANSIT_TIME_ZONE,
              hourCycle: 'h23',
              hour: '2-digit',
              minute: '2-digit',
            }).format(selected),
          );
      }}
    />
  );
  return (
    <>
      <Button
        variant="ghost"
        label={dateLabel || date}
        accessibilityLabel={t('select_date')}
        hitSlop={0}
        onPress={() => setMode('date')}
        style={{ flex: 1, minHeight: 28 }}
      />
      {afterDate}
      <View style={{ height: 18, width: 1, backgroundColor: c.border }} />
      <Button
        variant="ghost"
        label={time || '--:--'}
        accessibilityLabel={t('select_time')}
        hitSlop={0}
        onPress={() => setMode('time')}
        style={{ minHeight: 28, width: 60 }}
      />
      {mode &&
        (Platform.OS === 'ios' ? (
          <ModalFrame visible onClose={() => setMode(null)} maxWidth={360} style={{ padding: 12 }}>
            {picker(mode)}
            <ModalFooter onClose={() => setMode(null)} />
          </ModalFrame>
        ) : (
          picker(mode)
        ))}
    </>
  );
}
