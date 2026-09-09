# Stijlgids — welke maat hoort waar

De app bestaat voor een groot deel uit **dezelfde soort knop met een andere
tekst**. Als die dan net niet dezelfde maat heeft, valt dat op zonder dat je
kunt aanwijzen waarom. Dit bestand legt per soort vast wat de maat is, zodat
een nieuwe knop niet opnieuw hoeft te worden uitgevonden.

Gemeten op 2026-09-07 met `getComputedStyle` op 375px en 1400px. Staat er
hieronder iets anders dan in de code, dan is de code leidend en dit bestand
achterhaald — meet opnieuw voor je iets aanpast (zie onderaan).

Voor de mobiele afwegingen (waarom 44px, waarom zes trappen) zie
[`mobile.md`](mobile.md). Voor het *waarom* per beslissing:
[`decisions.md`](decisions.md).

---

## 1. De tokens

Alles hangt aan deze zes typografische trappen plus drie maatvoeringen. Wie
een token gebruikt schaalt vanzelf mee; wie een los px-getal neerzet begint de
wildgroei opnieuw.

| Token | Desktop | Mobiel | Waarvoor |
|---|---|---|---|
| `--fs-micro` | 10,5px | **11,5px** | labels in kapitalen, badges, tellers |
| `--fs-klein` | 12px | **13px** | menu-items, meta-regels, chips, bijregels |
| `--fs-basis` | 13px | **15px** | invoervelden, kaarttitels, lijstitems |
| `--fs-groot` | 15px | **17px** | subkoppen |
| `--fs-kop` | 18px | **20px** | moduletitels, hero-koppen |
| `--fs-cijfer` | 22px | **22px** | KPI-cijfers en bedragen |
| `--tap` | 36px | **44px** | raakvlak: hoogte/breedte van iets aantikbaars |
| `--icoon` | 16px | **20px** | de tekening ín zo'n raakvlak |
| `--sp-1…6` | 4 / 8 / 12 / 16 / 24 / 32px | idem | tussenruimte |

### Het lettertype van een getal

**Alle** getallen — bedragen, uren, datums, tellers, percentages, badges —
staan in `var(--font-cijfer)`, en dat is de huisstijl-tekst. Uitlijnen doet
`font-variant-numeric: tabular-nums`; daar is geen apart lettertype voor nodig,
en de schrijfmachineletter is fors breder (een tabel van acht kolommen liep
erop vast).

`var(--font-mono)` is er nog, maar alleen voor wat écht code is: een codeblok
in een notitie, een toets in de sneltoetsenlijst, het pincodeveld. Zet je een
getal in `--font-mono`, dan valt het uit de toon met de rest van de app.

`--fs-micro` is de ondergrens. Niets in beeld is kleiner. `validate.mjs`
waarschuwt bij een nieuwe `font-size` onder 11,5px in de mobiele laag.

---

## 2. Knoppen

### Icoonknop — één regel voor alle

Elke knop die **alleen een icoon** draagt heeft dezelfde vorm. Ze staan samen
in één CSS-regel in de mobiele laag, zodat er geen zevende maat kan ontstaan:

```css
.cl2-filterbtn, .cl2-filterwis.zichtbaar,
#urenFilterBtn, #facFilterBtn,
#urenMenuBtn,   #facMenuBtn,
.client-filter-info, #mod-notes .notes-groep-mob {
  width: var(--tap); height: var(--tap);
  padding: 0; background: transparent; border: 0; box-shadow: none;
}
```

| | |
|---|---|
| raakvlak | `var(--tap)` in het vierkant |
| icoon | `var(--icoon)`, svg met `class="icoon"` |
| rand / vulling / schaduw | geen |
| kleur | `var(--text)`, of `var(--mint)` als er iets aanstaat |
| aan-staat | mint + een stip van 7px rechtsboven |
| uit-staat | `disabled`, `opacity: .35`, geen cursor — niet weghalen: een knop die er soms wel en soms niet is, is geen knop |

> **Let op `box-shadow`.** `.uren-btn` draagt er een van 1px. Met alleen
> `border: 0` tekent die alsnog een randje — in het lichte thema zichtbaar als
> een kader. Deze fout is twee keer gemaakt; vandaar die ene gedeelde regel.

Nieuwe icoonknop? Zet je selector **erbij** in die regel. Niet een eigen blok.

### Knop met tekst

