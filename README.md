<p align="center">
  <img src="branding/banner.svg" alt="Merre" width="880" />
</p>

<p align="center">
  <img src="branding/icon.svg" alt="Merre ikon" width="80" height="80" />
</p>

<h1 align="center">Merre</h1>

<p align="center">Élő közlekedési térkép, mobilon és böngészőben.</p>

A Merre a magyar tömegközlekedésben segít: élő járműpozíciókat, megállói indulásokat és érkezéseket, menetrendeket és útvonalakat mutat egy helyen. Az adatokat jelenleg a MÁVPlusz (visszafejtett api-ja) szolgáltatja.

Eredetileg egy personal projektnek indult meg, hogy olyan funkciókat tudjak belerakni amit nem tud vagy a MÁVPlusz vagy a BudapestGO és megprobála a két app közötti különbséget egyesíteni.

## Publikus instance

A Merre egyetlen publikus instance-a a **[merre.bencica.hu](https://merre.bencica.hu)**

## Futtatás

```sh
git submodule update --init
npm ci
npm start
```

Mobilos előnézethez Expo Go használható. Böngészős indítás: `npm run web`.

Natív fejlesztői build: `npm run android` vagy `npm run ios`.

## Mobilos jegytárca

A térkép jegy gombja és a **Beállítások → Jegyek és bérletek** nyitja a csak iOS-en és Androidon elérhető jegytárcát. A **Fiókok** képernyőn több BudapestGO-fiókot lehet hozzáadni, elnevezni, exportálni és helyben eltávolítani. Az alapnézet valamennyi fiók érvényes jegyét közös listában mutatja. A lejárt és egyéb inaktív jegyek a fiókkezelésből, az adott fiók külön gombján érhetők el. Az újbóli belépés megtartja az adott fiók eszközazonosítóját, és ugyanazt a BudapestGO-felhasználót kéri. A session és az eszközazonosító fiókonként a rendszer biztonságos tárában marad; a jegyadatok lekérdezési kulcsa fiókonként elkülönül.

A PKCE-belépés a rendszer böngészőjében nyitja a hivatalos BKK-oldalt, az ott felkínált közösségi belépésekkel együtt. A jelszó nem kerül a Merre kódjához. A bejelentkezés végén a hivatalos visszairányítási URL-t helyben az app mezőjébe kell illeszteni. A visszairányítási URL belépési adat: ne oszd meg.

Importálható egy Merre-fiókexport, a wrapper `session.json` fájlja vagy egy `{ "installation": ..., "session": ... }` objektum. Az eredeti `applicationId` kötelező, külön mezőben is megadható. Import előtt a szolgáltató ellenőrzi a sessiont; hiányzó eszközazonosító helyett az app nem talál ki újat. Azonos BudapestGO-felhasználó és eszközazonosító újraimportálása frissíti a meglévő helyi fiókot. Más fiókot nem ír felül. Több fiók importálásakor az ellenőrzött fiókok egyenként mentődnek; ha egy következő session hibás, a sikeres importok megmaradnak, és a beviteli mezőben csak a hátralévő fiókok maradnak. Egy export egy vagy az összes fiókot tartalmazhat. Az exportált JSON nincs jelszóval titkosítva, belépési adatokat tartalmaz, és az eredeti eszközazonosítót is megőrzi. Csak saját, biztonságos helyen tárold. A megosztáshoz létrehozott gyorsítótári fájlt az app a megosztás után törli. Egy exportált session párhuzamos használatakor a szolgáltató tokenfrissítése érvénytelenítheti a korábbi másolatot.

Az érvényes és ehhez az eszközazonosítóhoz kötött jegyeknél elérhető az ellenőri Aztec-kód, a járművön vagy állomáson kihelyezett Aztec / QR beszállási kód kamerás beolvasása, valamint a közeli jármű vagy metróállomás kiválasztásából indított beszállási ábra. BKK-járat vagy jármű adatlapján is van jegybemutatás gomb. A járatszám önmagában nem beszállási kód: konkrét rendszámot vagy a szolgáltatótól lekért metróállomást választunk. A közeli nézet egy listában mutatja az 1 km-en belüli járműveket és az 500 méteren belüli metróbelépési pontokat. Engedélyezett helymeghatározásnál a saját helyzetet használja, egyébként a térkép közepét. Egy használható jegynél azonnal bemutatja, többnél egyszer választást kér, majd megjegyzi a választást. Hosszú nyomásra újra lehet jegyet választani. A teljes képernyős ábra az SDK renderelőjét, a szerver aktuális SVG-jét, óráját, terméknevét és díjkategóriáját használja. Lejárat után eltűnik, háttérben nem jelenik meg. A teljes natív képernyő pixelazonossága nincs készüléken igazolva.

A jelenlegi mobilos integráció nem helyez át jegyet másik eszközről és nem aktivál még felhasználásra váró jegyet. Ezek állapotát a listában jelzi. A már használt telepítési identitás sessionimporttal őrizhető meg.

A szolgáltatófüggetlen fióktár és interfészek a `src/lib/tickets`, a képernyők a `src/features/tickets`, a BudapestGO-adapter a `src/lib/budapestgo` alatt található. Új szolgáltatóhoz a `TicketProvider` szerződést kell megvalósítani és regisztrálni a `providers.native.ts` fájlban. A szolgáltató saját, tetszőleges adatstruktúrájú `payload`-ot tárolhat; az OAuth és az eszközazonosító nem közös követelmény. A bemutatási, közeli járatos és állomásos műveletek opcionálisak.

## BudapestGO SDK frissítése

Az SDK Git-submodule a `vendor/budapestgo-api` alatt, forrása: [haverfalat/budapestgo-api](https://github.com/haverfalat/budapestgo-api). Az app a Node-függőségektől mentes `budapestgo-api/mobile` belépési pontot használja helyi csomagfüggőségként.

```sh
git submodule update --init
npm ci
npm run budapestgo:sync
npm start -- --lan
```

Az `npm ci`, `npm start` és `npm run start:dev` szinkronizálja és lefordítja az SDK-t. A szinkron a GitHub `main` ágának legfrissebb elérhető változatára lép, ha a helyi SDK tiszta és nem tartalmaz eltérő commitot. Helyi módosítást vagy eltérő történetet megőriz. Hálózat nélkül a meglévő változatot használja. A közvetlen `npx expo start` előtt a szinkront külön kell futtatni. Új SDK-verzió rögzítéséhez a Merre repóban a submodule hivatkozását is commitolni kell.
