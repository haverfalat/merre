import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '~/lib/theme';
import { Text } from './Text';

export interface TableColumn {
  key: string;
  label: string;
  accessibilityLabel?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export function TableHeader({
  columns,
  style,
  size = 'regular',
}: {
  columns: TableColumn[];
  style?: StyleProp<ViewStyle>;
  size?: 'regular' | 'compact';
}) {
  const c = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          paddingHorizontal: 10,
          paddingVertical: size === 'compact' ? 3 : 5,
          borderBottomWidth: 1,
          borderColor: c.border,
        },
        style,
      ]}
    >
      {columns.map((column) => (
        <Text
          key={column.key}
          accessibilityLabel={column.accessibilityLabel}
          style={{
            flex: column.width ? undefined : 1,
            width: column.width,
            textAlign: column.align,
            fontSize: size === 'compact' ? 9 : 10,
            color: c.muted,
          }}
        >
          {column.label}
        </Text>
      ))}
    </View>
  );
}
