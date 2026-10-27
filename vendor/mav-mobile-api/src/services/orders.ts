import type { Transport } from '../http.js';
import { requiredString, requireField, requireAnyField } from '../validation.js';
import type { OrderDetailsResponse, OrdersResponse, RequestOptions } from '../types.js';

export class OrdersService {
  constructor(private readonly http: Transport) {}

  async search(valid = true, options?: RequestOptions): Promise<OrdersResponse> {
    const response = await this.http.request<OrdersResponse>(
      'MegrendelesKereses',
      { Ervenyes: valid },
      options,
      true,
    );
    if (
      response.Megrendelesek == null &&
      Object.keys(response).every(
        (key) => key === 'Megrendelesek' || key === 'Uzenetek' || key === 'VanTobb',
      ) &&
      (response.VanTobb === undefined || response.VanTobb === false) &&
      (response.Uzenetek == null ||
        (Array.isArray(response.Uzenetek) && response.Uzenetek.length === 0))
    )
      return { ...response, Megrendelesek: [] };
    requireField(response, 'Megrendelesek', 'MegrendelesKereses', true);
    return response;
  }

  async details(orderId: string, options?: RequestOptions): Promise<OrderDetailsResponse> {
    const response = await this.http.request<OrderDetailsResponse>(
      'MegrendelesLekeres',
      {
        MegrendelesAzonosito: requiredString(orderId, 'orderId'),
      },
      options,
      true,
    );
    requireAnyField(
      response,
      ['Statusz', 'MegrendelesAllapot', 'BizonylatTechnikaiAzonosito'],
      'MegrendelesLekeres',
    );
    return response;
  }
}
