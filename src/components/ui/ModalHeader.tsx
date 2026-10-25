import { useTranslation } from '@/hooks/useTranslation';
import { X } from 'lucide-react-native';
import { View } from 'react-native';
import { fonts, useTheme } from '~/lib/theme';
import { Button } from './Button';
import { Text } from './Text';

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const c = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 7,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: c.border,
      }}
    >
      <Text accessibilityRole="header" style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
        {title}
      </Text>
      <Button icon={X} label={t('close')} size="icon" onPress={onClose} />
    </View>
  );
}
