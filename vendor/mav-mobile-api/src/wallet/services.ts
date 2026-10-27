import { epochMillis } from '../validation.js';
import type {
  PurchasedService,
  PurchaseDetails,
  ServiceBinding,
  ServiceRequest,
  WalletProduct,
  WalletSnapshot,
} from '../types.js';

function binding(service: PurchasedService): ServiceBinding | null {
  const journey = service.viszonylat;
  const departure = epochMillis(journey?.indulas);
  const arrival = epochMillis(journey?.erkezes);
  if (
    typeof service.vonatSzam !== 'string' ||
    !service.vonatSzam ||
    typeof journey?.induloAllomasKod !== 'string' ||
    !journey.induloAllomasKod ||
    typeof journey.celAllomasKod !== 'string' ||
    !journey.celAllomasKod ||
    departure == null ||
    arrival == null ||
    arrival < departure
  )
    return null;
  return {
    number: service.vonatSzam,
    routeName: typeof service.viszonylatJel?.jel === 'string' ? service.viszonylatJel.jel : null,
    departureAt: new Date(departure).toISOString(),
    arrivalAt: new Date(arrival).toISOString(),
    originId: journey.induloAllomasKod,
    destinationId: journey.celAllomasKod,
  };
}

function servicesFor(product: WalletProduct, details: PurchaseDetails[]): ServiceBinding[] {
  const matches = new Map<string, ServiceBinding>();
  const itemId = product.product.TetelAzonosito;
  if (!itemId || !product.serialNumber) return [];
  for (const purchase of details)
    for (const document of purchase.ticketDatas ?? []) {
      if (!document.megrendelesJegysorszamai?.includes(product.serialNumber)) continue;
      for (const offer of document.szolgaltatasAjanlatok ?? []) {
        if (offer.megrendelesTetelAzonosito !== itemId) continue;
        const direct = offer.vonatSzam ? binding(offer.vonatSzam) : null;
        const candidates = direct
          ? [direct]
          : (purchase.trains ?? [])
              .filter((service) => {
                const expected = offer.vonatSzam?.viszonylat;
                const actual = service.viszonylat;
                return (
                  !!expected &&
                  !!actual &&
                  ['induloAllomasKod', 'celAllomasKod', 'indulas', 'erkezes'].every(
                    (field) =>
                      typeof expected[field] === 'string' &&
                      expected[field] !== '' &&
                      expected[field] === actual[field],
                  )
                );
              })
              .map(binding)
              .filter((value): value is ServiceBinding => value != null);
        for (const service of candidates)
          matches.set(
            JSON.stringify([
              service.number,
              service.departureAt,
              service.originId,
              service.destinationId,
            ]),
            service,
          );
      }
    }
  return [...matches.values()];
}

export function attachServiceBindings(
  snapshot: WalletSnapshot,
  details: PurchaseDetails[],
): WalletSnapshot {
  return {
    ...snapshot,
    tickets: snapshot.tickets.map((product) => ({
      ...product,
      services: servicesFor(product, details),
    })),
  };
}

export function matchesService(
  product: Pick<WalletProduct, 'kind' | 'status' | 'validFrom' | 'validTo' | 'services'>,
  request: ServiceRequest,
): boolean {
  if (product.kind !== 'ticket' || product.status !== 'VALID') return false;
  const at = request.at ?? Date.now();
  const start = product.validFrom ? Date.parse(product.validFrom) : null;
  const end = product.validTo ? Date.parse(product.validTo) : null;
  if (start == null || end == null || !Number.isFinite(at) || at < start || at > end) return false;
  return product.services.some((service) => {
    if (
      request.number ? service.number !== request.number : service.routeName !== request.routeName
    )
      return false;
    if (request.originId && request.originId !== service.originId) return false;
    if (request.destinationId && request.destinationId !== service.destinationId) return false;
    if (request.number && request.serviceDay) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Budapest',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date(service.departureAt));
      const date = ['year', 'month', 'day']
        .map((key) => parts.find((part) => part.type === key)?.value ?? '')
        .join('');
      return date === request.serviceDay.replaceAll('-', '');
    }
    return at >= Date.parse(service.departureAt) && at <= Date.parse(service.arrivalAt);
  });
}
