import type { StyleProp, TextStyle } from 'react-native';
import { type, useTheme } from '~/lib/theme';
import { Text } from './Text';
import { useDensity } from './Density';

export function Section({ title, style }: { title: string; style?: StyleProp<TextStyle> }) {
  const c = useTheme();
  const compact = useDensity() === 'compact';
  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          paddingHorizontal: compact ? 10 : 16,
          paddingTop: compact ? 12 : 24,
          paddingBottom: compact ? 6 : 8,
          ...type.section,
          color: c.text,
        },
        style,
      ]}
    >
      {title}
    </Text>
  );
}
