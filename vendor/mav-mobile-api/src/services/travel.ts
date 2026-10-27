import type { Transport } from '../http.js';
import { requireField } from '../validation.js';
import type {
  JourneyRequest,
  JourneyResponse,
  NewsResponse,
  NoticesResponse,
  RequestOptions,
  StationRequest,
  StationResponse,
  TrainsResponse,
} from '../types.js';

export class TravelService {
  constructor(private readonly http: Transport) {}

  async station(input: StationRequest, options?: RequestOptions): Promise<StationResponse> {
    const response = await this.http.request<StationResponse>('GetAllomasInfo', input, options);
    requireField(response, 'Menetrend', 'GetAllomasInfo', true);
    return response;
  }

  async news(newsId?: string, options?: RequestOptions): Promise<NewsResponse> {
    const response = await this.http.request<NewsResponse>(
      'GetHirek',
      newsId == null ? {} : { HirID: newsId },
      options,
    );
    requireField(response, 'Hirek', 'GetHirek', true);
    return response;
  }

  async notices(options?: RequestOptions): Promise<NoticesResponse> {
    const response = await this.http.request<NoticesResponse>('GetJeUzenet', {}, options);
    requireField(response, 'JeUzenetek', 'GetJeUzenet', true);
    return response;
  }

  async journeys(input: JourneyRequest, options?: RequestOptions): Promise<JourneyResponse> {
    const response = await this.http.request<JourneyResponse>('GetUtazasiAjanlat', input, options);
    requireField(response, 'UtazasiAjanlatok', 'GetUtazasiAjanlat', true);
    return response;
  }

  async trainList(options?: RequestOptions): Promise<TrainsResponse> {
    const response = await this.http.request<TrainsResponse>('GetVonatLista', {}, options);
    requireField(response, 'Vonatok', 'GetVonatLista', true);
    return response;
  }

  async trains(options?: RequestOptions): Promise<TrainsResponse> {
    const response = await this.http.request<TrainsResponse>('GetVonatok', {}, options);
    requireField(response, 'Vonatok', 'GetVonatok', true);
    return response;
  }
}
