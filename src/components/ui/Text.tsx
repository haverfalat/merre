import { Text as NativeText, type TextProps } from 'react-native';
import { type, useTheme } from '~/lib/theme';

export function Text({ style, ...props }: TextProps) {
  const c = useTheme();
  return <NativeText {...props} style={[type.body, { color: c.text }, style]} />;
}
