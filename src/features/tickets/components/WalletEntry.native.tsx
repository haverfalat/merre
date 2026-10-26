import { router } from 'expo-router';
import { Ticket } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { useTheme } from '~/lib/theme';
import { useTranslation } from '~/hooks/useTranslation';

export function WalletEntry({ onOpen, compact }: { onOpen?: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <Button
      icon={Ticket}
      size={compact ? 'icon' : 'regular'}
      label={t('tickets_wallet')}
      onPress={() => {
        onOpen?.();
        router.push('/tickets');
      }}
      style={compact ? { backgroundColor: c.card } : { flex: 1 }}
    />
  );
}
