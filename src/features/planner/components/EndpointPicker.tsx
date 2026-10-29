import { useState, useMemo, useEffect, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { LocateFixed, MapPin, Search } from 'lucide-react-native';
import { usePlaceSearch } from '~/hooks/usePlaceSearch';
import { useTranslation } from '~/hooks/useTranslation';
import type { LocationState } from '~/hooks/useLocation';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { TextField } from '~/components/ui/TextField';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { RefreshSkeleton, SkeletonRows } from '~/components/ui/Skeleton';
import { QueryError } from '~/components/ui/QueryError';
import { ModeIcon } from '~/components/ui/transit/ModeIcon';
import { Button } from '~/components/ui/Button';
import { fonts, useTheme } from '~/lib/theme';
import { validCoordinates } from '~/lib/transit';
import type { JourneyEndpoint } from '~/lib/transit/types/plan';
import { usePlannerStore } from '~/store/usePlannerStore';

type Candidate = { key: string; point: JourneyEndpoint; subtitle: string; mode?: string };
export function EndpointPicker({
  field,
  onClose,
  location,
}: {
  field: 'from' | 'to';
  onClose(): void;
  location: LocationState;
}) {
  const [input, setInput] = useState('');
  const awaitingLocation = useRef(false);
  const { query, stations, places, searching: loading } = usePlaceSearch(input);
  const c = useTheme();
  const { t } = useTranslation();
  const results = useMemo(() => {
    const items: Candidate[] = [];
    const seen = new Set<string>();
    for (const station of stations.data?.features ?? []) {
      const [lon, lat] = station.geometry.coordinates;
      if (!validCoordinates(lon, lat) || seen.has(station.id)) continue;
      seen.add(station.id);
      items.push({
        key: `stop-${station.id}`,
        point: { name: station.properties.name.replace(/\*$/, ''), lat, lon, stopId: station.id },
        subtitle: t(
          station.properties.type === 'MetaStation' ? 'places_addresses' : 'stations_stops',
        ),
        mode: station.properties.modes?.[0],
      });
    }
    for (const [index, place] of (places.data?.features ?? []).entries()) {
      const [lon, lat] = place.geometry.coordinates;
      if (!validCoordinates(lon, lat)) continue;
      const p = place.properties;
      const name = String(p.name || p.street || p.city || t('unknown_place'));
      items.push({
        key: `place-${index}`,
        point: { name, lon, lat },
        subtitle: [p.street, p.housenumber, p.city || p.town, p.country].filter(Boolean).join(', '),
      });
    }
    return items;
  }, [stations.data, places.data, t]);
  const select = (point: JourneyEndpoint) => {
    usePlannerStore.getState().setEndpoint(field, point);
    onClose();
  };
  useEffect(() => {
    if (location.error) awaitingLocation.current = false;
    if (!awaitingLocation.current || !location.position) return;
    awaitingLocation.current = false;
    usePlannerStore.getState().setEndpoint(field, {
      name: t('planner_current_location'),
      lat: location.position.coords.latitude,
      lon: location.position.coords.longitude,
    });
    onClose();
  }, [location.position, location.error, field, t, onClose]);
  return (
    <ModalFrame presentation="task" visible onClose={onClose}>
      <ModalHeader title={t(field === 'from' ? 'planner_from' : 'planner_to')} onClose={onClose} />
      <View style={{ padding: 12, gap: 10 }}>
        <TextField
          autoFocus
          value={input}
          onChangeText={setInput}
          placeholder={t('planner_search_place')}
          accessibilityLabel={t('planner_search_place')}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (results[0] && input.trim() === query) select(results[0].point);
          }}
          style={{ minHeight: 44, fontSize: 16 }}
        />
        {location.position ? (
          <Button
            icon={LocateFixed}
            label={t('planner_current_location')}
            onPress={() =>
              select({
                name: t('planner_current_location'),
                lat: location.position!.coords.latitude,
                lon: location.position!.coords.longitude,
              })
            }
            style={{ minHeight: 44 }}
          />
        ) : (
          <Button
            icon={LocateFixed}
            label={t(location.locating ? 'locating' : 'planner_current_location')}
            loading={location.locating}
            onPress={() => {
              awaitingLocation.current = true;
              void location.locate();
            }}
            style={{ minHeight: 44 }}
          />
        )}
        {!!location.error && (
          <Text style={{ color: c.warning, fontSize: 14 }}>{t(location.error)}</Text>
        )}
      </View>
      {!!query && (stations.isError || places.isError) && (
        <QueryError
          retry={() => {
            if (stations.isError) void stations.refetch();
            if (places.isError) void places.refetch();
          }}
        />
      )}
      <FlatList
        data={input.trim() === query ? results : []}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <ListRow onPress={() => select(item.point)} style={{ paddingVertical: 12 }}>
            {item.mode ? (
              <ModeIcon mode={item.mode} size={20} color={c.accent} />
            ) : (
              <MapPin size={20} color={c.accent} />
            )}
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 15 }}>{item.point.name}</Text>
              <Text numberOfLines={2} style={{ color: c.secondary, fontSize: 14, lineHeight: 20 }}>
                {item.subtitle}
              </Text>
            </View>
          </ListRow>
        )}
        ListEmptyComponent={
          loading ? (
            <SkeletonRows variant="search" count={4} />
          ) : (
            <View style={{ padding: 24, alignItems: 'center', gap: 10 }}>
              <Search size={26} color={c.muted} />
              <Text style={{ textAlign: 'center', color: c.muted, fontSize: 14 }}>
                {t(query.length < 2 ? 'planner_place_hint' : 'no_results')}
              </Text>
            </View>
          )
        }
      />
      <RefreshSkeleton active={loading && results.length > 0} />
    </ModalFrame>
  );
}
