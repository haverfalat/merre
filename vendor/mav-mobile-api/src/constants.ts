export const DEFAULT_UAID = '2Juija1mabqr24Blkx1qkXxJ105j';
export const PRODUCTION_ENDPOINTS = {
  public: 'https://vim.mav-start.hu/VIM/PR/20250529/MobileService.svc/rest/',
  secure: 'https://vim.mav-start.hu/VIM/PR/20250529/MobileServiceS.svc/rest/',
} as const;

export const OPERATIONS = {
  Bejelentkezes: 'secure',
  BejelentkezesHosszabbitas: 'secure',
  GetFelhasznaloAdat: 'secure',
  BerletTokLekeres: 'secure',
  MegrendelesKereses: 'secure',
  GetJegykep: 'secure',
  GetJegyAdat: 'secure',
  MegrendelesLekeres: 'secure',
  GetAllomasInfo: 'public',
  GetHirek: 'public',
  GetJeUzenet: 'public',
  GetUtazasiAjanlat: 'public',
  GetVonatLista: 'public',
  GetVonatok: 'public',
} as const;

export const WEB_API_URL = 'https://jegy-a.mav.hu/IK_API_PROD/';
export type LegacyOperation = keyof typeof OPERATIONS;
export type WebOperation = 'GetPreviousPurchases' | 'GetPreviousPurchaseDetails';
export type Operation = LegacyOperation | WebOperation;
