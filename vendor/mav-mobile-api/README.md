# mav-mobile-api

TypeScript wrapper a MÁV mobilos API-jához. Belépés, session, megvett jegyek, bérletek, eredeti jegyképek és a jegyhez tartozó konkrét járat adatai. Node-ban és React Native-ban is használható; a csomag nem függ az Expótól.

[English documentation](README.en.md)

## Használat

```ts
import { MavMobileClient, MavMobileWallet } from 'mav-mobile-api';

const client = new MavMobileClient();
await client.auth.login(email, password);

const wallet = new MavMobileWallet(client);
const { tickets, passes } = await wallet.snapshot();
```

Az `email` és `password` a belépőűrlapról jön. A kliens a jelszót nem tárolja, nem exportálja, és nem próbálkozik vele újra automatikusan.

Ez helyi csomag a `vendor/mav-mobile-api` mappában. A Merre `file:` függőségként használja. A csomag saját `prepare` lépése fordítja a TypeScriptet; nincs hozzá külön appoldali build script.

```sh
npm run build --prefix vendor/mav-mobile-api
npm run typecheck --prefix vendor/mav-mobile-api
```

## Jegyek és bérletek

```ts
const snapshot = await wallet.snapshot({
  includeInactive: true,
  includeServices: true,
});

snapshot.tickets;
snapshot.passes;
snapshot.unclassified;
```

A `tickets` menetjegyeket, a `passes` bérleteket tartalmaz. A besorolás a `BerletJel` mező alapján történik. A MÁV szerződésében ez nem nullable boolean: a kihagyott érték alapértelmezetten `false`, vagyis jegy. A `true` bérletet jelent. Váratlan, például `null` jelölésnél a termék az `unclassified` listába kerül; a neve alapján nem találgatunk.

A `BerletTokLekeres` bérlettokokat, utas- és igazolványadatokat ad vissza. Ez nem a megvásárolt bérletek listája. A tényleges bérletek a megrendelésekben vannak.

Az alacsony szintű `orders.search(true)` az `Ervenyes: true` szűrőt küldi. Ez önmagában nem bizonyítja, hogy a termék időben is érvényes: a szerver lejárt, kifizetett jegyet is visszaadhat. A wrapper külön ellenőrzi az `ErvKezd`, `ErvVeg`, `Allapot` és `SzolgaltatasAllapot` értékeket. A normalizált állapot `VALID`, `FUTURE`, `EXPIRED`, `INVALID` vagy `UNKNOWN`.

Az `includeInactive` a `true` és `false` szűrővel kapott megrendeléseket is feldolgozza. Az ismétlődő termékeket megrendelés, bizonylat és jegytétel alapján szűri ki. Ha a szerver nem ad azonosítót, az adott válaszon belüli pozíció lesz a helyi tartalékazonosító.

A normalizált termék az eredeti `product`, `document` és `order` objektumot is megtartja. A nem ismert szervermezők nem vesznek el.

## Melyik járathoz tartozik a jegy?

Az `includeServices` a hivatalos webes vásárlásrészleteket is lekéri. A mobilos és webes vásárlási azonosító nem felcserélhető: a wrapper a jegysorszámot és a jegytétel azonosítóját kapcsolja össze, majd egyezteti az indulási/érkezési állomást és időt.

Az eredmény termékenként a `services` listában van: konkrét menetszám, például `7355/208`, vonalszám, indulás, érkezés és állomásazonosítók. A járatszámot nem képfelismeréssel vagy a termék nevéből állítjuk elő.

```ts
const applicable = await wallet.forService({
  routeName: '7355',
  number: '7355/208',
  serviceDay: '2026-10-26',
});
```

Ez csak jelenleg érvényes menetjegyet ad vissza. A konkrét menetszám mellett a közlekedési napot is érdemes megadni, mert a menetszám naponta ismétlődhet. A közlekedési napot Budapest időzónájában egyeztetjük. Ha csak vonalszámot adsz, a kért időpontnak a megvásárolt út indulása és érkezése közé is kell esnie. Az `at` milliszekundumos időbélyeg, alapértelmezetten a jelenlegi idő.

A `matchesService(product, request)` ugyanez az egyeztetés egy már betöltött termékre. A bérlet területi érvényességét nem következteti ki a névből, és nem ajánl fel lejárt jegyet.

