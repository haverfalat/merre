import { Route, X } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts, useTheme } from '~/lib/theme';
import { usePlannerStore } from '~/store/usePlannerStore';
import { MAP_PANEL_LAYOUT } from '~/lib/map-layout';

export function PlannerHeader({ docked }: { docked: boolean }) {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <View
      style={{
        minHeight: MAP_PANEL_LAYOUT.headerHeight,
        paddingHorizontal: 12,
        gap: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: docked ? 0 : 4,
        backgroundColor: c.card,
        borderWidth: docked ? 0 : 1,
        borderBottomWidth: 1,
        borderColor: c.border,
        boxShadow: docked ? 'none' : '0 4px 18px #00000020',
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
