import { Text as NativeText, type TextProps } from 'react-native';
import { fonts, useTheme } from '~/lib/theme';

export function Text({ style, ...props }: TextProps) {
  const c = useTheme();
  return (
    <NativeText
      {...props}
      style={[{ fontFamily: fonts.regular, fontSize: 14, color: c.text }, style]}
    />
  );
}
