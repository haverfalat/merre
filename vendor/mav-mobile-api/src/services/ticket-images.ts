import { MavMobileError } from '../errors.js';
import type { Transport } from '../http.js';
import { requiredString, requireField } from '../validation.js';
import type { RequestOptions, TicketImagesResponse } from '../types.js';

export class TicketImagesService {
  constructor(private readonly http: Transport) {}

  async get(
    documentIds: readonly string[],
    options?: RequestOptions,
  ): Promise<TicketImagesResponse> {
    if (!documentIds.length)
      throw new MavMobileError('input', 'At least one document ID is required');
    const ids = [...new Set(documentIds.map((id) => requiredString(id, 'documentId')))];
    const response = await this.http.request<TicketImagesResponse>(
      'GetJegykep',
      { BizonylatAzonosito: ids },
      options,
      true,
    );
    requireField(response, 'Bizonylatok', 'GetJegykep', true);
    return response;
  }
}
