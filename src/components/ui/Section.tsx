import type { StyleProp, TextStyle } from 'react-native';
import { fonts, useTheme } from '~/lib/theme';
import { Text } from './Text';

export function Section({ title, style }: { title: string; style?: StyleProp<TextStyle> }) {
  const c = useTheme();
  return (
    <Text
      style={[
        {
          paddingHorizontal: 12,
          paddingTop: 9,
          paddingBottom: 5,
          fontSize: 10,
          fontFamily: fonts.semibold,
          color: c.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        style,
      ]}
    >
      {title}
    </Text>
  );
}
