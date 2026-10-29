import { Pressable, type PressableProps } from 'react-native';
import { useDensity } from './Density';
import { controls, useTheme } from '~/lib/theme';

export function ListRow({
  style,
  layout = 'row',
  ...props
}: PressableProps & { layout?: 'row' | 'content' }) {
  const c = useTheme();
  const compact = useDensity() === 'compact';
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={(state) => [
        layout === 'row'
          ? {
              minHeight: compact ? controls.compact : 56,
              paddingHorizontal: compact ? 10 : 16,
              paddingVertical: compact ? 6 : 12,
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
