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
npm ci
npm start
```

Mobilos előnézethez Expo Go használható. Böngészős indítás: `npm run web`.

Natív fejlesztői build: `npm run android` vagy `npm run ios`.
