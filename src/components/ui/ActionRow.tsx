import { View, type ViewProps } from 'react-native';

export function ActionRow({ style, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }, style]}
    />
  );
}
