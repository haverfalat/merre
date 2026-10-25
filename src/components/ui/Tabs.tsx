import { View } from 'react-native';
import { useTheme } from '~/lib/theme';
import { Button } from './Button';

export function Tabs<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const c = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        paddingHorizontal: 6,
        paddingVertical: 2,
        gap: 3,
        borderBottomWidth: 1,
        borderColor: c.border,
      }}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          accessibilityRole="tab"
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
          style={{ flex: 1, minHeight: 27, borderRadius: 5 }}
        />
      ))}
    </View>
  );
}
