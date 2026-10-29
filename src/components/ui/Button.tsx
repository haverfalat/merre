import { Check, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { feedback } from '~/lib/feedback';
import { controls, fonts, radii, stroke, useTheme } from '~/lib/theme';
import { useDensity } from './Density';
import { Text } from './Text';

export interface ButtonProps extends PressableProps {
  icon?: LucideIcon;
  iconSize?: number;
  label: string;
  selected?: boolean;
  size?: 'regular' | 'small' | 'icon';
  variant?: 'surface' | 'ghost' | 'text' | 'primary' | 'destructive';
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
  const target = compact ? controls.compact : controls.target;
  const filled = variant === 'primary' || variant === 'destructive';
  const color =
    textColor ||
    (variant === 'destructive' ? c.danger : filled ? c.onAccent : selected ? c.brand : variant === 'text' ? c.text : c.secondary);
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
          minHeight: target,
          minWidth: target,
          paddingVertical: compact ? 4 : 8,
          paddingHorizontal: compact ? 8 : 12,
          gap: compact ? 5 : 8,
          ...(size === 'icon'
            ? { width: target, height: target, paddingHorizontal: 0, gap: 0 }
            : {}),
          borderWidth: variant === 'surface' ? stroke.separator : 0,
          borderColor: selected ? c.brand : c.border,
          backgroundColor: transparent
            ? selected
              ? c.brandMuted
              : state.pressed
                ? c.raised
                : 'transparent'
            : variant === 'primary'
              ? c.primary
              : variant === 'destructive'
                ? c.dangerMuted
                : selected
                  ? c.brandMuted
                  : c.surface,
          opacity: disabled && !loading ? 0.45 : state.pressed ? 0.75 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} style={styles.indicator} />
      ) : (
        Icon && <Icon size={iconSize ?? (compact ? controls.iconSmall : controls.icon)} strokeWidth={stroke.icon} color={color} />
      )}
      {size !== 'icon' && (
        <Text
          style={{
            fontSize: compact || size === 'small' ? 13 : 14,
            lineHeight: 20,
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
