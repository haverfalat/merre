import { Pressable, View } from 'react-native';
import { fonts, useTheme } from '~/lib/theme';
import { feedback } from '~/lib/feedback';
import { Text } from './Text';

export function Tabs<T extends string>({
  label,
  value,
  options,
  onChange,
  edgeToEdge = false,
}: {
  edgeToEdge?: boolean;
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
        paddingHorizontal: edgeToEdge ? 0 : 12,

        gap: edgeToEdge ? 0 : 4,
        borderBottomWidth: 1,
        borderColor: c.border,
      }}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="tab"
          accessibilityLabel={option.label}
          accessibilityState={{ selected: value === option.value }}
          aria-selected={value === option.value}
          onPress={() => { feedback(); onChange(option.value); }}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 34,
            borderRadius: 0,
            paddingHorizontal: 4,
            paddingVertical: 6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: value === option.value ? c.surface : pressed ? c.raised : 'transparent',
          })}
        >
          <Text style={{ fontSize: 13, lineHeight: 18, textAlign: 'center',
            fontFamily: value === option.value ? fonts.semibold : fonts.regular,
            color: value === option.value ? c.text : c.muted }}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
