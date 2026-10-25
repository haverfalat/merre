import { useTranslation } from '@/hooks/useTranslation';
import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  View,
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

export function ModalFrame({
  visible,
  onClose,
  children,
  maxWidth = 400,
  style,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
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
              borderRadius: 14,
              overflow: 'hidden',
            },
            style,
          ]}
        >
          {children}
        </Card>
      </View>
    </Modal>
  );
}
