import type { Transport } from '../http.js';
import { requiredString, requireField } from '../validation.js';
import type { RequestOptions, TicketDetailsResponse } from '../types.js';

export class TicketDetailsService {
  constructor(private readonly http: Transport) {}

  async get(serialNumber: string, options?: RequestOptions): Promise<TicketDetailsResponse> {
    const response = await this.http.request<TicketDetailsResponse>(
      'GetJegyAdat',
      {
        JegySorszam: requiredString(serialNumber, 'serialNumber'),
      },
      options,
      true,
    );
    requireField(response, 'Jegyadatok', 'GetJegyAdat', true);
    return response;
  }
}
