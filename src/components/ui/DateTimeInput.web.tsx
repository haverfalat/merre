import type { CSSProperties } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import type { DateTimeInputProps } from './DateTimeInput.types';
import { fonts, useTheme } from '~/lib/theme';

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
  const { t } = useTranslation();
  const theme = useUIStore((s) => s.theme);
  const style: CSSProperties = {
    minWidth: 0,
    minHeight: 44,
    border: 'none',
    background: 'transparent',
    color: c.secondary,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: '20px',
    padding: '0 6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    colorScheme: theme,
  };
  const inputStyle: CSSProperties = {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    border: 0,
    margin: 0,
    padding: 0,
    boxSizing: 'border-box' as const,
    opacity: 0,
    cursor: 'pointer',
    fontFamily: fonts.regular,
    colorScheme: theme,
  };
  return (
    <>
      <label style={{ ...style, flex: 1 }}>
        {dateLabel || date}
        <input
          aria-label={t('select_date')}
          type="date"
          min={minimum}
          max={maximum}
          value={date}
          onClick={(event) => event.currentTarget.showPicker?.()}
          onChange={(event) => {
            if (event.target.validity.valid && event.target.value) onDate(event.target.value);
          }}
          style={inputStyle}
        />
      </label>
      {afterDate}
      <label style={{ ...style, width: 72, borderLeft: `1px solid ${c.border}` }}>
        {time}
        <input
          aria-label={t('select_time')}
          type="time"
          value={time}
          onClick={(event) => event.currentTarget.showPicker?.()}
          onChange={(event) => {
            if (event.target.validity.valid && event.target.value) onTime(event.target.value);
          }}
          style={inputStyle}
        />
      </label>
    </>
  );
}
