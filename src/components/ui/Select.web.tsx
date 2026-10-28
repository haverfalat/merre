import { fonts, useTheme } from '~/lib/theme';
import type { SelectProps } from './Select.types';
import { Select as ModalSelect } from './SelectModal';
export function Select({ label, value, options, onChange }: SelectProps) {
  const c = useTheme();
  if (options.some((option) => option.description))
    return <ModalSelect label={label} value={value} options={options} onChange={onChange} />;
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: '100%',
        minHeight: 44,
        padding: '6px 8px',
        border: 0,
        borderBottom: `1px solid ${c.strong}`,
        borderRadius: 0,
        backgroundColor: c.surface,
        color: c.text,
        fontFamily: fonts.regular,
        fontSize: 14,
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
