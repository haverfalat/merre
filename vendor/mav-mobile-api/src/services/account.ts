import type { Transport } from '../http.js';
import { requireField } from '../validation.js';
import type { RequestOptions, UserResponse } from '../types.js';

export class AccountService {
  constructor(private readonly http: Transport) {}

  async get(options?: RequestOptions): Promise<UserResponse> {
    const response = await this.http.request<UserResponse>('GetFelhasznaloAdat', {}, options, true);
    requireField(response, 'FelhasznaloAdat', 'GetFelhasznaloAdat', false);
    return response;
  }
}
