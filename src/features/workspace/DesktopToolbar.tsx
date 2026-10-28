import { Route, Settings } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { BrandMark } from '~/components/ui/BrandMark';
import { Button } from '~/components/ui/Button';
import { SearchHeader } from '~/features/search/SearchHeader';
import { useTranslation } from '~/hooks/useTranslation';
import { feedback } from '~/lib/feedback';
import { useTheme } from '~/lib/theme';
import { usePlannerStore } from '~/store/usePlannerStore';
import { dismissWorkspaceSearch, showWorkspaceMap, showWorkspaceSettings } from './actions';

export const DESKTOP_TOOLBAR = { inset: 16, height: 48, gap: 12 } as const;

export function DesktopToolbar({ width, top, left }: { width: number; top: number; left: number }) {
  const c = useTheme();
  const { t } = useTranslation();
  const planning = usePlannerStore((state) => state.open);
  const controlStyle = { width: 48, height: 48, borderRadius: 6, boxShadow: '0 3px 12px #00000025' };
  return (
    <View pointerEvents="box-none" testID="desktop-toolbar"
      style={{ position: 'absolute', top: top + DESKTOP_TOOLBAR.inset, left: left + DESKTOP_TOOLBAR.inset,
        flexDirection: 'row', alignItems: 'flex-start', gap: DESKTOP_TOOLBAR.gap }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('workspace_map')}
        onPress={() => {
          feedback();
          showWorkspaceMap();
        }}
        style={({ pressed }) => [controlStyle, { backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}>
        <BrandMark size={28} />
      </Pressable>
      <View pointerEvents="box-none" style={{ width, zIndex: 1 }}>
        <SearchHeader floating />
      </View>
      <Button icon={Route} label={t('workspace_plan')}
        variant={planning ? 'primary' : 'surface'}
        accessibilityState={{ expanded: planning }}
        onPress={() => {
          dismissWorkspaceSearch();
          if (planning) usePlannerStore.getState().close();
          else usePlannerStore.getState().openPlanner();
        }}
        style={{ minHeight: 48, borderRadius: 6, paddingHorizontal: 16, boxShadow: '0 3px 12px #00000025' }} />
      <Button size="icon" icon={Settings} label={t('settings')}
        onPress={showWorkspaceSettings}
        style={controlStyle} />
    </View>
  );
}
