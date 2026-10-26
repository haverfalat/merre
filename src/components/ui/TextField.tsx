import { TextInput, type TextInputProps } from 'react-native';
import { fonts, useTheme } from '~/lib/theme';

export function TextField({ style, ...props }: TextInputProps) {
  const c = useTheme();
  return (
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      placeholderTextColor={c.muted}
      {...props}
      style={[
        {
          color: c.text,
          backgroundColor: c.surface,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 7,
          paddingHorizontal: 9,
          paddingVertical: 7,
          minHeight: 34,
          fontSize: 12,
          fontFamily: fonts.regular,
        },
        style,
      ]}
    />
  );
}