A `serviceLookupStatus` jelzi, hogy az extra lekérés `not-requested`, `complete`, `partial` vagy `failed`. Ha a webes rész nem érhető el, az alap jegy- és bérletlista megmarad. A részletek öt percig csak memóriában vannak gyorsítótárazva.

## Belépés és session

```ts
const client = new MavMobileClient({
  profile: savedProfile,
  persist: async (profile) => saveSecurely(profile),
});

await client.auth.refresh();
await client.auth.logout();
```

A `persist` függvényt az alkalmazás adja: mobilon titkosított tárba, Node-ban megfelelően védett helyi fájlba menthet. A kijelentkezés helyi törlés; nincs hozzá kitalált szerveroldali logout végpont. Az explicit `refresh()` a hivatalos `BejelentkezesHosszabbitas` műveletet hívja, még érvényes sessionnel. Lejárt sessionnél új belépés szükséges. Nincs háttérben tárolt jelszó vagy automatikus újrabejelentkezés.

```ts
import { exportAccountProfile, parseAccountProfile } from 'mav-mobile-api';

const json = exportAccountProfile(client.profile!);
const restored = parseAccountProfile(json);
```

A profil tartalmazza a fiók e-mail-címét, a sessiont és a `uaid` értéket. Több fiókhoz külön kliens/példány kell. Az export belépésre használható adatot tartalmaz.

### Google, Apple és Facebook

A közösségi belépés a hivatalos `https://jegy.mav.hu/bejelentkezes` felületén történik. A wrapper nem kér Google-, Apple- vagy Facebook-jelszót.

```ts
await client.auth.importWebSession({
  provider: 'mav-web',
  email,
  userTokenXml,
});
```

A `userTokenXml` a hivatalos webes sessionből származik. A weboldal Base64-kódolt SAML XML-t tárol; a mobil API a kibontott XML-t kéri. A wrapper csak a burkolást bontja le, a tokent és az aláírást nem módosítja. A SAML lejáratát kiolvassa, majd a MÁV `GetFelhasznaloAdat` végpontjával ellenőrzi a sessiont és a tulajdonos e-mail-címét, mielőtt mentené. Ha a lejárat nincs megadva a tokenben vagy az importban, `null` marad, és a szerver dönt az elfogadásáról.

A `MAV_LOGIN_URL`, `MAV_WEB_ORIGIN` és `MAV_SESSION_BRIDGE` segíti a mobilos webes belépést. A bridge kizárólag a hivatalos MÁV-origin saját sessionadatait küldi az alkalmazásnak; nem olvas jelszómezőt, kosarat vagy más webhely tárhelyét. Az alkalmazás feladata az origin ellenőrzése és a belépő bezárása a szerver által ellenőrzött siker után. A közösségi szolgáltatók saját böngésző- és popupkorlátozásait a bridge nem kerüli meg; ezeket a mobilos belépőfelületnek kezelnie kell.

## UAID, eszköz és időpontok

Minden mobilos POST törzsében benne van a `UAID` és a `Nyelv`. A `DEFAULT_UAID` a hivatkozott mobilos API dokumentációjának értéke; a kliensben felülírható. A wrapper nem nevezi át `deviceId`-ra, és nem állítja, hogy ez BudapestGO-szerű telepítésazonosító. Nincs eszközáthelyezés vagy eszközönkénti aktiválás implementálva ezekből a lekérdezésekből.

A mobil API numerikus időpontjai Unix-másodpercek. A profil `expiresAt` mezője és a `ServiceRequest.at` milliszekundumos. A normalizált érvényesség ISO-formátumú UTC-időpont. Az `epochMillis()` a másodperceket, az ISO-időpontokat és a WCF `/Date(...)/` formátumát kezeli.

## Eredeti jegykép

```ts
const response = await client.ticketImages.get([documentId]);
const presentation = await wallet.inspector(productId);
```

A `documentId` a `BizonylatAzonosito`, nem a jegytétel vagy a webes vásárlás azonosítója. Egy bizonylathoz több PNG is érkezhet; mindegyiket megőrizzük. A `ticketImageDataUri()` a szervertől kapott PNG-t, a `renderTicketImages()` ezekből önálló HTML-t ad. Nem generál új vonalkódot vagy animációt.