| Klasse | Mobiel | Desktop | Waarvoor |
|---|---|---|---|
| `.btn` | 14px / 500 · min 44px | 13px | standaardknop in een modaal |
| `.btn-sm` | 14px / 500 · min 40px | 12px | knop in een voet of kop |
| `.btn-xs` | 14px / 600 | 11px | knop in een kaart of lijstrij |
| `.uren-btn` | 12,5px / 600 · h 36px | 12,5px | balkknop in Uren en Facturen |
| `.btn-primary` / `.uren-btn-primary` | idem + mint | idem | de knop die de handeling dóét |

> Op een telefoon vallen die eerste drie samen op **14px**: de mobiele laag
> zet `.btn` op 14px en `.btn-sm` op 13px, allebei met `!important` en dezelfde
> specificiteit — en een knop met béíde klassen krijgt dan de laatste regel in
> het bestand. Wie op mobiel echt een kleinere knop wil, doet dat niet met
> `.btn-sm` maar met een eigen regel op zijn eigen selector.

Eén primaire knop per scherm. De rest is secundair; wat zelden gebeurt en niet
terug te draaien is (verwijderen) krijgt `danger` en staat apart.

### Ronde knop (FAB)

56×56 rechtsonder, `right: 17px`, `bottom: 80px` + safe-area, glyph 26px.
Alleen op mobiel; op een bureaublad staat dezelfde actie als knop in de balk.

---

## 3. Menu's en dropdowns

**Alle menu-items zijn 13px op mobiel** (`var(--fs-klein)`), met een raakvlak
van `var(--tap)`. Dat geldt voor het ⋯-menu van Uren, Facturen, de Checklist,
Notities én het menu per taak. Een menu-item is geen kaarttitel: het is een
regel om aan te tikken, en die hoort de maat van een meta-regel te hebben.

| | |
|---|---|
| tekst | `var(--fs-klein)` |
| regelhoogte | ≥ `var(--tap)` |
| vulling | `9–10px` horizontaal en verticaal |
| actieve keuze | vet, met een ✓ ervoor |
| scheiding | 1px `var(--border)`, `margin: 5px 0` |
| gevaarlijke actie | `var(--danger)`, onder een scheiding |

**Waar het menu hangt.** Bij een knop in een balk mag het menu in de knop-
wrapper zitten (`position: absolute`). Bij een knop in een **kaart of lijstrij**
hoort het aan `document.body` — een kaart is klein en staat in een lijst die
schuift, dus daarbinnen wordt het menu afgeknipt. `urenPlacePopover(pop, knop)`
zet het onder de knop en klapt het naar boven als daar geen ruimte is.

---

## 4. Kaarten

### KPI-kaart

Eén blok, twee namen: `.uren-kpi` (Uren, Facturen) en `.fac-aging-cel`
(Debiteuren). Ze delen één set regels.

| | |
|---|---|
| label | `var(--fs-micro)`, 600, `.06em`, kapitalen, `var(--text-muted)` |
| waarde | `var(--fs-cijfer)`, 600, mono |
| bijregel | `var(--fs-klein)` — **verborgen op mobiel** |
| streepje links | 3px in de kleur van de rubriek |
| maat op 375px | 169 × 65px, twee per regel |

### Taakkaart (Checklist)

| | |
|---|---|
| titel | 13,5px / 600 |
| meta-regel | 11px |
| voortgang subtaken | ring van 11px ín de meta-regel, baan `--surface2`, vulling `--mint` — alleen bij een taak mét subtaken, en nergens anders op de kaart |
| acties | mobiel achter één ⋯ rechts naast de titel; desktop een rij icoontjes |

### Lijstkaart op mobiel — `.uren-mcard` en `.fac-mcard`

Eén vorm, twee namen. Twee kolommen: **links** waar het over gaat, **rechts**
het getal met de status eronder.

| | |
|---|---|
| doos | `--surface`, `0.5px var(--border)`, `radius-md`, vulling `10px 13px`, streepje van 3px links in de klantkleur |
| links, regel 1 | klantnaam — `var(--fs-klein)` / 600, kleurblokje van 9px ervoor, één regel met `…` |
| links, regel 2 | meta (`nummer · datum`) — `var(--fs-micro)`, `--text-muted`, tabular |
| links, regel 3 | omschrijving of betreft — `var(--fs-micro)`, `--text-muted`, één regel met `…` |
| links, regel 4 | tijdregel (verstuurd/vervalt) — `var(--fs-micro)` / 500, kleur uit de vervaltermijn |
| rechts, regel 1 | het getal — `var(--fs-basis)` / 600, tabular |
| rechts, regel 2 | bijgetal (excl. btw) — `var(--fs-micro)`, muted |
| rechts, regel 3 | statuspil — `var(--fs-micro)` |

