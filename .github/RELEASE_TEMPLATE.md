## Melyik változatot töltsd le?

| Platform | Normál, OTA-képes | noOTA |
| --- | --- | --- |
| Android | `Merre.apk` | `Merre-noOTA.apk` |
| iPhone | `Merre-unsigned.ipa` | `Merre-noOTA-unsigned.ipa` |

**Normál:** az alkalmazás kompatibilis JavaScript-, felület- és képfrissítéseket tölthet le az EAS Update szolgáltatásból, új APK/IPA telepítése nélkül. Natív változtatásokhoz továbbra is új build kell.

**noOTA:** az OTA-frissítési modul nincs belefordítva az alkalmazásba. Nem tölt le és nem alkalmaz távoli appkód-frissítést; új verzióhoz kézzel kell telepíteni az új APK/IPA-t. A menetrendek, élő járműadatok és a többi online funkció ugyanúgy működik.

Az iPhone-os IPA-k aláíratlanok: telepítés előtt alá kell írni őket. Az OTA nem hosszabbítja meg az iOS-aláírás érvényességét. A normál és noOTA változat ugyanazt az alkalmazásazonosítót használja, így egymást váltják; nem két párhuzamos telepítésre készültek.
