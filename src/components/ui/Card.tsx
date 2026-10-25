import { View, type ViewProps } from 'react-native';
import { useTheme } from '~/lib/theme';

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
          borderWidth: 1,
          borderColor: tone === 'warning' ? c.warning : c.border,
          borderRadius: 9,
        },
        style,
      ]}
    />
  );
}
