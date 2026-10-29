import { useTranslation } from '@/hooks/useTranslation';
import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { space, type, useTheme } from '~/lib/theme';
import { Button } from './Button';
import { Text } from './Text';

export function ModalHeader({
  title,
  onClose,
  actions,
}: {
  title: string;
  onClose: () => void;
  actions?: ReactNode;
}) {
  const c = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: space.sm,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: c.border,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{ ...type.heading, flex: 1, paddingVertical: 4 }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {actions}
        <Button icon={X} label={t('close')} size="icon" variant="ghost" onPress={onClose} />
      </View>
    </View>
  );
}
