import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { feedback } from '~/lib/feedback';
import { fonts, useTheme } from '~/lib/theme';
import { Text } from './Text';

export interface ButtonProps extends PressableProps {
  icon?: LucideIcon;
  label: string;
  selected?: boolean;
  size?: 'regular' | 'small' | 'icon';
  variant?: 'surface' | 'ghost' | 'text' | 'primary';
  textColor?: string;
  loading?: boolean;
}

export function Button({
  icon: Icon,
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
  const color =
    textColor ||
    (variant === 'primary' ? '#ffffff' : selected || variant === 'text' ? c.accent : c.secondary);
  const transparent = variant === 'ghost' || variant === 'text';
  const disabled = !!(props.disabled || loading);
  return (
    <Pressable
      hitSlop={6}
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
          minHeight: size === 'small' ? 28 : 32,
          ...(size === 'icon' ? { width: 32, height: 32, paddingHorizontal: 0, gap: 0 } : {}),
          borderWidth: transparent ? 0 : 1,
          backgroundColor: transparent
            ? 'transparent'
            : variant === 'primary'
              ? c.accent
              : selected
                ? c.accentMuted
                : c.surface,
          borderColor: selected ? c.accent : c.border,
          opacity: disabled && !loading ? 0.4 : state.pressed ? 0.65 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} style={styles.indicator} />
      ) : Icon && <Icon size={16} color={color} />}
      {size !== 'icon' && (
        <Text
          style={{
            fontSize: size === 'small' ? 11 : 12,
            lineHeight: 16,
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
    minWidth: 32,
    borderRadius: 7,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
});
