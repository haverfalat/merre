import { View, type ViewProps } from 'react-native';
import { radii, useTheme } from '~/lib/theme';

export function Card({
  surface = 'card',
  tone = 'default',
  style,
  ...props
}: ViewProps & {
  surface?: 'card' | 'surface';
  tone?: 'default' | 'warning';
}) {
  const c = useTheme();
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: c[surface],
          borderWidth: tone === 'warning' ? 1 : 0,
          borderColor: tone === 'warning' ? c.warning : c.border,
          borderRadius: radii.card,
        },
        style,
      ]}
    />
  );
}
