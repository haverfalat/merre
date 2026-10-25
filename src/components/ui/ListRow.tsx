import { Pressable, type PressableProps } from 'react-native';
import { useTheme } from '~/lib/theme';

export function ListRow({
  style,
  layout = 'row',
  ...props
}: PressableProps & { layout?: 'row' | 'content' }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={(state) => [
        layout === 'row'
          ? {
              minHeight: 44,
              paddingHorizontal: 10,
              paddingVertical: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: state.pressed ? c.raised : 'transparent',
            }
          : undefined,
        typeof style === 'function' ? style(state) : style,
      ]}
    />
  );
}
