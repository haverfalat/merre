import type { Transport } from '../http.js';
import { requiredString, requireField } from '../validation.js';
import type {
  ApiRecord,
  PurchaseDetailsResponse,
  PurchasesResponse,
  RequestOptions,
} from '../types.js';

export interface PurchaseSearch {
  intervalStart: string;
  intervalEnd: string;
  ticketType?: '0' | '1' | '2';
}

export class PurchasesService {
  constructor(private readonly http: Transport) {}

  async search(input: PurchaseSearch, options?: RequestOptions): Promise<PurchasesResponse> {
    requiredString(input.intervalStart, 'intervalStart');
    requiredString(input.intervalEnd, 'intervalEnd');
    const response = await this.http.webRequest<PurchasesResponse>(
      'GetPreviousPurchases',
      {
        ...input,
        ticketType: input.ticketType ?? '0',
      } as ApiRecord,
      options,
    );
    requireField(response, 'previousPurchases', 'GetPreviousPurchases', true);
    return response;
  }

  async details(purchaseId: string, options?: RequestOptions): Promise<PurchaseDetailsResponse> {
    const response = await this.http.webRequest<PurchaseDetailsResponse>(
      'GetPreviousPurchaseDetails',
      {
        id: requiredString(purchaseId, 'purchaseId'),
      },
      options,
    );
    requireField(response, 'previousPurchaseDetails', 'GetPreviousPurchaseDetails', false);
    return response;
  }
}
