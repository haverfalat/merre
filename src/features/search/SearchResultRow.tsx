import { cleanTransitPlaceName } from '@/lib/transit/labels';
import { useTransitPrefetch } from '~/hooks/useTransitPrefetch';
import { Platform, View } from 'react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { ModeIcon } from '~/components/ui/transit/ModeIcon';
import { RouteBadge } from '~/components/ui/transit/RouteBadge';
import { RouteDestination } from '~/components/ui/transit/RouteDestination';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { fonts, useTheme } from '~/lib/theme';
import type { SearchResult } from './search-results';

export function SearchResultRow({
  item,
  id,
  active,
  onActivate,
  onSelect,
}: {
  item: SearchResult;
  id: string;
  active: boolean;
  onActivate: () => void;
  onSelect: () => void;
}) {
  const c = useTheme();
  const prefetch = useTransitPrefetch();
  return (
    <ListRow
      nativeID={id}
      accessibilityRole={Platform.OS === 'web' ? 'option' : 'button'}
      aria-selected={active}
      accessibilityState={{ selected: active }}
      accessibilityLabel={cleanTransitPlaceName(item.title)}
      onHoverIn={() => { onActivate(); prefetch(item.prefetch); }}
      onFocus={() => prefetch(item.prefetch)}
      onPressIn={() => prefetch(item.prefetch)}
      onPress={onSelect}
      style={({ pressed }) => [
        {
          paddingHorizontal: 16,
          paddingVertical: 10,
          minHeight: 60,
          borderBottomWidth: 1,
          borderColor: c.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: pressed || active ? c.raised : 'transparent',
        },
      ]}
    >
      {!item.routeLabel && <ModeIcon mode={item.mode} color={c.accent} />}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        {item.routeLabel ? (
          <RouteDestination
            boarding={item.frontDoor ? 'front-door' : 'none'}
            label={item.routeLabel}
            mode={item.mode}
            color={item.color}
            destination={item.title}
            lines={0}
          />
        ) : (
          <TransitLabel
            html={item.title}
            placeName
            style={{ fontSize: 15, fontFamily: fonts.medium }}
          />
        )}
        {!!item.subtitle && (
          <Text style={{ color: c.secondary, fontSize: 14, lineHeight: 20 }}>
            {item.subtitle}
          </Text>
        )}
        {!!item.routes?.length && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
            {[...item.routes]
              .sort((a, b) =>
                (a.shortName || '').localeCompare(b.shortName || '', undefined, { numeric: true }),
              )
              .slice(0, 12)
              .map((route) => (
                <RouteBadge
                  key={route.id}
                  label={route.shortName}
                  mode={route.mode}
                  color={route.color}
                  size="compact"
                />
              ))}
            {item.routes.length > 12 && (
              <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>+{item.routes.length - 12}</Text>
            )}
          </View>
        )}
        {!item.routes?.length && !!item.modes?.length && (
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {item.modes.slice(0, 3).map((mode) => (
              <ModeIcon key={mode} mode={mode} size={12} color={c.muted} />
            ))}
          </View>
        )}
      </View>
    </ListRow>
  );
}