Alles wat niet in die zeven plekken past hoort er niet op. Twee regels over
dezelfde datum worden één regel met een `·` ertussen.

---

## 5. Pillen en chips

Alles wat een status of een label draagt: `var(--fs-micro)`, gewicht 600,
kapitalen waar het een categorie is, afgeronde hoek `999px`.

| | |
|---|---|
| prioriteit (`.cl2-pri`) | micro / 600, achtergrond + tekstkleur uit `CL_PRIORITY_CFG` |
| klant (`.cl2-client-tag`, `.cf-dot`) | micro / 600, kleur uit `CLIENT_COLORS` |
| factuurstatus (`.fac-pill`) | micro / 600 — op een gekleurde kopbalk een lichtere variant, anders donker-op-donker |

---

## 6. Invoervelden

| | Mobiel | Desktop |
|---|---|---|
| tekstveld | `var(--fs-basis)` (15px) | 12,5–13px |
| hoogte | ≥ `var(--tap)` | 32–36px |
| rand | `0.5px solid var(--border-strong)` | idem |
| focus | randkleur `var(--mint)` + `box-shadow` mint-soft | idem |

16px of groter op iOS voorkomt dat Safari inzoomt bij focus; daarom staat het
zoekveld daar op 16px (`.ios-tab`).

### Klant kiezen

Een klant kiezen in een formulier gaat met `.klantkies`: een gekleurd stipje
plus een `<select>`, in dezelfde doos als het invoerveld ernaast (`--surface2`,
`0.5px var(--border-strong)`, minimaal `var(--tap)` hoog, tekst 15px). Zo staat
het in het urenvenster; de facturen-editor doet hetzelfde met een kale
`<select class="fac-ed-inp">`.

**Geen rij chips.** Wat uit een lijst komt die met de administratie meegroeit —
klanten, bedrijven, sjablonen — hoort in een uitklaplijst. Chips blijven waar
het aantal vaststaat: de drie statussen, de vier snelknoppen bij Uren.

Een `input[type="date"]` heeft een eigen voorkeursbreedte die per browser
verschilt — in Safari ruimer dan in Chrome. Altijd begrenzen met
`width: 100%; min-width: 0; max-width: 100%`, anders rekt hij zijn kolom op.

---

## 7. Modals

| | |
|---|---|
| kopbalk | `var(--hero-gradient)`, witte tekst, van rand tot rand |
| titel | 18px / 700 |
| ondertitel | 12px, `rgba(255,255,255,0.72)` |
| sluitkruis | icoonknop, ín de kopbalk, 9px van de rechterrand — alleen mobiel |
| voet | knoppen groeien mee; past het niet, dan zakt de hoofdknop naar een eigen volle regel |
| voetknop | ≥ `var(--tap)` hoog |
| breedte | 640 (formulier) · 720 (lijst) · **1000** (factuureditor) |

> **Breedte is geen smaak.** De factuureditor staat op 1000px omdat er een
> regeltabel van zes kolommen in zit én een voet met acht knoppen; op 900
> kapte de btw-kolom af en zakte de laatste knop naar een tweede regel. Een
> modaal met alleen een formulier heeft dat niet nodig en blijft 640 of 720.

> **De kop ís de band.** Die gekleurde balk wordt getekend door
> `.modal h3:first-child`. Zet je daar iets vóór, dan matcht de selector niet
> meer en valt de hele band weg. In de kop **appenden**, nooit ervoor.

---

## 8. De vaste plekken op een telefoon

| | Waar | Maat |
|---|---|---|
| ⋯-menu | rechtsboven op de lijn van de moduletitel (`top: 4px` + safe-area, `right: 12px`) | 44×44 |
| filter | rechts in de balk eronder, in dezelfde kolom als het ⋯ | 44×44 |
| ronde + | rechtsonder boven de tabbalk | 56×56 |
| ✕ sluiten | in de kopbalk van een modaal, rechts | 44×44 |

---

## 9. Bekende afwijkingen

Gemeten en bewust (nog) niet rechtgezet. Ze staan hier zodat ze niet opnieuw
"ontdekt" hoeven te worden — en zodat duidelijk is dat het geen voorbeeld is
om te volgen.

