<p align="center">
  <img src="branding/banner.svg" alt="Merre" width="880" />
</p>

<p align="center">Élő közlekedési térkép és jegytárca, egy appban.</p>

A Merre a magyar tömegközlekedéshez készült. Megnézheted, merre jár a buszod vagy a vonatod, mikor indul a következő járat, és milyen megállókon megy végig. Mobilon a BKK/BudapestGO- és MÁV-jegyeidet, bérleteidet is egy helyen eléred.

Saját projektként indult: az volt a cél, hogy a MÁVPlusz és a BudapestGO hasznos dolgai egy helyre kerüljenek, pár olyan funkcióval együtt, ami nekem hiányzott belőlük.

## Kipróbálom

**[Merre megnyitása böngészőben: merre.bencica.hu](https://merre.bencica.hu)**

A térkép böngészőben és mobilon is használható. A jegytárca az iOS- és Android-appban érhető el.

## Mit tud?

- Élő járműpozíciók, járatkövetés és késések.
- Megállói indulások és érkezések.
- Járatok, irányok, menetszámok, megállók és menetrend szerinti menetidők.
- BKK/BudapestGO- és MÁV-jegyek, bérletek megtekintése és bemutatása mobilon.
- Több fiók kezelése, fiókimport és -export.

## Jegyek és bérletek mobilon

A jegytárcát a térképen lévő jegyikonból vagy a beállításokból nyithatod meg. A fiókikonnál hozzáadhatsz BudapestGO- és MÁV-fiókokat, akár többet is. A hivatalos belépőoldalon lépsz be, siker után az app magától visszatér a tárcába.

Az érvényes jegyek rögtön látszanak. A lejárt és egyéb jegyeket a fiókkezelésből tudod megnyitni.

### BKK / BudapestGO

- Jegy vagy bérlet felmutatása az ellenőrnek Aztec-kóddal.
- A járművön vagy metróbejáratnál lévő Aztec/QR-kód beolvasása, majd az animált ábra megjelenítése.
- Közeli jármű vagy metróbelépés kiválasztása ugyanahhoz a bemutatáshoz.
- Jegy elővétele a kiválasztott BKK-járatnál lévő jegyikonból is.

**Belépés után a jegyet vagy bérletet még át kell hoznod a Merre-be.** Ehhez az **Áthozás ide** gombot használd. A BudapestGO eszközhöz köti a jegyeket, így ez ugyanazon a telefonon is szükséges. Áthozás után a korábbi appban már nem használható; az áthelyezések száma korlátos, ezért előtte az app rákérdez. (Ez az app bár lehetővé teszi az egy bérlet több telefonon használatát, ha kiexportalod es importálod más telefonra amin a Merre fut :) )

Ha egy használható jegyed van, rögtön azt veszi elő. Többnél megjegyzi a választásodat; hosszú nyomással válthatsz másikra.

### MÁV

A MÁV-fiókodban a **Jegyek** és a **Bérletek** külön jelennek meg. Megnyitáskor a MÁV eredeti jegyképét látod. A lejárt és egyéb jegyeknél, bérleteknél is van **Megnyitás** gomb, így a korábbiakat is visszanézheted.

Ha egy konkrét menethez van érvényes jegyed, a járatnál lévő jegyikonból is előveheted.

## Tervben

- [ ] BKK- és MÁV-jegyek, bérletek vásárlása közvetlenül a Merre-ben.

## Fejlesztőknek

<details>
<summary>Futtatás, adatforrások és API-dokumentáció</summary>

### Futtatás

Expo / React Native és TypeScript. A támogatott Node-verziókat a [package.json](package.json) tartalmazza.

```sh
git clone --recurse-submodules https://github.com/haverfalat/merre.git
cd merre
npm ci
npm start
```

Meglévő klónnál a submodule inicializálása: `git submodule update --init`.

- Expo Go: `npm start`.
- Böngésző: `npm run web`.
- Saját fejlesztői kliens: `npm run start:dev`.
- Natív buildekhez az EAS-profilok az [eas.json](eas.json) fájlban vannak.
- Ellenőrzés: `npm run typecheck` és `npm run lint`.

### Adatforrások és felépítés

A térképes és menetrendi adatokat jelenleg a MÁVPlusz API-ja szolgáltatja. A közlekedési szolgáltatók közös felülete a `src/lib/transit`, a jegyszolgáltatóké a `src/lib/tickets` alatt található. A tárca közös képernyői és komponensei a `src/features/tickets` mappában vannak.

| Integráció                  | Helye és dokumentációja                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| MÁVPlusz közlekedési adatok | `src/lib/mavplusz`                                                                                                                                   |
| BudapestGO                  | [`vendor/budapestgo-api`](vendor/budapestgo-api/README.md), Git-submodule: [haverfalat/budapestgo-api](https://github.com/haverfalat/budapestgo-api) |
| MÁV-jegyek és bérletek      | [`vendor/mav-mobile-api`](vendor/mav-mobile-api/README.md), helyi TypeScript-csomag                                                                  |

A wrapperek README-je tartalmazza a részletes API-leírást, a belépés és sessionkezelés működését, illetve a BudapestGO eszközazonosítójának kezelését.

### Wrapperfejlesztés

Az `npm start` és az `npm run start:dev` szinkronizálja és lefordítja a BudapestGO-wrappert. Külön is futtatható; a helyi módosításaidat nem írja felül:

```sh
npm run budapestgo:sync
```

A helyi MÁV-wrapper módosítása után:

```sh
npm run build --prefix vendor/mav-mobile-api
```

### GitHubos mobilbuild és release

A **Mobile build** workflow közvetlenül GitHub Actionsön készít APK-t és iPhone-ra való, aláíratlan IPA-t. Androidon Ubuntu-, iOS-en macOS-runneren fut; nem használ EAS build szervert. Kézzel is elindíthatod az Actions fülön, release nélkül. A fájlok a futás artifactjai közé kerülnek.

Új kiadásnál a GitHub Releases felületén válassz taget, majd **Save draft**. A **Build draft releases** figyelő ötpercenként keresi az új draftokat; az Actions fülön kézzel is indítható. A GitHub az időzített futást késleltetheti. Ha az APK és az IPA is elkészül, mindkettőt feltölti a release-hez, és automatikusan publikálja. Hibánál draft marad; a sikertelen build az Actions fülön újraindítható, nem próbálkozik végtelenül magától.

Az APK állandó kulccsal van aláírva. Az IPA aláíratlan, telepítés előtt saját aláírás szükséges. A taget a build előtt rögzíti; a build a kiválasztott commitból és az abban rögzített BudapestGO-submodule-verzióból készül, akkor is, ha közben új commit kerül a `main` ágra.

Másik repóban két GitHub Actions secret kell az APK-hoz: `ANDROID_SIGNING_KEY_BASE64` (PKCS #8 DER privát kulcs) és `ANDROID_SIGNING_CERT_BASE64` (X.509 PEM tanúsítvány), mindkettő base64-kódolva. Az opcionális `NTFY_TOPIC` repository variable a build végi értesítések témája. A build nem igényel Expo- vagy Apple-belépési adatot.

</details>