Az `inspector()` frissen lekéri a saját terméket, a korábbi vásárlások között is, majd megnyitja a MÁV eredeti jegyképét. Lejárt, később érvényes és más állapotú jegyhez vagy bérlethez is használható, ha a szerver ad hozzá képet. Ettől a termék állapota és érvényessége nem változik. A helyi megtekintés legfeljebb tíz percig vagy az ismert session lejáratáig él; érvényes terméknél a termék lejárata is korlátozza.

## API-felület

| Metódus                                                         | Végpont                                 | Adat                          |
| --------------------------------------------------------------- | --------------------------------------- | ----------------------------- |
| `auth.login(email, password)`                                   | `Bejelentkezes`                         | Session                       |
| `auth.refresh()`                                                | `BejelentkezesHosszabbitas`             | Session hosszabbítása         |
| `account.get()`                                                 | `GetFelhasznaloAdat`                    | Saját fiók                    |
| `orders.search(valid)`                                          | `MegrendelesKereses`                    | Megrendelések és termékek     |
| `orders.details(orderId)`                                       | `MegrendelesLekeres`                    | Megrendelés állapota          |
| `passHolders.get(personalizationId)`                            | `BerletTokLekeres`                      | Bérlettok                     |
| `ticketImages.get(documentIds)`                                 | `GetJegykep`                            | Eredeti PNG-k                 |
| `ticketDetails.get(serialNumber)`                               | `GetJegyAdat`                           | Jegytétel részletei           |
| `travel.station({ AllomasID, Datum })`                          | `GetAllomasInfo`                        | Állomási menetrend            |
| `travel.news(newsId?)`                                          | `GetHirek`                              | Hírek                         |
| `travel.notices()`                                              | `GetJeUzenet`                           | Tájékoztatók                  |
| `travel.journeys(request)`                                      | `GetUtazasiAjanlat`                     | Utazási ajánlatok             |
| `travel.trainList()`                                            | `GetVonatLista`                         | Vonatlista                    |
| `travel.trains()`                                               | `GetVonatok`                            | Vonatok és pozíciók           |
| `purchases.search({ intervalStart, intervalEnd, ticketType? })` | `ProfileApi/GetPreviousPurchases`       | Webes vásárláslista           |
| `purchases.details(purchaseId)`                                 | `ProfileApi/GetPreviousPurchaseDetails` | Webes járat- és jegyrészletek |

Az utazási ajánlatok kérésének szerveroldali mezőnevei megmaradnak. A `JourneyRequest` kötelező mezői típusozottak, a további keresési feltételek változtatás nélkül átadhatók. Nincs automatikusan választott kedvezmény vagy vásárlási művelet.

Minden metódus utolsó opciója fogad `signal` és `language: 'HU' | 'EN'` értéket. A kliens alapnyelve `HU`, a timeout 25 másodperc. A `fetch` és az HTTPS-végpontok cserélhetők a konstruktorban; importált fiók nem írhatja felül őket.

## Hibák

```ts
import { MavMobileError } from 'mav-mobile-api';

try {
  await client.account.get();
} catch (error) {
  if (error instanceof MavMobileError) {
    console.log(error.code, error.operation, error.status);
  }
}
```

A hibajelzés nélküli `{}` válasz, illetve a hiányzó vagy `null` megrendeléslista üres `Megrendelesek: []` listaként jön vissza. A HTTP 200-as, de csak `Uzenetek` hibalistát tartalmazó válasz nem lesz üres jegylista. A hiba `messages` mezője megtartja a szerver üzeneteit és azonosítóit. A lehetséges kódok: `input`, `auth`, `expired-session`, `network`, `timeout`, `aborted`, `http`, `api`, `protocol`, `busy`, `unavailable`. A wrapper nem naplóz kéréstörzset, tokent vagy jelszót, és nem próbálja újra automatikusan a sikertelen kérést.

## Források

- [Mobilos API dokumentáció](https://nzx.hu/mav-api/)
- [Éles mobilos szolgáltatás szerződése](https://vim.mav-start.hu/VIM/PR/20250529/MobileServiceS.svc?singleWsdl)
- [Hivatalos MÁV-belépő](https://jegy.mav.hu/bejelentkezes)

A csomag a jegy- és bérletlekéréshez, belépéshez és bemutatáshoz szükséges műveleteket, valamint a linkelt dokumentáció nyilvános lekérdezéseit kezeli. Jegyvásárlást, visszatérítést, fióktörlést és eszközáthelyezést nem indít.
