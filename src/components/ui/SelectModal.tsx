import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '~/lib/theme';
import { Choice } from './Choice';
import { ModalFooter } from './ModalFooter';
import { ModalFrame } from './ModalFrame';
import { ModalHeader } from './ModalHeader';
import type { SelectProps } from './Select.types';
import { Text } from './Text';

export function Select({ label, value, options, onChange }: SelectProps) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value)?.label;
  const close = () => setOpen(false);
  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityValue={{ text: current }}
        aria-expanded={open}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={{
          minHeight: 44,
          paddingHorizontal: 9,
          paddingVertical: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderBottomWidth: 1,
          borderColor: c.strong,
          backgroundColor: c.surface,
          borderRadius: 0,
        }}
      >
        <Text style={{ flex: 1, fontSize: 14 }}>{current}</Text>
        <ChevronDown size={14} color={c.secondary} />
      </Pressable>
      <ModalFrame visible={open} onClose={close} style={{ maxHeight: '75%' }}>
        <ModalHeader title={label} onClose={close} />
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false} overScrollMode="never" contentInsetAdjustmentBehavior="never">
          {options.map((option) => (
            <Choice
              key={option.value}
              kind="radio"
              variant="row"
              label={[option.label, option.description].filter(Boolean).join(', ')}
              checked={value === option.value}
              onPress={() => {
                onChange(option.value);
                close();
              }}
              style={{
                minHeight: 48,
                borderRadius: 0,
                borderWidth: 0,
                borderTopWidth: 1,
                borderColor: c.strong,
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 14 }}>{option.label}</Text>
                {!!option.description && (
                  <Text style={{ fontSize: 13, color: c.secondary }}>{option.description}</Text>
                )}
              </View>
            </Choice>
          ))}
        </ScrollView>
        <ModalFooter onClose={close} />
      </ModalFrame>
    </>
  );
}
