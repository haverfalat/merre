import { TextInput, type TextInputProps } from 'react-native';
import { useState } from 'react';
import { controls, fonts, radii, useTheme } from '~/lib/theme';

export function TextField({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const c = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      placeholderTextColor={c.muted}
      {...props}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      style={[
        {
          color: c.text,
          backgroundColor: c.surface,
          borderColor: focused ? c.focus : c.strong,
          borderWidth: 1,
          borderRadius: radii.control,
          paddingHorizontal: 12,
          paddingVertical: 10,
          minHeight: controls.target,
          fontSize: 16,
          opacity: props.editable === false ? 0.6 : 1,
          fontFamily: fonts.regular,
        },
        style,
      ]}
    />
  );
}
