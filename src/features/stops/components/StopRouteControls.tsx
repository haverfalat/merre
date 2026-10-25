import { useTranslation } from '@/hooks/useTranslation';
import { cleanTransitLabel, cleanTransitPlaceName } from '@/lib/transit/labels';
import { useMapStore } from '@/store/useMapStore';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Choice } from '~/components/ui/Choice';
import { Skeleton } from '~/components/ui/Skeleton';
import { Text } from '~/components/ui/Text';
import { RouteBadge } from '~/components/ui/transit/RouteBadge';
import {
  stopRouteChipOptions,
  toggleStopRoute,
  type stopRouteOptions,
} from '~/features/stops/model/stop-route-filters';
import { useTheme } from '~/lib/theme';

export function StopRouteControls({
  options,
  loading,
}: {
  options: ReturnType<typeof stopRouteOptions>;
  loading?: boolean;
}) {
  const [height, setHeight] = useState(38);
  const chips = useMemo(() => stopRouteChipOptions(options), [options]);
  const selected = useMapStore((s) => s.stopRouteFilter);
  const c = useTheme();
  const { t } = useTranslation();
  if (!options.length)
    return loading ? (
      <View
        testID="loading-route-filters"
        accessibilityLabel={t('connecting')}
        accessibilityState={{ busy: true }}
        aria-busy
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
        }}
      >
        <Skeleton width={40} height={22} />
        <Skeleton width={52} height={22} />
        <Skeleton width={46} height={22} />
      </View>
    ) : null;
  const all = selected === null || options.every((route) => selected.includes(route.id));
  const partial = !all && options.some((route) => selected?.includes(route.id));
  return (
    <ScrollView
      testID="stop-route-filters"
      onContentSizeChange={(_, contentHeight) =>
        setHeight(Math.max(38, Math.min(70, Math.ceil(contentHeight))))
      }
      style={{
        flexGrow: 0,
        flexShrink: 0,
        height,
        maxHeight: 70,
        borderBottomWidth: 1,
        borderColor: c.border,
      }}
      contentContainerStyle={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
        paddingVertical: 4,
        columnGap: 10,
        rowGap: 2,
        alignItems: 'center',
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Choice
        kind="checkbox"
        variant="inline"
        label={t('all')}
        checked={partial ? 'mixed' : all}
        onPress={() => useMapStore.getState().setStopRouteFilter(all ? [] : null)}
      >
        <Text style={{ fontSize: 12 }}>{t('all')}</Text>
      </Choice>
      {chips.map((route) => {
        const checked = selected === null || route.routeIds.every((id) => selected.includes(id));
        const state =
          !checked && route.routeIds.some((id) => selected?.includes(id))
            ? ('mixed' as const)
            : checked;
        return (
          <Choice
            key={route.id}
            kind="checkbox"
            variant="inline"
            label={cleanTransitLabel(route.label)}
            accessibilityHint={cleanTransitPlaceName(route.headsign)}
            checked={state}
            onPress={() =>
              useMapStore.getState().setStopRouteFilter(toggleStopRoute(selected, chips, route.id))
            }
          >
            <RouteBadge label={route.label} mode={route.mode} color={route.color} size="compact" />
          </Choice>
        );
      })}
    </ScrollView>
  );
}
