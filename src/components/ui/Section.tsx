import type { StyleProp, TextStyle } from 'react-native';
import { fonts, useTheme } from '~/lib/theme';
import { Text } from './Text';
import { useDensity } from './Density';

export function Section({ title, style }: { title: string; style?: StyleProp<TextStyle> }) {
  const c = useTheme();
  const compact = useDensity() === 'compact';
  return (
    <Text
      style={[
        {
          paddingHorizontal: compact ? 10 : 16,
          paddingTop: compact ? 12 : 24,
          paddingBottom: compact ? 6 : 8,
          fontSize: 12,
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
