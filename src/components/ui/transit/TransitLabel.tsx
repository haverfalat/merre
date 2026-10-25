import { displayTransitParts } from '@/lib/transit-label';
import { Text as NativeText, type TextProps } from 'react-native';
import { fonts } from '~/lib/theme';

import { Text } from '../Text';

export function TransitLabel({
  html,
  placeName,
  ...props
}: TextProps & { html?: string | null; placeName?: boolean }) {
  const parts = displayTransitParts(html || '', placeName);
  return (
    <Text {...props}>
      {parts.map((part, i) => {
        return (
          <NativeText
            key={i}
            style={part.mnr ? { fontFamily: fonts.symbols, fontWeight: 'normal' } : undefined}
          >
            {part.text}
          </NativeText>
        );
      })}
    </Text>
  );
}
