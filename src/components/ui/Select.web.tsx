import { fonts, useTheme } from '~/lib/theme';
import type { SelectProps } from './Select.types';
export function Select({ label, value, options, onChange }: SelectProps) {
  const c = useTheme();
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: '100%',
        minHeight: 34,
        padding: '6px 8px',
        border: `1px solid ${c.border}`,
        borderRadius: 7,
        backgroundColor: c.surface,
        color: c.text,
        fontFamily: fonts.regular,
        fontSize: 12,
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
