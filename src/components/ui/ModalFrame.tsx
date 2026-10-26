import { useTranslation } from '@/hooks/useTranslation';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from './Card';

export function Backdrop({
  onPress,
  color = '#00000088',
  label,
}: {
  onPress: () => void;
  color?: string;
  label?: string;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessible={false}
      focusable={false}
      accessibilityLabel={label || t('close')}
      onPress={onPress}
      style={{ position: 'absolute', inset: 0, backgroundColor: color }}
    />
  );
}

interface ModalPanelProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ModalPanel({ onClose, children, maxWidth = 400, style, testID }: ModalPanelProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 12,
        paddingHorizontal: 12,
      }}
    >
      <Backdrop onPress={onClose} />
      <Card
        testID={testID}
        accessibilityViewIsModal
        style={[
          {
            width: Math.min(width - 24, maxWidth),
            maxHeight: height - insets.top - insets.bottom - 24,
            flexShrink: 1,
            borderRadius: 14,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {children}
      </Card>
    </KeyboardAvoidingView>
  );
}

export function ModalFrame({
  visible,
  onClose,
  children,
  ...props
}: ModalPanelProps & { visible: boolean }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <ModalPanel onClose={onClose} {...props}>
        {children}
      </ModalPanel>
    </Modal>
  );
}
