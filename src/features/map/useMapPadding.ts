import { useMemo } from 'react';
import type { TransitMapProps } from './TransitMap.types';

export interface MapPadding {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export function useMapPadding({
  topInset = 0,
  leftInset,
  rightInset = 0,
  bottomInset,
}: Pick<TransitMapProps, 'topInset' | 'leftInset' | 'rightInset' | 'bottomInset'>): MapPadding {
  return useMemo(
    () => ({
      top: topInset + 90,
      left: leftInset + 24,
      right: rightInset + 24,
      bottom: bottomInset + 24,
    }),
    [leftInset, bottomInset, topInset, rightInset],
  );
}
