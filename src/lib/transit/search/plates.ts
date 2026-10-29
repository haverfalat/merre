/** Ignore case, spaces and separators in both stored and entered registration plates. */
export const normalizePlate = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const isPlateQuery = (value: string) => /^[A-Z]{3,4}\d{1,3}$/.test(normalizePlate(value));
