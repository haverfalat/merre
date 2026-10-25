import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import type { ComponentProps } from 'react';
import { transitLayers } from '../map-model';

type SourceId = 'paths' | 'stops' | 'vehicles' | 'symbols' | 'location';
type TransitSourceProps = Omit<ComponentProps<typeof GeoJSONSource>, 'id' | 'children'> & {
  id: SourceId;
};

export function TransitSource({ id, ...props }: TransitSourceProps) {
  return (
    <GeoJSONSource id={id} {...props}>
      {transitLayers
        .filter((layer) => 'source' in layer && layer.source === id)
        .map((layer) => (
          <Layer key={layer.id} {...layer} />
        ))}
    </GeoJSONSource>
  );
}
