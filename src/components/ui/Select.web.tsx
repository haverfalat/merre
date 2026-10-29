import { controls, fonts, radii, useTheme } from '~/lib/theme';
import { useUIStore } from '~/store/useUIStore';
import type { SelectProps } from './Select.types';
import { Select as ModalSelect } from './SelectModal';
export function Select({ label, value, options, onChange }: SelectProps) {
  const c = useTheme();
  const theme = useUIStore((state) => state.theme);
  if (options.some((option) => option.description))
    return <ModalSelect label={label} value={value} options={options} onChange={onChange} />;
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: '100%',
        minHeight: controls.target,
        padding: '10px 12px',
        border: `1px solid ${c.strong}`,
        borderRadius: radii.control,
        backgroundColor: c.surface,
        color: c.text,
        fontFamily: fonts.regular,
        fontSize: 14,
        colorScheme: theme,
        cursor: 'pointer',
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
