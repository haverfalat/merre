import { useTranslation } from '@/hooks/useTranslation';
import { cleanTransitLabel, cleanTransitPlaceName } from '@/lib/transit/labels';
import { useMapStore } from '@/store/useMapStore';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Choice } from '~/components/ui/Choice';
import { Skeleton } from '~/components/ui/Skeleton';
import { Text } from '~/components/ui/Text';
import { RouteBadge } from '~/components/ui/transit/RouteBadge';
import { controls } from '~/lib/theme';
import {
  stopRouteChipOptions,
  toggleStopRoute,
  type stopRouteOptions,
} from '~/features/stops/model/stop-route-filters';

export function StopRouteControls({
  options,
  loading,
}: {
  options: ReturnType<typeof stopRouteOptions>;
  loading?: boolean;
}) {
  const minHeight = controls.target + 6;
  const [height, setHeight] = useState(minHeight);
  const chips = useMemo(() => stopRouteChipOptions(options), [options]);
  const selected = useMapStore((s) => s.stopRouteFilter);
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
          gap: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <Skeleton width={32} height={18} />
        <Skeleton width={44} height={18} />
        <Skeleton width={38} height={18} />
      </View>
    ) : null;
  const all = selected === null || options.every((route) => selected.includes(route.id));
  const partial = !all && options.some((route) => selected?.includes(route.id));
  return (
    <ScrollView
      horizontal
      testID="stop-route-filters"
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      contentInsetAdjustmentBehavior="never"
      onContentSizeChange={(_, contentHeight) => setHeight(Math.max(minHeight, Math.ceil(contentHeight)))}
      style={{
        flexGrow: 0,
        flexShrink: 0,
        height,
      }}
      contentContainerStyle={{
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 3,
        columnGap: 8,
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
        <Text style={{ fontSize: 14, lineHeight: 20 }}>{t('all')}</Text>
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
            <RouteBadge label={route.label} mode={route.mode} color={route.color} size="tiny" />
          </Choice>
        );
      })}
    </ScrollView>
  );
}
