# mav-mobile-api

TypeScript client for MÁV mobile accounts, purchased tickets, passes, original ticket images and service assignments. Works in Node and React Native without an Expo dependency.

[Magyar dokumentáció](README.md)

## Start

```ts
import { MavMobileClient, MavMobileWallet } from 'mav-mobile-api';

const client = new MavMobileClient();
await client.auth.login(email, password);
const wallet = new MavMobileWallet(client);
const { tickets, passes } = await wallet.snapshot();
```

Credentials come from your login form. Passwords are never persisted or included in account exports. Requests are not retried automatically.

The Merre application uses this package through `file:./vendor/mav-mobile-api`. The package has its own standard `build`, `prepare` and `typecheck` scripts. There is no application-side build helper.

## Separate tickets and passes

```ts
const snapshot = await wallet.snapshot({ includeInactive: true, includeServices: true });
snapshot.tickets;
snapshot.passes;
snapshot.unclassified;
```

Classification uses `BerletJel`. It is a non-nullable boolean in the official service contract, so an omitted value means `false` (ticket); `true` means pass. Unexpected values such as `null` remain unclassified. Product names are not used to infer the category.

Pass holders (`BerletTokok`) are passenger/identity records, not purchased passes. Purchased passes are products inside orders.

The server's `Ervenyes` filter does not guarantee current temporal validity. Paid but expired tickets can still appear under `true`. Normalization checks the product state, service state and validity interval, returning `VALID`, `FUTURE`, `EXPIRED`, `INVALID` or `UNKNOWN`.

`includeInactive` combines both filter values and deduplicates products by order, document and item ID. If an ID is missing, a response-local position is used as a fallback. Each item retains its original `product`, `document` and `order`; additional API fields are preserved.

## Service-specific tickets

`includeServices` reads the official web purchase details. Web purchase IDs and mobile order IDs are different. The client joins records using ticket serial numbers and item IDs, then matches departure/arrival stations and times.

Each product's `services` contains the actual service number, such as `7355/208`, route name, scheduled departure/arrival and station IDs. This information is not inferred through OCR or product names.

```ts
const tickets = await wallet.forService({
  routeName: '7355',
  number: '7355/208',
  serviceDay: '2026-10-26',
});
```

Only currently valid tickets are returned. Supply the service day with an exact service number, since numbers can repeat daily. The day is interpreted in Europe/Budapest. A route-only lookup also requires the requested time to fall between the purchased journey's departure and arrival. `at` is milliseconds since epoch and defaults to now.

`matchesService(product, request)` performs the same check on an existing item. It does not infer a pass's geographical coverage or offer an expired ticket.

`serviceLookupStatus` is `not-requested`, `complete`, `partial` or `failed`. Failure of web enrichment does not remove the basic ticket/pass lists. Purchase details are cached in memory for five minutes.

## Sessions and multiple accounts

```ts
const client = new MavMobileClient({
  profile: savedProfile,
  persist: async (profile) => saveSecurely(profile),
});
await client.auth.refresh();
await client.auth.logout();
```

Your application supplies secure persistence. Use one client per account. `auth.refresh()` explicitly calls `BejelentkezesHosszabbitas` while the existing session is valid. Expired sessions require another login. Logout clears local state; it does not call an invented server endpoint.

`exportAccountProfile(profile)` serializes the profile; `parseAccountProfile(input)` validates an object or JSON string. Exports contain credentials and must remain private. Imported profiles cannot override API endpoints.

### Google, Apple and Facebook

Authenticate on the official MÁV website. Never pass a social-provider password to this client.

```ts
await client.auth.importWebSession({ provider: 'mav-web', email, userTokenXml });
```

The official web client stores a Base64-encoded SAML XML token. The mobile API expects the decoded XML. The wrapper removes this encoding without modifying the token/signature, reads its expiry and validates both the session and account email through `GetFelhasznaloAdat` before persistence. Unknown expiry remains `null`; server acceptance remains authoritative.

