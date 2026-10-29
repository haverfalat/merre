import { Platform, Pressable, View } from 'react-native';
import { Compass, Route, Settings, Ticket } from 'lucide-react-native';
import { router } from 'expo-router';
import { BrandMark } from '~/components/ui/BrandMark';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts, useTheme } from '~/lib/theme';
import { usePlannerStore } from '~/store/usePlannerStore';
import { dismissWorkspaceSearch, showWorkspaceMap, showWorkspaceSettings } from './actions';

export const WORKSPACE_NAV_HEIGHT = 56;
export function WorkspaceNavigation({
  desktop,
  bottom = 0,
}: {
  desktop: boolean;
  bottom?: number;
}) {
  const c = useTheme();
  const { t } = useTranslation();
  const planning = usePlannerStore((s) => s.open);
  const destinations = [
    {
      id: 'map',
      label: t('workspace_map'),
      icon: Compass,
      active: !planning,
      run: showWorkspaceMap,
    },
    {
      id: 'plan',
      label: t('workspace_plan'),
      icon: Route,
      active: planning,
      run: () => usePlannerStore.getState().openPlanner(),
    },
    ...(Platform.OS === 'web'
      ? []
      : [
          {
            id: 'wallet',
            label: t('workspace_wallet'),
            icon: Ticket,
            active: false,
            run: () => router.push('/tickets'),
          },
        ]),
    ...(!desktop
      ? [
          {
            id: 'settings',
            label: t('settings'),
            icon: Settings,
            active: false,
            run: showWorkspaceSettings,
          },
        ]
      : []),
  ];
  return (
    <View style={{ backgroundColor: c.card, paddingBottom: desktop ? 0 : bottom }}>
      {desktop && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 4,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <BrandMark size={26} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 20, flex: 1 }}>Merre</Text>
          <Button
            size="icon"
            variant="ghost"
            icon={Settings}
            label={t('settings')}
            onPress={showWorkspaceSettings}
          />
        </View>
      )}
      <View
        accessibilityRole="toolbar"
        accessibilityLabel={t('workspace_navigation')}
        style={{
          flexDirection: 'row',
          minHeight: desktop ? 40 : WORKSPACE_NAV_HEIGHT,
          borderTopWidth: desktop ? 0 : 1,
          borderBottomWidth: desktop ? 1 : 0,
          borderColor: c.border,
        }}
      >
        {destinations.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: item.active }}
            onPress={() => {
              dismissWorkspaceSearch();
              item.run();
            }}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: desktop ? 'row' : 'column',
              minHeight: desktop ? 40 : WORKSPACE_NAV_HEIGHT,
              paddingVertical: desktop ? 6 : 8,
              gap: desktop ? 8 : 5,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed || item.active ? c.surface : c.card,
            })}
          >
            <item.icon
              size={desktop ? 18 : 21}
              color={item.active ? c.text : c.muted}
              strokeWidth={item.active ? 2.5 : 1.6}
            />
            <Text
              style={{
                fontSize: 14,
                lineHeight: 20,
                fontFamily: item.active ? fonts.semibold : fonts.regular,
                color: item.active ? c.text : c.muted,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
