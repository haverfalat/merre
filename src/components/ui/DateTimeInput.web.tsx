import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '~/components/ui/Button';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { Text } from '~/components/ui/Text';
import { controls, fonts, radii, useTheme } from '~/lib/theme';
import type { DateTimeInputProps } from './DateTimeInput.types';

function parseIsoDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return { year: 2026, month: 0, day: 1 };
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return { hour: 12, minute: 0 };
  return {
    hour: Math.max(0, Math.min(23, Number(match[1]))),
    minute: Math.max(0, Math.min(59, Number(match[2]))),
  };
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

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
  const c = useTheme();
  const { t, language } = useTranslation();
  const locale = language === 'hu' ? 'hu-HU' : 'en-GB';
  const [mode, setMode] = useState<'date' | 'time' | null>(null);

  const selectedDate = useMemo(() => parseIsoDate(date), [date]);
  const [viewYear, setViewYear] = useState(selectedDate.year);
  const [viewMonth, setViewMonth] = useState(selectedDate.month);

  const parsedTime = useMemo(() => parseTime(time), [time]);
  const [draftHour, setDraftHour] = useState(parsedTime.hour);
  const [draftMinute, setDraftMinute] = useState(parsedTime.minute);
  const [typedTime, setTypedTime] = useState(formatTime(parsedTime.hour, parsedTime.minute));

  const openDate = () => {
    setViewYear(selectedDate.year);
    setViewMonth(selectedDate.month);
    setMode('date');
  };

  const openTime = () => {
    setDraftHour(parsedTime.hour);
    setDraftMinute(parsedTime.minute);
    setTypedTime(formatTime(parsedTime.hour, parsedTime.minute));
    setMode('time');
  };

  const minMonth = useMemo(() => {
    const m = parseIsoDate(minimum);
    return m.year * 12 + m.month;
  }, [minimum]);
  const maxMonth = useMemo(() => {
    const m = parseIsoDate(maximum);
    return m.year * 12 + m.month;
  }, [maximum]);
  const currentMonthIndex = viewYear * 12 + viewMonth;

  const shiftMonth = (delta: number) => {
    const next = currentMonthIndex + delta;
    if (next < minMonth || next > maxMonth) return;
    setViewYear(Math.floor(next / 12));
    setViewMonth(next % 12);
  };

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(viewYear, viewMonth, 1))),
    [locale, viewYear, viewMonth],
  );

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    // 2024-01-01 is a Monday.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2024, 0, 1 + i))));
  }, [locale]);

  const days = useMemo(() => {
    const firstDay = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    const leadingBlanks = (firstDay + 6) % 7; // Monday = 0
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const cells: (number | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const commitTime = (h: number, m: number) => {
    onTime(formatTime(h, m));
    setMode(null);
  };

  return (
    <>
      <Button
        variant="ghost"
        label={dateLabel || date}
        accessibilityLabel={t('select_date')}
        hitSlop={0}
        onPress={openDate}
        style={{ flex: 1, minHeight: controls.target }}
      />
      {afterDate}
      <View style={{ height: 18, width: 1, backgroundColor: c.border }} />
      <Button
        variant="ghost"
        label={time || '--:--'}
        accessibilityLabel={t('select_time')}
        hitSlop={0}
        onPress={openTime}
        style={{ minHeight: controls.target, width: 72 }}
      />

      <ModalFrame visible={mode === 'date'} onClose={() => setMode(null)} maxWidth={360}>
        <ModalHeader title={t('select_date')} onClose={() => setMode(null)} />
        <View style={{ padding: 12, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              variant="ghost"
              size="icon"
              icon={ChevronLeft}
              label={t('previous_day')}
              disabled={currentMonthIndex <= minMonth}
              onPress={() => shiftMonth(-1)}
            />
            <Text style={{ fontSize: 15, fontFamily: fonts.semibold, textTransform: 'capitalize' }}>
              {monthTitle}
            </Text>
            <Button
              variant="ghost"
              size="icon"
              icon={ChevronRight}
              label={t('next_day')}
              disabled={currentMonthIndex >= maxMonth}
              onPress={() => shiftMonth(1)}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            {weekdays.map((day, idx) => (
              <Text
                key={idx}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 12,
                  color: c.secondary,
                  fontFamily: fonts.medium,
                  paddingVertical: 4,
                }}
              >
                {day}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {days.map((day, idx) => {
              if (!day) return <View key={`blank-${idx}`} style={{ width: '14.2857%', height: 40 }} />;
              const iso = toIsoDate(viewYear, viewMonth, day);
              const disabled = iso < minimum || iso > maximum;
              const selected = iso === date;
              return (
                <Pressable
                  key={iso}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={iso}
                  accessibilityState={{ selected, disabled }}
                  onPress={() => {
                    onDate(iso);
                    setMode(null);
                  }}
                  style={({ pressed }) => ({
                    width: '14.2857%',
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radii.control,
                    backgroundColor: selected ? c.accent : pressed ? c.raised : 'transparent',
                    opacity: disabled ? 0.35 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontVariant: ['tabular-nums'],
                      fontFamily: selected ? fonts.semibold : fonts.regular,
                      color: selected ? c.onAccent : c.text,
                    }}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <ModalFooter onClose={() => setMode(null)} />
      </ModalFrame>

      <ModalFrame visible={mode === 'time'} onClose={() => setMode(null)} maxWidth={320}>
        <ModalHeader title={t('select_time')} onClose={() => setMode(null)} />
        <View style={{ padding: 12, gap: 10 }}>
          <TextInput
            accessibilityLabel={t('select_time')}
            value={typedTime}
            placeholder="HH:MM"
            placeholderTextColor={c.muted}
            onChangeText={(val) => {
              setTypedTime(val);
              const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(val.trim());
              if (match) {
                setDraftHour(Number(match[1]));
                setDraftMinute(Number(match[2]));
              }
            }}
            onSubmitEditing={() => {
              const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(typedTime.trim());
              if (match) commitTime(Number(match[1]), Number(match[2]));
              else commitTime(draftHour, draftMinute);
            }}
            style={{
              minHeight: controls.target,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: c.strong,
              borderRadius: radii.control,
              backgroundColor: c.surface,
              color: c.text,
              fontFamily: fonts.semibold,
              fontSize: 16,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8, height: 220 }}>
            <ScrollView
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: radii.control,
                backgroundColor: c.surface,
              }}
            >
              {Array.from({ length: 24 }, (_, h) => {
                const selected = h === draftHour;
                return (
                  <Pressable
                    key={h}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setDraftHour(h);
                      setTypedTime(formatTime(h, draftMinute));
                    }}
                    style={({ pressed }) => ({
                      minHeight: 38,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? c.accent : pressed ? c.raised : 'transparent',
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontVariant: ['tabular-nums'],
                        fontFamily: selected ? fonts.semibold : fonts.regular,
                        color: selected ? c.onAccent : c.text,
                      }}
                    >
                      {String(h).padStart(2, '0')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: radii.control,
                backgroundColor: c.surface,
              }}
            >
              {Array.from({ length: 60 }, (_, m) => {
                const selected = m === draftMinute;
                return (
                  <Pressable
                    key={m}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setDraftMinute(m);
                      setTypedTime(formatTime(draftHour, m));
                    }}
                    style={({ pressed }) => ({
                      minHeight: 38,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? c.accent : pressed ? c.raised : 'transparent',
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontVariant: ['tabular-nums'],
                        fontFamily: selected ? fonts.semibold : fonts.regular,
                        color: selected ? c.onAccent : c.text,
                      }}
                    >
                      {String(m).padStart(2, '0')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          <Button
            variant="primary"
            label={t('done')}
            onPress={() => commitTime(draftHour, draftMinute)}
          />
        </View>
      </ModalFrame>
    </>
  );
}
