import { useTranslation } from '@/hooks/useTranslation';
import { View } from 'react-native';
import { useTheme } from '~/lib/theme';
import { Button } from './Button';

export function ModalFooter({
  onClose,
  variant = 'surface',
}: {
  onClose: () => void;
  variant?: 'surface' | 'primary';
}) {
  const c = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ padding: 8, borderTopWidth: 1, borderColor: c.border }}>
      <Button label={t('done')} variant={variant} onPress={onClose} />
    </View>
  );
}
