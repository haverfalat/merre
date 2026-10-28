import { Route, Settings } from 'lucide-react-native';
import { Keyboard, Pressable, View } from 'react-native';
import { BrandMark } from '~/components/ui/BrandMark';
import { Button } from '~/components/ui/Button';
import { SearchHeader } from '~/features/search/SearchHeader';
import { useTranslation } from '~/hooks/useTranslation';
import { feedback } from '~/lib/feedback';
import { useTheme } from '~/lib/theme';
import { useMapStore } from '~/store/useMapStore';
import { usePlannerStore } from '~/store/usePlannerStore';
import { dismissStopPreview } from '~/store/useStopPreview';
import { useUIStore } from '~/store/useUIStore';

export const DESKTOP_TOOLBAR = { inset: 16, height: 48, gap: 12 } as const;

export function DesktopToolbar({ width, top, left }: { width: number; top: number; left: number }) {
  const c = useTheme();
  const { t } = useTranslation();
  const planning = usePlannerStore((state) => state.open);
  const dismissSearch = () => {
    useUIStore.getState().setSearchFocused(false);
    Keyboard.dismiss();
  };
  const controlStyle = { width: 48, height: 48, borderRadius: 6, boxShadow: '0 3px 12px #00000025' };
  return (
    <View pointerEvents="box-none" testID="desktop-toolbar"
      style={{ position: 'absolute', top: top + DESKTOP_TOOLBAR.inset, left: left + DESKTOP_TOOLBAR.inset,
        flexDirection: 'row', alignItems: 'flex-start', gap: DESKTOP_TOOLBAR.gap }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('workspace_map')}
        onPress={() => {
          feedback();
          dismissSearch();
          usePlannerStore.getState().close();
          useMapStore.getState().clearSelection();
          dismissStopPreview();
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
          dismissSearch();
          if (planning) usePlannerStore.getState().close();
          else usePlannerStore.getState().openPlanner();
        }}
        style={{ minHeight: 48, borderRadius: 6, paddingHorizontal: 16, boxShadow: '0 3px 12px #00000025' }} />
      <Button size="icon" icon={Settings} label={t('settings')}
        onPress={() => { dismissSearch(); useUIStore.getState().setIsSettingsOpen(true); }}
        style={controlStyle} />
    </View>
  );
}
