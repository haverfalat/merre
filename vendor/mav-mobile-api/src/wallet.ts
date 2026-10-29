import type { MavMobileClient } from './client.js';
import { MavMobileError } from './errors.js';
import { renderTicketImages } from './presentation.js';
import type {
  RequestOptions,
  TicketPresentation,
  WalletProduct,
  WalletSnapshot,
  PurchaseDetails,
  ServiceRequest,
} from './types.js';
import { normalizeOrders } from './wallet/normalize.js';
import { attachServiceBindings, matchesService } from './wallet/services.js';
import { epochMillis } from './validation.js';

export interface SnapshotOptions extends RequestOptions {
  includeInactive?: boolean;
  includeServices?: boolean;
  /** Publish current products before archive and service lookups finish. */
  onProducts?: (snapshot: WalletSnapshot) => void;
}

export class MavMobileWallet {
  private owner: string | null = null;
  private readonly detailsCache = new Map<
    string,
    { expiresAt: number; details: PurchaseDetails }
  >();
  constructor(readonly client: MavMobileClient) {}

  async snapshot(options: SnapshotOptions = {}): Promise<WalletSnapshot> {
    const owner = this.client.profile?.email.toLowerCase() ?? null;
    if (owner !== this.owner) {
      this.detailsCache.clear();
      this.owner = owner;
    }
    const current = await this.client.orders.search(true, options);
    if (!options.signal?.aborted) options.onProducts?.(normalizeOrders(current.Megrendelesek));
    const responses = [current];
    if (options.includeInactive) responses.push(await this.client.orders.search(false, options));
    const snapshot = normalizeOrders(responses.flatMap((response) => response.Megrendelesek));
    if (!options.signal?.aborted) options.onProducts?.(snapshot);
    if (!options.includeServices || !snapshot.tickets.length) return snapshot;
    try {
      const dates = snapshot.tickets
        .map((item) => epochMillis(item.order.VasarlasDatuma))
        .filter((value): value is number => value != null);
      const since = dates.length ? Math.min(...dates) - 86_400_000 : Date.now() - 31 * 86_400_000;
      const response = await this.client.purchases.search(
        {
          intervalStart: new Date(since).toISOString(),
          intervalEnd: new Date(Date.now() + 7_200_000).toISOString(),
          ticketType: '1',
        },
        options,
      );
      const purchases = response.previousPurchases.filter(
        (purchase) => purchase.seasonTicket !== true,
      );
      const details: PurchaseDetails[] = [];
      let failed = false;
      for (let offset = 0; offset < purchases.length; offset += 4) {
        const results = await Promise.allSettled(
          purchases.slice(offset, offset + 4).map(async (purchase) => {
            const cached = this.detailsCache.get(purchase.id);
            if (cached && cached.expiresAt > Date.now()) return cached.details;
            const response = await this.client.purchases.details(purchase.id, options);
            this.detailsCache.set(purchase.id, {
              expiresAt: Date.now() + 300_000,
              details: response.previousPurchaseDetails,
            });
            return response.previousPurchaseDetails;
          }),
        );
        for (const result of results) {
          if (result.status === 'fulfilled') details.push(result.value);
          else failed = true;
        }
      }
      return {
        ...attachServiceBindings(snapshot, details),
        serviceLookupStatus: failed ? 'partial' : 'complete',
      };
    } catch (error) {
      if (options.signal?.aborted) throw error;
      return { ...snapshot, serviceLookupStatus: 'failed' };
    }
  }

  async tickets(options?: SnapshotOptions): Promise<WalletProduct[]> {
    return (await this.snapshot(options)).tickets;
  }

  async passes(options?: SnapshotOptions): Promise<WalletProduct[]> {
    return (await this.snapshot(options)).passes;
  }

  async forService(request: ServiceRequest, options?: SnapshotOptions): Promise<WalletProduct[]> {
    const snapshot = await this.snapshot({ ...options, includeServices: true });
    return snapshot.tickets.filter((product) => matchesService(product, request));
  }

  async inspector(productId: string, options?: RequestOptions): Promise<TicketPresentation> {
    const snapshot = await this.snapshot({ ...options, includeInactive: true });
    const product = [...snapshot.tickets, ...snapshot.passes, ...snapshot.unclassified].find(
      (item) => item.id === productId,
    );
    if (!product?.canInspect || !product.documentId)
      throw new MavMobileError('unavailable', 'The MAV product cannot be presented');
    const response = await this.client.ticketImages.get([product.documentId], options);
    const validTo =
      product.status === 'VALID' && product.validTo ? Date.parse(product.validTo) : Infinity;
    const expiresAt = Math.min(
      validTo,
      this.client.profile?.session.expiresAt ?? Infinity,
      Date.now() + 600_000,
    );
    if (expiresAt <= Date.now())
      throw new MavMobileError('unavailable', 'The MAV presentation has expired');
    return {
      title: product.name,
      html: renderTicketImages(response.Bizonylatok, product.name),
      images: response.Bizonylatok,
      expiresAt,
    };
  }
}