`MAV_LOGIN_URL`, `MAV_WEB_ORIGIN` and `MAV_SESSION_BRIDGE` support native web login. The bridge only reads MÁV's own session on its exact official origin. It does not collect passwords, cart contents or other websites' storage. The application verifies the message origin and dismisses its login UI only after server validation. Social providers' browser/popup restrictions still apply; the bridge does not bypass them.

## UAID and timestamps

Every mobile POST includes `UAID` and `Nyelv`. `DEFAULT_UAID` comes from the linked API documentation and can be overridden. It is not presented as a BudapestGO-style installation/device ID. These lookup operations do not implement device activation or ticket transfers.

Numeric mobile API timestamps are Unix seconds. Profile `expiresAt` and request `at` use milliseconds. Normalized validity values are UTC ISO strings. `epochMillis()` also understands WCF `/Date(...)/` and ISO timestamps.

## Original images

```ts
await client.ticketImages.get([documentId]);
const presentation = await wallet.inspector(productId);
```

`documentId` is `BizonylatAzonosito`, not an order, item or web purchase ID. All returned PNG pages are retained. `ticketImageDataUri()` exposes an original image; `renderTicketImages()` builds self-contained HTML. No barcode or animation is generated.

`inspector()` reloads your product, including historical purchases, and opens the original MÁV ticket image. Expired, future and other product states are supported when the server provides an image; their status and validity remain unchanged. The local view expires within ten minutes or at the known session expiry. Currently valid products are also capped by their own expiry.

## Methods

| Method                                                          | Endpoint                                |
| --------------------------------------------------------------- | --------------------------------------- |
| `auth.login(email, password)`                                   | `Bejelentkezes`                         |
| `auth.refresh()`                                                | `BejelentkezesHosszabbitas`             |
| `account.get()`                                                 | `GetFelhasznaloAdat`                    |
| `orders.search(valid)`                                          | `MegrendelesKereses`                    |
| `orders.details(orderId)`                                       | `MegrendelesLekeres`                    |
| `passHolders.get(personalizationId)`                            | `BerletTokLekeres`                      |
| `ticketImages.get(documentIds)`                                 | `GetJegykep`                            |
| `ticketDetails.get(serialNumber)`                               | `GetJegyAdat`                           |
| `travel.station({ AllomasID, Datum })`                          | `GetAllomasInfo`                        |
| `travel.news(newsId?)`                                          | `GetHirek`                              |
| `travel.notices()`                                              | `GetJeUzenet`                           |
| `travel.journeys(request)`                                      | `GetUtazasiAjanlat`                     |
| `travel.trainList()`                                            | `GetVonatLista`                         |
| `travel.trains()`                                               | `GetVonatok`                            |
| `purchases.search({ intervalStart, intervalEnd, ticketType? })` | `ProfileApi/GetPreviousPurchases`       |
| `purchases.details(purchaseId)`                                 | `ProfileApi/GetPreviousPurchaseDetails` |

Journey requests preserve the server's field names and additional search fields. No discount or purchase is selected automatically. Request options accept `signal` and `language: 'HU' | 'EN'`. Default timeout is 25 seconds. Constructor options can replace `fetch`, `endpoints` and `webBaseUrl`.

## Errors

An error-free `{}` response or an omitted or `null` order collection is normalized to `Megrendelesek: []`. `MavMobileError` exposes `code`, `operation`, `status` and structured server `messages`. HTTP 200 responses containing only an error message list are not interpreted as empty wallets. Codes: `input`, `auth`, `expired-session`, `network`, `timeout`, `aborted`, `http`, `api`, `protocol`, `busy`, `unavailable`. The client does not log passwords, tokens or request bodies.

## Sources

- [Mobile API documentation](https://nzx.hu/mav-api/)
- [Official mobile service contract](https://vim.mav-start.hu/VIM/PR/20250529/MobileServiceS.svc?singleWsdl)
- [Official MÁV login](https://jegy.mav.hu/bejelentkezes)

The package covers account/ticket/pass retrieval and presentation, plus the public lookups in the linked documentation. It does not purchase, refund, delete accounts or transfer products between devices.
