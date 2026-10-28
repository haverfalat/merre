import { createContext, useContext } from 'react';

export const DensityContext = createContext<'regular' | 'compact'>('regular');
export const useDensity = () => useContext(DensityContext);
