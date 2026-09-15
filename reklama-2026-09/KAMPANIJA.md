# Squadoo — pirmoji Meta kampanija

Paruošta 2026-09-15. Viskas, ko reikia, kad kampaniją būtų galima suvesti per kelias minutes.

Vaizdai šiame aplanke: `futbolas-1x1.png`, `krepsinis-1x1.png` (Feed),
`futbolas-9x16.png` (Stories / Reels).

---

## Strategija vienu sakiniu

Pirma **organizatoriai**, ne žaidėjai. Produkcijoje šiuo metu nulis žaidimų
(`api.squadoo.app/public/cities` → `total: 0`), tad žaidėjui atėjus nėra prie ko jungtis.
Organizatoriui tuščias sąrašas nėra kliūtis — jis ateina **sukurti**. Vienas organizatorius
atsiveda visą komandą, ir tik tada žaidėjų reklama turi prasmės.

---

## Kampanijos nustatymai

| | |
|---|---|
| Tikslas | **Traffic** (srautas) |
| Šalis | Lietuva |
| Amžius | 18–45 |
| Kalba | lietuvių |
| Pomėgiai | futbolas, krepšinis, mėgėjų sportas, sporto salės |
| Biudžetas | **tavo sprendimas** — testui paprastai užtenka 5–10 €/d. |

**Ne „App installs".** Tokiai kampanijai Meta reikalauja programėlės su prijungtu SDK.
SDK 2026-09-15 sąmoningai išimtas iš kodo, tad šis tipas neprieinamas — ir dabar nereikalingas.

## Vienas adresas, ne du

Iš pradžių buvo dvi reklamų grupės — Android ir iOS atskirai, nes parduotuvių adresai
skirtingi. Nuo 2026-09-15 to nebereikia: visi skelbimai veda į **squadoo.app**, o svetainė
pati atpažįsta telefoną ir pasiūlo teisingą parduotuvę.

```
https://squadoo.app/?utm_source=facebook&utm_medium=paid&utm_campaign=organizatoriai
```

Kampanijos žymė nedingsta: svetainė ją perduoda toliau — į Play per `referrer`, į App Store
per `ct`. Tad ataskaitos veikia taip pat, nors kelyje ir atsirado sustojimas.

**Dviejų reklamų grupių nebereikia.** Palikus dvi, biudžetą tarp platformų dalini ranka, o
Meta pati optimizuoti nebegali. Tai beveik visada kainuoja, o ne padeda.

---

## Tekstai — organizatoriams

### A variantas (tiesioginis)

**Antraštė:** Surink komandą per 20 sekundžių
**Pagrindinis tekstas:**
> Nebeieškok, kas šįvakar žais. Paskelbk žaidimą Squadoo — aikštelė, laikas, kiek vietų — ir
> žmonės prisijungs patys. Be susirašinėjimų grupėse, be „kas eina?" dvidešimt kartų.
**Mygtukas:** Atsisiųsti

### B variantas (per skausmą)

**Antraštė:** Penki žmonės. Trys grupės. Nulis žaidimų.
**Pagrindinis tekstas:**
> Pažįstama? Paskelbk žaidimą vietoj to, kad derintum. Squadoo parodo, kas ateina, ir užpildo
> likusias vietas už tave.
**Mygtukas:** Atsisiųsti

### C variantas (trumpas, Stories)

**Antraštė:** Tavo aikštelė laukia
**Pagrindinis tekstas:**
> Paskelbk žaidimą. Komanda susirinks pati.
**Mygtukas:** Atsisiųsti

---

## Tekstai — žaidėjams (VĖLIAU)

Naudoti tik tada, kai mieste bus bent keliolika žaidimų per savaitę. Anksčiau — pinigų
deginimas, nes žmogus atidarys tuščią sąrašą.

**Antraštė:** Rask žaidimą šalia
**Pagrindinis tekstas:**
> Pamatyk, kas žaidžia netoliese, kas jau prisijungė, ir įsirašyk per 20 sekundžių.

---

## Skelbimo sukūrimas ranka — veikia ŠIANDIEN

Ads Manager'yje matai **Campaigns** ir **Ad sets**, bet **Ads** tuščia. Taip ir yra: skelbimai
per API nesukurti, nes Meta programėlė „Litchidev Page Manager" tebėra *Development* būsenoje,
o tokiai ji atsisako kurti skelbimo turinį (`adcreative`).

**Bet ranka per Ads Manager tai pavyksta**, nes naršyklės sąsaja eina ne per tą programėlę.
Tad jungiklio laukti nebūtina.

### Kur dingo nuotrauka

Ji niekur nedingo — tik guli ne ten, kur žiūrėjai. Per API įkelti vaizdai patenka į
**paskyros vaizdų biblioteką**, o ne į kampaniją:

> Ads Manager → **All tools** → **Media library** (Vaizdų biblioteka)

Kol nė vienas skelbimas jos nenaudoja, nuotrauka Campaigns / Ad sets / Ads skiltyse
nepasirodys **iš principo** — tos skiltys rodo skelbimus, ne failus.

Jei bibliotekoje jos nerastum, paprasčiausias kelias — įkelti iš naujo iš šio aplanko.
Failai vietoje ir teisingų proporcijų (patikrinta):

