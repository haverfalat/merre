import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import type { ComponentProps } from 'react';
import { vehicleHeadingOffset } from '../marker-heading';
import { transitLayers } from '../map-model';

type SourceId = 'paths' | 'stops' | 'vehicles' | 'symbols' | 'location';
type TransitSourceProps = Omit<ComponentProps<typeof GeoJSONSource>, 'id' | 'children'> & {
  id: SourceId;
  bearing?: number;
};

export function TransitSource({ id, bearing = 0, ...props }: TransitSourceProps) {
  return (
    <GeoJSONSource id={id} {...props}>
      {transitLayers
        .filter((layer) => 'source' in layer && layer.source === id)
        .map((layer) => {
          if (layer.type === 'symbol' && (layer.id === 'vehicle-headings' || layer.id === 'vehicle-heading-outlines'))
            return <Layer key={layer.id} {...layer} layout={{ ...layer.layout, 'icon-offset': vehicleHeadingOffset(bearing) }} />;
          return <Layer key={layer.id} {...layer} />;
        })}

    </GeoJSONSource>
  );
}