| Onderdeel | Wat er staat | Wat het zou moeten zijn |
|---|---|---|
| `.client-filter-btn` | 12px op mobiel | `var(--fs-klein)` = 13px |
| `.notes-ovf-item` | 12px op desktop (volgt het token) | 13px, zoals de andere menu's die het hardcoderen |
| `.cl2-item-title` | 13,5px | `var(--fs-basis)` |
| `.cl2-item-meta` | 11px | `var(--fs-micro)` — dit valt onder de ondergrens |
| `.cl2-hero-eyebrow` | 11,5px mobiel / 13px desktop | mobiel hoort niet kleiner te zijn dan desktop |
| menu-gewichten | 400, 500 en 600 door elkaar | één gewicht kiezen |
| `.btn` / `.btn-sm` / `.btn-xs` | alle drie 14px op mobiel | drie trappen, of twee klassen minder |

Wie hier iets aanpakt: doe het per familie, meet ervoor en erna, en zet een
regel in `decisions.md`.

---

## 10. Hoe je dit controleert

Niet op het oog — deze CSS zit vol `!important` en de generieke input-regel
weegt zwaarder dan een losse class. Meet in de browser:

1. Start de preview (`.claude/launch.json`, poort 8765).
2. Render de app in een iframe van 375px op een hulppagina (`_shot.html`,
   staat in `.gitignore`) en lees `getComputedStyle` uit met headless Chrome
   plus `--dump-dom`.
3. Vergelijk 375px en 1400px in één tabel, zoals hierboven.

Zie [`mobile.md`](mobile.md) voor de details van die werkwijze, en het geheugen
van de agent voor de seed-gegevens.

## 11. Grafieken

Twee tokens, en verder de gewone tekst- en maattokens:

| Token | Licht | Donker | Waarvoor |
|---|---|---|---|
| `--gr-nu` | `#0E8F73` | `#12A583` | de periode die je bekijkt |
| `--gr-vorig` | `#98A2AE` | `#63718A` | de periode ervoor, als achtergrond |
| `--gr-raster` | 7% zwart | 10% wit | rasterlijnen, haarlijn en solide |

De regels die daarbij horen:

- **Twee reeksen is nadruk, geen categorie.** Huidige periode in kleur, de
  vorige in grijs. Nooit twee even harde kleuren naast elkaar voor "nu" en
  "toen" — dan moet de lezer eerst een legenda uit zijn hoofd leren.
- **Een ranglijst krijgt één kleur.** Kleur per klant doet over wat de lengte
  van de balk al zegt, en kost het enige vrije kanaal dat je hebt.
- **Nooit twee y-assen.** Twee grootheden = twee grafieken.
- Balk maximaal 24px dik, ronde bovenkant (4px) en vierkante voet; lijn 2px;
  eindpunt minimaal 8px met een ring in de vlakkleur; raster een haarlijn,
  nooit gestreept.
- **Een cijfer bij elke reeks is te veel.** Label één reeks (de huidige), of
  alleen het eindpunt. De rest staat in de tooltip en in de tabelweergave.
- **Het raakvlak is de hele baan, niet de balk.** Op negen pixels mikken lukt
  met een duim niet; de baan is ook wat de toets bereikt (`tabindex`).
- **Elke grafiek heeft een tabelweergave.** Kleur mag nooit de enige drager
  van een waarde zijn.

Een nieuwe kleurencombinatie eerst door de validator halen (zie de
dataviz-richtlijn): ΔE ≥ 15 bij normaal zicht, ≥ 8 bij kleurenblindheid.

---

---

## 12. Meldingsblok

Eén blok (`.fac-btw-let`) met drie toestanden. De tint en de rand links
dragen het signaal; de tekst blijft `var(--text)`, want een statuskleur op
zijn eigen tint haalt de leesbaarheid niet (`--warning` op `--warning-bg` is
2,3:1). Het icoon krijgt de kleur wél — één gekleurd teken valt op zonder dat
er iets onleesbaar wordt.

| Toestand | Klasse | Rand + tint | Icoon |
|---|---|---|---|
| let op (standaard) | — | `--warning` | geen |
| gelukt | `.let-gelukt` | `--success` | vinkje |
| mislukt | `.let-fout` | `--danger` | uitroepteken |

| | |
|---|---|
| tekst | 12,5px / 1,55 |
| kop | `<b>`, eigen regel, `var(--text)` |
| rand | 3px links, verder geen rand |
| icoon | `1em` — het staat in een tekstregel en schaalt daarmee mee; `--icoon` is de maat voor een icoon in een raakvlak, niet hierin |

> **Een geslaagde handeling hoort niet als waarschuwing te lezen.** Tot
> 2026-09-09 droeg "Ingelezen uit X.pdf" dezelfde amberkleur als de
> btw-waarschuwing eronder, en stonden de rode varianten als
> `border-left-color` in een style-attribuut. Nieuwe melding? Kies een
> toestand, schrijf geen kleur in de markup.
