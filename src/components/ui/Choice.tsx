import { Check, Minus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { controls, radii, useTheme } from '~/lib/theme';
import { Text } from './Text';

export type CheckedState = boolean | 'mixed';

function CheckIndicator({ checked }: { checked: CheckedState }) {
  const c = useTheme();
  return (
    <View
      style={{
        width: 18,
        height: 18,
        flexShrink: 0,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: checked ? c.brand : c.muted,
        backgroundColor: checked ? c.brand : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked === 'mixed' ? (
        <Minus size={12} color={c.card} />
      ) : checked ? (
        <Check size={12} color={c.card} />
      ) : null}
    </View>
  );
}

function RadioIndicator({ checked }: { checked: boolean }) {
  const c = useTheme();
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: checked ? c.brand : c.muted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.brand }} />
      )}
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
      accessibilityState={{ checked, disabled: !!props.disabled }}
      {...props}
      style={(state) => [
        {
          minHeight: controls.target,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        variant !== 'inline' && {
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: variant === 'row' ? 1 : 0,
          borderRadius: variant === 'row' ? 0 : radii.control,
          borderColor: c.border,
          backgroundColor: variant === 'card' && checked ? c.brandMuted : state.pressed ? c.raised : 'transparent',
        },
        { opacity: props.disabled ? 0.45 : state.pressed ? 0.75 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {variant === 'inline' &&
        (kind === 'radio' ? (
          <RadioIndicator checked={checked} />
        ) : (
          <CheckIndicator checked={checked} />
        ))}
      {children ?? <Text style={{ flex: 1, fontSize: 14 }}>{label}</Text>}
      {variant !== 'inline' &&
        (kind === 'radio' ? (
          <RadioIndicator checked={checked} />
        ) : (
          <CheckIndicator checked={checked} />
        ))}
    </Pressable>
  );
}
