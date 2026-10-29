import { useTranslation } from '@/hooks/useTranslation';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useViewport } from '~/hooks/useViewport';
import { radii, useTheme } from '~/lib/theme';
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
  presentation?: 'dialog' | 'task';
}

function ModalPanel({
  onClose,
  children,
  maxWidth = 480,
  style,
  testID,
  presentation = 'dialog',
}: ModalPanelProps) {
  const { width, height, insets } = useViewport();
  const c = useTheme();
  const task = presentation === 'task';
  const full = task && width < 768;
  return (
    <KeyboardAvoidingView
      behavior={
        Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined
      }
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: insets.top + (full ? 0 : 12),
        paddingBottom: insets.bottom + (full ? 0 : 12),
        paddingHorizontal: full ? 0 : 12,
        backgroundColor: full ? c.card : 'transparent',
      }}
    >
      {!full && <Backdrop onPress={onClose} />}
      <Card
        testID={testID}
        accessibilityViewIsModal
        style={[
          {
            width: full ? width : Math.min(width - 24, task ? 680 : maxWidth),
            ...(task
              ? {
                  flex: 1,
                  maxHeight: full
                    ? undefined
                    : Math.min(800, height - insets.top - insets.bottom - 24),
                }
              : {}),
            ...(!task ? { maxHeight: height - insets.top - insets.bottom - 24 } : {}),
            flexShrink: 1,
            borderRadius: full ? 0 : radii.sheet,
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
