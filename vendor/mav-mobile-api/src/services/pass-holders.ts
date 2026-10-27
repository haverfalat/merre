import type { Transport } from '../http.js';
import { requiredString, requireField } from '../validation.js';
import type { PassHoldersResponse, RequestOptions } from '../types.js';

export class PassHoldersService {
  constructor(private readonly http: Transport) {}

  async get(personalizationId: string, options?: RequestOptions): Promise<PassHoldersResponse> {
    requiredString(personalizationId, 'personalizationId');
    const response = await this.http.request<PassHoldersResponse>(
      'BerletTokLekeres',
      { NevesitesAzonosito: personalizationId },
      options,
      true,
    );
    requireField(response, 'BerletTokok', 'BerletTokLekeres', true);
    return response;
  }
}
