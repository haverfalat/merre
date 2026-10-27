import { MavMobileError } from '../errors.js';
import { epochMillis, isRecord } from '../validation.js';
import type {
  Order,
  ProductStatus,
  PurchasedProduct,
  WalletProduct,
  WalletSnapshot,
} from '../types.js';

function normalizedState(value: unknown): string {
  return typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    : '';
}

function productStatus(product: PurchasedProduct, now: number): ProductStatus {
  const state = normalizedState(product.Allapot);
  const serviceState = normalizedState(product.SzolgaltatasAllapot);
  if (
    [state, serviceState].some((value) =>
      /visszavalt|torolt|ervenytelen|sztorno|visszaterit/.test(value),
    )
  )
    return 'INVALID';
  const start = epochMillis(product.ErvKezd);
  const end = epochMillis(product.ErvVeg);
  if (start != null && end != null && start > end) return 'UNKNOWN';
  if (end != null && now > end) return 'EXPIRED';
  if (!['kifizetett', 'atadott', 'aktiv', 'ervenyes'].includes(state)) return 'UNKNOWN';
  if (start != null && start > now) return 'FUTURE';
  return start != null && end != null ? 'VALID' : 'UNKNOWN';
}

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null);
const iso = (value: unknown) => {
  const epoch = epochMillis(value);
  return epoch == null ? null : new Date(epoch).toISOString();
};

export function normalizeOrders(orders: Order[], now = Date.now()): WalletSnapshot {
  const products = new Map<string, WalletProduct>();
  for (const [orderIndex, order] of orders.entries()) {
    if (order.JegykepAdatok != null && !Array.isArray(order.JegykepAdatok))
      throw new MavMobileError('protocol', 'Invalid MAV order documents');
    for (const [documentIndex, document] of (order.JegykepAdatok ?? []).entries()) {
      if (!isRecord(document) || (document.Jegyek != null && !Array.isArray(document.Jegyek)))
        throw new MavMobileError('protocol', 'Invalid MAV order document');
      for (const [productIndex, product] of (document.Jegyek ?? []).entries()) {
        if (!isRecord(product)) throw new MavMobileError('protocol', 'Invalid MAV product');
        const orderId = text(order.MegrendelesAzonosito);
        const documentId = text(document.BizonylatAzonosito);
        const serialNumber = text(document.Jegysorszam);
        const id = JSON.stringify([
          orderId ?? `order-${orderIndex}`,
          documentId ?? serialNumber ?? `document-${documentIndex}`,
          text(product.TetelAzonosito) ?? `product-${productIndex}`,
        ]);
        if (products.has(id)) continue;
        const status = productStatus(product, now);
        products.set(id, {
          id,
          kind:
            product.BerletJel === true
              ? 'pass'
              : product.BerletJel === false || product.BerletJel === undefined
                ? 'ticket'
                : 'unknown',
          name: text(product.Nev) ?? '',
          status,
          validFrom: iso(product.ErvKezd),
          validTo: iso(product.ErvVeg),
          documentId,
          serialNumber,
          orderId,
          passengerName: text(document.UtasNeve),
          canInspect: documentId != null,
          services: [],
          product,
          document,
          order,
        });
      }
    }
  }
  const items = [...products.values()];
  return {
    tickets: items.filter((item) => item.kind === 'ticket'),
    passes: items.filter((item) => item.kind === 'pass'),
    unclassified: items.filter((item) => item.kind === 'unknown'),
    orders,
    fetchedAt: new Date(now).toISOString(),
    serviceLookupStatus: 'not-requested',
  };
}
