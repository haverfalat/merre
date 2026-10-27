import { Route, X } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts, useTheme } from '~/lib/theme';
import { usePlannerStore } from '~/store/usePlannerStore';

export function PlannerHeader() {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <View
      style={{
        minHeight: 48,
        paddingHorizontal: 12,
        gap: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        boxShadow: '0 4px 18px #00000020',
      }}
    >
      <Route size={21} color={c.accent} />
      <Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 15 }}>
        {t('planner_title')}
      </Text>
      <Button
        icon={X}
        size="icon"
        variant="ghost"
        label={t('close')}
        onPress={usePlannerStore.getState().close}
      />
    </View>
  );
}
