import { Check, Minus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { useTheme } from '~/lib/theme';
import { Text } from './Text';

export type CheckedState = boolean | 'mixed';

export function CheckIndicator({ checked }: { checked: CheckedState }) {
  const c = useTheme();
  return (
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: checked ? c.accent : c.muted,
        backgroundColor: checked ? c.accent : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked === 'mixed' ? (
        <Minus size={11} color="#ffffff" />
      ) : checked ? (
        <Check size={11} color="#ffffff" />
      ) : null}
    </View>
  );
}

type ChoiceProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'inline' | 'card' | 'row';
  children?: ReactNode;
} & ({ kind: 'checkbox'; checked: CheckedState } | { kind: 'radio'; checked: boolean });

export function Choice({
  label,
  checked,
  kind,
  variant = 'card',
  children,
  style,
  ...props
}: ChoiceProps) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={label}
      aria-checked={checked}
      accessibilityState={{ checked }}
      hitSlop={4}
      {...props}
      style={(state) => [
        {
          minHeight: variant === 'inline' ? 30 : 34,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
        },
        variant !== 'inline' && {
          paddingHorizontal: 7,
          paddingVertical: 5,
          borderWidth: 1,
          borderRadius: 7,
          borderColor: checked ? c.accent : c.border,
          backgroundColor: checked ? c.accentMuted : c.surface,
        },
        state.pressed && { opacity: 0.65 },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {variant === 'inline' && <CheckIndicator checked={checked} />}
      {children ?? <Text style={{ flex: 1, fontSize: 12 }}>{label}</Text>}
      {variant !== 'inline' && checked && <Check size={13} color={c.accent} />}
    </Pressable>
  );
}
