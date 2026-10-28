import { Check, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { feedback } from '~/lib/feedback';
import { fonts, radii, useTheme } from '~/lib/theme';
import { useDensity } from './Density';
import { Text } from './Text';

export interface ButtonProps extends PressableProps {
  icon?: LucideIcon;
  iconSize?: number;
  label: string;
  selected?: boolean;
  size?: 'regular' | 'small' | 'icon';
  variant?: 'surface' | 'ghost' | 'text' | 'primary';
  textColor?: string;
  loading?: boolean;
}

export function Button({
  icon: Icon,
  iconSize,
  label,
  selected,
  size = 'regular',
  variant = 'surface',
  style,
  onPress,
  textColor,
  loading,
  accessibilityState,
  ...props
}: ButtonProps) {
  const c = useTheme();
  const compact = useDensity() === 'compact';
  const color =
    textColor ||
    (variant === 'primary' ? c.onAccent : selected || variant === 'text' ? c.accent : c.secondary);
  const transparent = variant === 'ghost' || variant === 'text';
  const disabled = !!(props.disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      aria-pressed={selected}
      aria-selected={selected}
      aria-expanded={accessibilityState?.expanded}
      aria-busy={loading || accessibilityState?.busy}
      accessibilityLabel={label}
      {...props}
      disabled={disabled}
      accessibilityState={{
        ...accessibilityState,
        selected: selected ?? accessibilityState?.selected,
        disabled,
        busy: loading || accessibilityState?.busy,
      }}
      onPress={(event) => {
        feedback();
        onPress?.(event);
      }}
      style={(state) => [
        styles.button,
        {
          minHeight: compact ? 32 : 44,
          minWidth: compact ? 32 : 44,
          paddingVertical: compact ? 4 : 8,
          paddingHorizontal: compact ? 8 : 12,
          gap: compact ? 5 : 8,
          ...(size === 'icon'
            ? { width: compact ? 32 : 44, height: compact ? 32 : 44, paddingHorizontal: 0, gap: 0 }
            : {}),
          borderWidth: 0,
          backgroundColor: transparent
            ? selected
              ? c.accentMuted
              : state.pressed
                ? c.raised
                : 'transparent'
            : variant === 'primary'
              ? c.primary
              : selected
                ? c.accentMuted
                : c.surface,
          opacity: disabled && !loading ? 0.4 : state.pressed ? 0.65 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} style={styles.indicator} />
      ) : (
        Icon && <Icon size={iconSize ?? (compact ? 16 : 18)} strokeWidth={1.8} color={color} />
      )}
      {size !== 'icon' && (
        <Text
          style={{
            fontSize: compact || size === 'small' ? 13 : 14,
            includeFontPadding: false,
            textAlign: 'center',
            flexShrink: 1,
            fontFamily: fonts.semibold,
            color,
          }}
        >
          {label}
        </Text>
      )}
      {selected !== undefined && size !== 'icon' && (
        <Check size={14} color={color} style={{ opacity: selected ? 1 : 0 }} />
      )}
      {selected && size === 'icon' && (
        <Check size={11} color={color} style={{ position: 'absolute', bottom: 3, right: 3 }} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  indicator: {
    width: 16,
    height: 16,
    transform: [{ scale: 0.8 }],
  },
  button: {
    minWidth: 44,
    paddingVertical: 8,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
