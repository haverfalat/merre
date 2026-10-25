import { View, type ViewProps } from 'react-native';
import { useTheme } from '~/lib/theme';

export function InfoBadge({ style, ...props }: ViewProps) {
  const c = useTheme();
  return (
    <View
      {...props}
      style={[
        {
          paddingHorizontal: 7,
          paddingVertical: 4,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 7,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        },
        style,
      ]}
    />
  );
}