| Failas | Dydis |
|---|---|
| `app-1x1.png` | 1080×1080 |
| `app-9x16.png` | 1080×1920 |

### Arba per API — vienu paleidimu

`meta-skelbimas.mjs` šiame aplanke padaro tą patį automatiškai. Raktas paduodamas per
aplinkos kintamąjį ir **niekur neįrašomas**:

```powershell
$env:FB_TOKEN = "<prieigos raktas>"; node meta-skelbimas.mjs tikrink
```

`tikrink` nieko nekeičia — parodo kampaniją, grupes, skelbimus ir vaizdų biblioteką. Pirmiausia
paleisk jį: iš jo iškart matysis, ar nuotrauka bibliotekoje, ir kiek grupių iš tikro yra.

Kai vaizdas patvirtintas:

```powershell
node meta-skelbimas.mjs kurk
```

Sukuria turinį ir **sustabdytą** skelbimą. Nerasdamas vaizdo, įkelia `app-1x1.png` iš naujo pats.
Jei Meta atmes dėl programėlės būsenos, klaidą atspausdins pažodžiui — tada matysis, ar
*Development* tikrai yra priežastis, ar buvo kas kita.

```powershell
node meta-skelbimas.mjs sutrauk
```

Sustabdo nebereikalingas antrąsias grupes, palikdamas vieną.

API versija parenkama savaime (patikrinta: **v24.0** gyva), bet `FB_API` ją perrašo.

---

### Žingsniai

1. Ads Manager → kampanija `organizatoriai` → reklamų grupė → **Create ad**
2. **Format:** Single image
3. **Media:** `app-1x1.png` (Stories/Reels vietoms pridėk `app-9x16.png`)
4. **Primary text:** `Aikštelė, laikas, kiek vietų — ir žmonės prisijungia patys. Be „kas eina?" dvidešimt kartų grupėje.`
5. **Headline:** `Paskelbk žaidimą. Komanda susirinks pati.`
6. **Description:** `Nemokama · Squadoo`
7. **Call to action:** `Download`
8. **Website URL:**
   `https://squadoo.app/?utm_source=facebook&utm_medium=paid&utm_campaign=organizatoriai`
9. Palik **sustabdytą** (`Off`), kol nenuspręsi biudžeto ir datos.

Tie patys laukai mašinai skaitomu pavidalu — `spec-skelbimas.json` šiame aplanke.

---

## Ko NEDARYTI

**Nepradėk nuo žaidėjų reklamos.** Tai dažniausia marketplace klaida: atvedi paklausą į tuščią
pasiūlą, žmonės pamato tuščią ekraną ir nebegrįžta. Antrą kartą tų pačių žmonių jau
nebepritrauksi — o sumokėta už juos jau bus.

**Nenaudok vaizdų su tekstu.** Meta tekstą rodo atskirai, o vaizde jis tik mažina pasiekiamumą.
Šie trys vaizdai sąmoningai be jokių raidžių.

---

## Ką matysi po savaitės

**Play Console → Statistika → Įsigijimai → Įdiegimai pagal šaltinį** — įdiegimai pagal
`utm_campaign`. Tai vienintelis skaičius, kuris pirmą savaitę ką nors reiškia.

Ko **nematysi**: kiek žmonių užsiregistravo ir kiek sukūrė žaidimą. Tam reikia SDK, o jis
išimtas. Kai srauto bus tiek, kad tas skirtumas rūpėtų, grąžinsim — kelias aprašytas
`squadoo-app/docs/reklamai-pasiruosimas.md`.

---

## Vaizdai šiame aplanke

| Failas | Dydis | Kur |
|---|---|---|
| `app-1x1.png` | 1080×1080 | Feed — **pagrindinis** |
| `app-9x16.png` | 1080×1920 | Stories / Reels |
| `futbolas-1x1.png` | 1024×1024 | atsarginis, nuotrauka |
| `krepsinis-1x1.png` | 1024×1024 | atsarginis, nuotrauka |
| `futbolas-9x16.png` | 768×1344 | atsarginis, vertikali nuotrauka |

**Pradėk nuo `app-*`.** Programėlės reklamoje pati sąsaja parduoda geriau nei nuotrauka: žmogus
iškart mato, ką gaus. Nuotraukas laikyk A/B testui — Meta pati parodys, kuri veikia.

Telefone rodomas **tikras** maketas iš `squadoo.app` su tikrais programėlės tekstais, ne piešinys.

## Kaip perdaryti tekstą

Nereikia nieko piešti iš naujo. `ad-1x1.html` ir `ad-9x16.html` yra paprasti puslapiai —
pakeitus `<h1>` ir `<p>` ir paleidus:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1080,1080 --screenshot="app-1x1.png" --virtual-time-budget=6000 "file:///C:/Litchidev/brand/reklama-2026-09/ad-1x1.html"
```

gaunamas naujas kadras. Vertikaliam — `--window-size=1080,1920` ir `ad-9x16.html`.

Telefono maketas ir jo stiliai (`phone.html`, `phone.css`) išimti iš `squadoo-site/index.html`,
tad atnaujinus svetainę juos verta išsiimti iš naujo, kad sąsaja reklamoje neatsiliktų.
