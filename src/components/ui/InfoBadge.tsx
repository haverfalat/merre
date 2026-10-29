import { View, type ViewProps } from 'react-native';

export function InfoBadge({ style, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          paddingHorizontal: 0,
          paddingVertical: 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        },
        style,
      ]}
    />
  );
}
