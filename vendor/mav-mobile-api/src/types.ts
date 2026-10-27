export type Language = 'HU' | 'EN';
export type Fetch = typeof globalThis.fetch;
export type Timestamp = number | string;
export type ApiRecord = Record<string, unknown>;

export interface ApiMessage extends ApiRecord {
  ID?: string;
  Tipus?: string;
  Szoveg?: string;
}

export interface ApiResponse extends ApiRecord {
  Uzenetek?: ApiMessage[];
}

export interface RequestOptions {
  signal?: AbortSignal;
  language?: Language;
}

export interface Session {
  token: string;
  expiresAt: number | null;
}

export interface WebSession {
  provider: 'mav-web';
  email: string;
  userTokenXml: string;
  expiresAt?: number | null;
}

export interface AccountProfile {
  version: 1;
  provider: 'mav-mobile';
  email: string;
  uaid: string;
  session: Session;
}

export interface LoginResponse extends ApiResponse {
  Token: string;
  ErvenyessegVege: Timestamp;
}

export interface UserData extends ApiRecord {
  EmailCim?: string;
  VezetekNev?: string;
  KeresztNev?: string;
  RegAzonosito?: string;
}

export interface UserResponse extends ApiResponse {
  FelhasznaloAdat: UserData;
}

export interface PassHolderReference extends ApiRecord {
  HPTAzonosito?: string;
  NevesitesAzonosito?: string;
  VerzioSzam?: number;
}

export interface PassHolder extends PassHolderReference {
  Fenykep?: string;
  Allapot?: string;
  ErvenyessegVege?: Timestamp;
  Nev?: string;
  SzuletesiDatum?: Timestamp;
  KiegeszitoAdatLista?: ApiRecord[];
}

export interface PassHoldersResponse extends ApiResponse {
  BerletTokok: PassHolder[];
}

export interface PurchasedProduct extends ApiRecord {
  Nev?: string;
  Kedvezmeny?: string;
  ErvKezd?: Timestamp;
  ErvVeg?: Timestamp;
  SzolgaltatasAzonosito?: string;
  UtazasIranya?: string;
  Allapot?: string;
  Ar?: number;
  BerletJel?: boolean;
  SzolgaltatasAllapot?: string;
  TetelAzonosito?: string;
}

export interface OrderDocument extends ApiRecord {
  UtasNeve?: string;
  SzuletesiDatum?: Timestamp;
  Jegysorszam?: string;
  BizonylatAzonosito?: string;
  Jegyek?: PurchasedProduct[];
}

export interface Order extends ApiRecord {
  MegrendelesAzonosito?: string;
  VasarlasDatuma?: Timestamp;
  CsoportAzon?: string;
  BerletTok?: PassHolderReference;
  JegykepAdatok?: OrderDocument[];
  AtvetMod?: string;
}

export interface OrdersResponse extends ApiResponse {
  Megrendelesek: Order[];
  VanTobb?: boolean;
}

export interface OrderDetailsResponse extends ApiResponse {
  Statusz?: string;
  MegrendelesAllapot?: string;
  TranzakcioAzonosito?: string;
  BizonylatTechnikaiAzonosito?: string;
}

export interface TicketDetailsResponse extends ApiResponse {
  Jegyadatok: ApiRecord[];
  Szamla?: ApiRecord;
}

export interface PreviousPurchase extends ApiRecord {
  id: string;
  validFrom?: string;
  validTo?: string;
  startStation?: string;
  endStation?: string;
  seasonTicket?: boolean;
}

export interface PurchasesResponse extends ApiResponse {
  previousPurchases: PreviousPurchase[];
}

export interface ServiceJourney extends ApiRecord {
  induloAllomasKod?: string;
  celAllomasKod?: string;
  indulas?: string;
  erkezes?: string;
}

export interface PurchasedService extends ApiRecord {
  vonatSzam?: string;
  jeEszkozAlapId?: number;
  viszonylatJel?: { jel?: string | null };
  viszonylat?: ServiceJourney;
}

export interface PurchasedOffer extends ApiRecord {
  megrendelesTetelAzonosito?: string;
  berletJel?: boolean;
  vonatSzam?: PurchasedService;
}

export interface PurchaseDetails extends ApiRecord {
  trains?: PurchasedService[];
  ticketDatas?: {
    megrendelesJegysorszamai?: string[];
    szolgaltatasAjanlatok?: PurchasedOffer[];
  }[];
}

export interface PurchaseDetailsResponse extends ApiResponse {
  previousPurchaseDetails: PurchaseDetails;
}

export interface ServiceBinding {
  number: string;
  routeName: string | null;
  departureAt: string;
  arrivalAt: string;
  originId: string;
  destinationId: string;
}

export interface ServiceRequest {
  routeName: string;
  number?: string;
  serviceDay?: string;
  at?: number;
  originId?: string;
  destinationId?: string;
}

export interface TicketImage extends ApiRecord {
  BizonylatFajta?: string;
  BizonylatTechnikaiAzonosito?: string;
  Jegysorszam?: string;
  Jegykep?: string;
}

export interface TicketImagesResponse extends ApiResponse {
  Bizonylatok: TicketImage[];
}

export interface NewsItem extends ApiRecord {
  ID?: string;
  Cim?: string;
  Bevezeto?: string;
  Tartalom?: string;
  Datum?: Timestamp;
  Link?: string;
}

export interface NewsResponse extends ApiResponse {
  Hirek: NewsItem[];
}

export interface Notice extends ApiRecord {
  UzenetCim?: string;
  UzenetSzoveg?: string;
  LinkUrl?: string;
  LinkNev?: string;
}

export interface NoticesResponse extends ApiResponse {
  JeUzenetek: Notice[];
}

export interface StationRequest extends ApiRecord {
  AllomasID: string;
  Datum: number;
}

export interface StationResponse extends ApiResponse {
  AllomasID?: string;
  Menetrend: ApiRecord[];
  Szolgaltatasok?: ApiRecord[];
}

export interface JourneyRequest extends ApiRecord {
  IndAllomasID: string;
  CelAllomasID: string;
  Datum: number;
  IndulasiIdo: boolean;
  Utasok: ApiRecord[];
  Menupont: string;
}

export interface JourneyResponse extends ApiResponse {
  UtazasiAjanlatok: ApiRecord[];
  Ajanlatok?: ApiRecord[];
  AjanlatHashKulcs?: string;
}

export interface TrainsResponse extends ApiResponse {
  Vonatok: ApiRecord[];
}

export type ProductKind = 'ticket' | 'pass' | 'unknown';
export type ProductStatus = 'VALID' | 'FUTURE' | 'EXPIRED' | 'INVALID' | 'UNKNOWN';

export interface WalletProduct {
  id: string;
  kind: ProductKind;
  name: string;
  status: ProductStatus;
  validFrom: string | null;
  validTo: string | null;
  documentId: string | null;
  serialNumber: string | null;
  orderId: string | null;
  passengerName: string | null;
  canInspect: boolean;
  services: ServiceBinding[];
  product: PurchasedProduct;
  document: OrderDocument;
  order: Order;
}

export interface WalletSnapshot {
  tickets: WalletProduct[];
  passes: WalletProduct[];
  unclassified: WalletProduct[];
  orders: Order[];
  fetchedAt: string;
  serviceLookupStatus: 'not-requested' | 'complete' | 'partial' | 'failed';
}

export interface TicketPresentation {
  title: string;
  html: string;
  images: TicketImage[];
  expiresAt: number;
}
