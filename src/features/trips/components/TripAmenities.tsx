import { cleanTransitLabel } from '@/lib/transit/labels';
import type { InfoService } from '@/lib/transit/types/stop';
import { View } from 'react-native';
import { InfoBadge } from '~/components/ui/InfoBadge';
import { Text } from '~/components/ui/Text';
import { amenitySymbol } from '~/features/trips/model/trip-amenities';
import { fonts } from '~/lib/theme';

export function TripAmenities({ services }: { services?: InfoService[] | null }) {
  const amenities = services?.filter((service) => service.displayable) ?? [];
  if (!amenities.length) return null;
  return (
    <View style={{ paddingHorizontal: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {amenities.map((service, index) => {
        const symbol = amenitySymbol(service);
        return (
          <InfoBadge key={index} accessible accessibilityLabel={cleanTransitLabel(service.name)}>
            <Text style={symbol ? { fontFamily: fonts.symbols, fontSize: 17 } : { fontSize: 13 }}>
              {symbol || cleanTransitLabel(service.name)}
            </Text>
          </InfoBadge>
        );
      })}
    </View>
  );
}
