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
Een pagina met een ronde + houdt onderaan **96px** vrij (Facturen, Dashboard),
anders ligt de knop ook doorgescrold over de laatste kaart.

Op het Dashboard is de + een keuzemenu (`.ha-newitem-menu`): **één regel per
optie** (titel 13px/600, geen onderregel), icoon 30×30 in een eigen tint per
soort, menu 264px breed.

### Opslaan in een tabelregel (Uren)

De lege regel bovenaan Registraties heeft een eigen knop **Opslaan**
(`.uren-btn-primary`, 30px hoog) plus een ✕ om leeg te maken, in de kolommen
van status en acties (`.uren-draft-acts`, colspan 2). Gedimd (`opacity:.45`)
zolang klant of uren ontbreekt — klikken mag, dan zegt hij wat er mist. Het ✕
staat er alleen als er iets in de regel staat. Geen stil vastleggen bij het
verlaten van de regel.

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
| gevaarlijke actie | `var(--danger)`, onder een scheiding — in een `.uren-menu` met `.uren-menu-item.gevaar` |

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

### Bediening in een kaartkop

Verandert een knop alleen wát er in díe kaart staat, dan hoort hij in de kop
van die kaart en niet in een filterbalk erboven. De kop is een flexrij, de knop
gaat rechts (`margin-left:auto`) en is de balkknop `.uren-btn`. Staat hij aan,
dan draagt `aria-pressed="true"` dat; er is geen tweede aan-vorm nodig.

Op een telefoon is hij één maat kleiner dan in een balk: **32px hoog, 10px
zijvulling, `var(--fs-micro)`** — hij staat niet in een rij met andere knoppen
maar alleen naast een titel, ruim omringd. Dat is de uitzondering die
[`mobile.md`](mobile.md) op 32px zet. 36px naast een kop van 17px oogt als een
tweede kop. Schrijf hem als `.uren-btn.fac-an-kaartknop`: de mobiele
`.uren-btn`-regel staat verderop in het bestand en wint anders op volgorde.

De titel zegt dan niet nog eens welke stand er aanstaat: de knop ernaast doet
dat al, en op 375px is die ruimte er ook niet. Voorbeeld: `.fac-an-kaartknop`
in "Waar komt het vandaan" (184px titel + 118px knop + 10px gat in 320px).

### Een getal in een tabel dat doorklikt

Opent een getal in een draaitabel de regels erachter (Uren → Per klant, Per
week, Per maand), dan is het een `<button class="uren-piv-klik">` ín een
`td.klik` — maak hem met `urenCelTd()`, niet met de hand. De knop neemt
de vulling van de cel over (`9px 11px`) en vult hem helemaal (`td{height:1px}`
+ knop `height:100%`), zodat de kolom niet verspringt en je niet op het getal
hoeft te mikken. Lettertype, gewicht en kleur erft hij van de cel (`font:
inherit; color: inherit`) — een klikbaar getal ziet er in rust uit als elk
ander getal.

| | |
|---|---|
| hover | cel `var(--mint-soft)` — de rij zelf kleurt al `--surface2`; in een rij die al mint is (de gekozen maand) `var(--mint-glow)` |
| focus | `2px solid var(--mint)`, `outline-offset:-2px` |
| zonder waarde | geen knop: een `—` opent niets |
| wat het opent | een lijstvenster van 720px met `.uren-mcard`-regels per dag |

Op een telefoon staat de tabel er niet; daar is de regel van de lijst
(`button.uren-mpiv-row`: klant, week of maand) de knop, minstens `var(--tap)`
hoog. Een regel zonder uren blijft een gewone `div`.

### Strook over de volle breedte (Dashboard: Opdrachten & contracten)

Op een bureaublad een kaart over beide kolommen onder Notities en Checklist
(`grid-template-rows: 1fr auto`, alleen boven 900px). Regels `.dash-oc-rij`:
`var(--tap)` hoog, `--surface2`, `radius-md`, `var(--fs-klein)`; naam 600 met
`…`, het signaal als `.fac-pill.opd-pill-let`/`-fout`. Twee kolommen vanaf 340px
breed. Op mobiel één kolom, het woord Opdracht/Contract weg (en al onder
1200px). Vóór de pil een balk van 70×4px: hoeveel van de looptijd erop zit,
vulling `--gr-nu` op `--surface3`; zonder einddatum blijft zijn plek leeg
zodat de pillen onder elkaar staan. Op mobiel staat de balk onder de naam en
de pil rechts.

### Kaartkop op het Dashboard

Eén kop voor alle dashboardkaarten (`.dash-grid .card-hdr`):

| | |
|---|---|
| icoon | `.dash-kop-icoon` 30×30, radius 8, svg 16px; tint via `--dash-tint`/`--dash-inkt` op de kaart |
| tinten | Checklist `--mint-soft` / #00936C (donker: `--mint`) · Notities `--info-bg` / `--info` · Opdrachten & contracten `--warning-bg` / `--warning` |
| titel | `--font-display`, `--fs-groot`, 700 |
| telpil | `--fs-micro`, 700, 22px hoog, `--surface2`; leeg = weg |
| rechts | `.dash-alles` "Alles ›": 30px, `--fs-klein`/600, rand `--border-strong`, hover mint. Op mobiel weg (de kop klapt daar in en uit) |

Notitieregel (`.dash-notitie`): documenticoon 30×30 op `--surface2`, titel
`--fs-basis`/600, klant eronder `--fs-micro` met een blokje van 8px, tijd
rechts `--fs-micro` `--text-hint` ("14:20", "gisteren", "ma", "28 sep").

### Taakregel op het Dashboard

| | |
|---|---|
| vinkje | 20px, radius 6, 7px van de rand: zijn midden (17px) is de boomlijn |
| titel | `--fs-basis` / 600, één regel (mobiel twee); klik = taakvenster |
| meta | `--fs-micro`, **één regel**: klantblokje 8px · project (mapje 11px, een knop naar dat project in de Checklist) · deadline (te laat in `--danger`) · ring 11px + `d/n` (de ring is ook de uitklapknop). Past het niet, dan korten klant en project in met … — de klant eerst en met een project hooguit 45%; op een telefoon dan alleen het klantblokje vóór het project |
| uitklappen | `.dash-exp` 28px (mobiel `--tap`), chevron 16px, `aria-expanded`; alleen bij subtaken |
| prioriteit | pil `--fs-micro`/700 in de kleuren van `CL_PRIORITY_CFG`; op mobiel naast de titel |
| open | vlak `--surface2`; subtaken 36px (mobiel `--tap`), `--fs-klein`, vinkje 16px, boomlijn 1px `--border-strong`; "+ Subtaak" `--text-hint`, hover mint |

### Waarde met een balk (Opdrachten → Omzet, Per klant)

Op een telefoon per opdracht `.opd-wrij`: naam (twee regels, `--fs-klein`/600)
links, waarde rechts (`--fs-basis`/600), daaronder één balk van 6px —
geschreven egaal (`--gr-nu`), gepland gearceerd (§11) — en een bijregel in
`--fs-micro`. Geen bedrag (doorlopend) = rechts `--fs-klein`/500 muted, geen
balk. Op een bureaublad blijft het een tabel; beide in de DOM, de CSS kiest.

### Taakkaart (Checklist)

| | |
|---|---|
| titel | 13,5px / 600 |
| meta-regel | 11px |
| voortgang subtaken | ring van 11px ín de meta-regel, baan `--surface2`, vulling `--mint` — alleen bij een taak mét subtaken, en nergens anders op de kaart |
| acties | mobiel achter één ⋯ rechts naast de titel; desktop een rij icoontjes |
| project | label `.cl2-project-tag` ná het klantlabel, dezelfde vorm (10,5px / 600, radius 4px), neutraal: `--surface2` met `--text-muted` en een mapje van 11px — de kleur hoort bij de klant. Het is een knop: een tik toont alleen dat project |
| projectbalk | onder de filterbalk als er een project gekozen is (`.cl2-projectbalk`): naam (`--fs-basis` / 600), klant en voortgang (`--fs-klein` muted), dan *Specificatie* (primair), *Afronden* en ⋯, en een ✕. Op een telefoon het ✕ naast de naam en de knoppen eronder |

### Notitieboom: klant, project, notitie (Notities)

Binnen een klantgroep eerst de projecten, dan de losse notities.

| | |
|---|---|
| projectkop (`.note-proj-hdr`) | de maten van een notitieregel: vulling `7px 10px` (mobiel `10px 12px`, min. 40px), pijl 12px, icoonkolom 14px — zo staan pijl, icoon en tekst op één lijn met de notities |
| naam | 13px / 600, loopt door op een tweede regel zoals een notitietitel |
| icoon | het projectmapje van de Checklist (`CL_PROJECT_IC`), 14px, `--text-muted` — geen eigen kleur, die hoort bij de klant |
| telling + knop | de telpil en de + van de klantkop (`.note-client-count`, `.note-client-actions`); de + op desktop alleen bij hover, op mobiel altijd |
| inhoud | ingesprongen aan een lijntje van 1px `var(--border)` onder de pijl (`.note-proj-body`) |
| afgerond | naam `--text-muted` en het woord *afgerond* in `--fs-micro` |
| slepen | een notitie op een klant- of projectkop: vlak `--info-bg`, zoals op een groep |

### Klant en project onder de titel (Notities)

`.note-plek`: een regel onder de titel die ook de knop is. Blokje van 9px in
de klantkleur, de klant in `--fs-klein` / 500 muted, `›`, het projectmapje
(13px) en het project in 600 `--text`, en een pijl van 14px. Zonder klant
een gestreept blokje en *Geen klant* in `--text-hint`. Begint op de lijn van
de titeltekst (6px vulling). Op desktop 28px hoog, op mobiel `var(--tap)`.
De knoppen rechts in de kop staan op de lijn van de titel, niet tussen titel
en deze regel in.

Het menu (`.notes-plek-menu`, een `.uren-menu` aan de body) en dezelfde lijst
in het rechtermuisknopmenu en het ⋯: per klant een regel met een blokje van
10px, de lopende projecten 18px ingesprongen met het mapje, en rechts een
mint vinkje bij de huidige keuze (dan vet). Op mobiel regels van
`var(--tap)`.

### Klantkaart (Klanten)

`.kb-kaart`: de doos van een lijstkaart (`--surface`, 0.5px rand,
`radius-md`, streepje van 3px links in de klantkleur), in een raster van
`minmax(min(380px,100%),1fr)`.

| | |
|---|---|
| kop | blokje 10px, naam `--font-display` / `--fs-groot` / 700 op één regel met `…`; rechts het oog (`.klant-wissel-oog`, een rij-actie) en *Gegevens* als kaartknop (`.uren-btn.fac-an-kaartknop`) |
| factuurgegevens | `--fs-klein` muted: adres op één regel (of de pil *Adresgegevens ontbreken*, `.fac-onvolledig`), factuurpartij, en *Tarief · Termijn · Omzet* met de getallen in 600 `--text` |
| projecten | label in `--fs-micro` kapitalen; *+ Project* rechts; elke regel (`.kb-proj`) is een knop van `var(--tap)` op `--surface2` met mapje, naam (`--fs-basis` / 600) en eronder *1 van 2 taken af · 1 notitie* (`--fs-micro`), en een ⋯ — de regel opent het menu |
| afgerond | *Afgerond · N* als uitklapregel, `--text-hint` |
| voet | *N notities ›* en *N open taken ›* (`--fs-klein` / 600): naar die module met het klantfilter |
| verborgen klant | onderaan onder *N klanten verborgen*, kaart op 72% |

Op mobiel zijn *+ Project*, *Afgerond* en de voetlinks `var(--tap)` hoog.

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

**Contracten en Opdrachten** gebruiken dezelfde kaart (`ctrKaart`, `opdKaart`,
klassen `.ctr-mcard`): links wie, wat, een metaregel en de tijdregel
(`.ctr-mtijd`, oranje `.let` / rood `.fout`); rechts de datum die telt — het
einde, of de start als hij nog moet beginnen — met de looptijd eronder
(`.ctr-msub`, oranje als het einde nadert). Twee afwijkingen van de tabel
hierboven, bewust:

- **De naam van het contract of de opdracht mag twee regels** (`.ctr-mnaam`,
  line-clamp 2). Zo'n naam is opgebouwd uit onderdelen ("Klant Oost - Acme BI -
  Contract 6 mnd - 24u") en op één regel viel precies het onderscheidende eind
  weg. Een klantnaam blijft één regel.
- **Een klantnaam staat in een eigen `<span class="nm">`** binnen `.kl`. `.kl`
  is een flexrij, en daar werkt `text-overflow` niet op losse tekst: zonder de
  span werd een lange naam hard afgesneden in plaats van met `…`.

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

**Een keuzechip** (`.uren-kchip`, voor een vaste set als de drie statussen of
Zakelijk/Privé) is op mobiel minstens `var(--tap)` hoog, net als de duurchips
in het urenvenster. Op desktop 30px.

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
| breedte | 640 (formulier; ook de opbouw van een contractwaarde en Vrije dagen) · 720 (lijst) · 800 (maandoverzicht: de kalender vraagt 720) · **1000** (factuureditor) |

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
| `.uren-menu-item` | 34px hoog op mobiel (Uren, Facturen, sorteren in Notities, …) | `var(--tap)` — alleen het menu onder de titel in Notities en het projectmenu op Klanten hebben dat al (2026-10-13) |

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
- **Bedragen boven kolommen: één keuze, `facAnKolomLabels()`.** Mét €-teken als
  het past, anders zonder, anders om de maand (dan weer mét €) — geteld vanaf
  de laatste, gelijk met de maandnamen eronder. "Past" betekent: minstens 4px
  lucht (een spatie); bij 1px lazen twee bedragen als één woord ("29k29k").
  Gebruikt door de Facturen-analyse en het vooruitzicht van Opdrachten; nooit
  per grafiek opnieuw uitschrijven.
- **Het raakvlak is de hele baan, niet de balk.** Op negen pixels mikken lukt
  met een duim niet; de baan is ook wat de toets bereikt (`tabindex`).
- **Elke grafiek heeft een tabelweergave.** Kleur mag nooit de enige drager
  van een waarde zijn.
- **Gearceerd is afgeleid.** Een deel dat niet gemeten maar afgeleid is — uren
  uit een factuur, over de werkdagen verdeeld — krijgt dezelfde tint
  gearceerd (135°, lijn van 2px op 5px) met een rand van 1px:
  `.vul.afgeleid` en `.fac-an-leg i.afgeleid`. Geen tweede kleur: het is geen
  andere reeks, het is een andere bron. Altijd met een legenda. In een svg is
  dat een `<pattern>` op 45° met een rand van 1px, zoals `.opd-gepland` in het
  vooruitzicht van Opdrachten: gepland is afgeleid, geschreven gemeten.
- **Een hint of een hand alleen bij een doorklik.** "Klik voor de facturen"
  in de tooltip en `cursor:pointer` staan alleen op een baan met
  `data-fac-action` of `data-uren-action`. Een hand die niets opent is een
  belofte die de grafiek niet nakomt.
- **Een werkdag zonder uren is een gestreepte omlijning.** Geen vulling en geen
  kleur: er hoort iets te staan en er staat niets (`.uren-kal-bron.gat`,
  `.fac-an-leg i.gat`). Zo leest het maandoverzicht in drie tekens: egaal,
  gearceerd, gestreept. De tekst van de klikhint staat op de baan zelf
  (`data-an-klik`); zonder staat er "Klik voor de facturen".

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

---

## 13. Zijbalk

Naar het voorbeeld van 2026-09-16 (zie `decisions.md`). De zijbalk is in
beide thema's donker; de vensters die eruit opengaan volgen het thema.

| | Bureaublad | Telefoon (lade) |
|---|---|---|
| breedte | 272px, ingeklapt 72px | 84%, max. 320px — nooit ingeklapt |
| rij (`.nav-item`) | 44px hoog, 14px / 600 | `var(--tap)`, `var(--fs-basis)` |
| icoon in een rij | 20px — geen `--icoon`: het staat naast een label, niet alleen in een knop | 20px |
| rij in een groep (`.nav-sub`) | 12px dieper (vulling links 24px) | idem |
| wisselaar bovenin | 60px, logo 44px, naam 15px / 700 display | naam `var(--fs-groot)` |
| gebruiker onderin | 56px, avatar 40px, naam 14px / 600, e-mail `var(--fs-klein)` | naam `var(--fs-basis)` |
| Vraag het je app (`.sb-ai`) | rechts naast de wisselaar: 44px in het vierkant, dezelfde tegel (vulling, rand, hoek 10px), sparkle 20px in het verloop van het logo; ingeklapt onder de wisselaar, 48×46 | idem, 44px; tikken sluit eerst de lade |
| inklapknop | 28px rond, half over de rand, op de streep boven de gebruiker | weg |
| pil onder de naam (`.sb-pil`) | `var(--fs-micro)` / 700, kapitalen, mint op 16% mint | idem |

**Kleur volgt interactie.** Rust: label 82% wit, icoon 55%. Hover: vlak 7%
wit. Actief: vlak 11% wit, label wit, icoon mint. Een open groep heeft een
eigen vlak (4,5% wit) met de kop op 7%; bevat hij de actieve module, dan
kleuren icoon en pijl van de kop mint. Geen mint vlak, geen streep links.

**De pijl** (`.sb-chevron`) wijst dicht omlaag en open naar rechts
(`aria-expanded="true"` draait hem −90°). Geldt voor de wisselaar, een groep
en het gebruikersblok; het ↗ van Externe tools draait niet mee.

**Waar een venster uit de zijbalk opengaat.** Op een bureaublad rechts náást
de zijbalk, op de hoogte van de knop (`zijbalkPlaats`); in de lade onder de
knop, of erboven als dat niet past. Er staat er hooguit één open
(`sluitZijbalkVensters`). Menu's zijn gewone `.uren-menu`s. De klantwisselaar
is een eigen kaart, maar met de maten van het venster van Externe tools: 320px
breed, 6px binnenrand, regels van 48px met een blokje van 22px, naam 13px/600,
bijregel `var(--fs-micro)`. Klanten staan op aantal open taken, meeste eerst.
Achter elke klant een oog (`.klant-wissel-oog`): een rij-actie, `--text-hint`,
32px op een bureaublad en `var(--tap)` op een telefoon, altijd zichtbaar — geen
hover-knop. Verborgen klanten staan onderaan onder een uitklapkop *Verborgen · N*,
met dezelfde regels als het verborgen-blok onderaan de notitieboom.

**Achtergrond: de wereldbol.** Onderin draait de aarde als stippen, net als de
H in het logo en in hetzelfde verloop (`#sbWereld`, `zijbalkWereld()`). Hij
ligt áchter alles (`z-index: -1` binnen de stapel van `.sidebar`), dus een
rij, een groepsvlak of tekst hoeft er geen rekening mee te houden. Straal 0,8 ×
de open breedte (272 → 218px; ingeklapt dezelfde bol door een spleet van
72px). De top staat tot 110px boven de voet, nooit hoger dan de straal, en
op een laag scherm blijft hij onder Instellingen. Achter de voet zijn de
stippen gedimd (tot 20%), zodat opslagstatus en e-mailadres leesbaar blijven.

**Groepen starten dicht** (2026-10-13). Administratie (Klanten, Uren, Facturen,
Opdrachten, Contracten) staat na elke keer laden ingeklapt, ook als je op een
pagina daarin zit: dan kleurt alleen de kop. Binnen een sessie klapt hij open
als je er vanaf een andere pagina heen gaat. De stand wordt niet bewaard.

**Nieuwe module erbij?** Een regel met `data-mod` en `data-titel` (de tooltip
als hij ingeklapt is). Hoort hij bij een andere, zet hem dan in een
`.nav-groep` — geen kopje en geen losse streep.

---

## 14. Beweging

Twee duren en twee curves, als token in `:root`. Een nieuwe animatie gebruikt
deze; geen losse `.15s` of `0.3s` meer.

| Token | Waarde | Waarvoor |
|---|---|---|
| `--duur-kort` | 140ms | menu's, dropdowns, de kopie die uitfaded |
| `--duur` | 220ms | vensters, wisselen van module, taken in de Checklist |
| `--ease` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | iets komt binnen of op zijn plek (remt af) |
| `--ease-weg` | `cubic-bezier(0.4, 0, 1, 1)` | iets gaat weg (trekt op) |

**Wat beweegt.**
- *Module wisselen*: de nieuwe faded in (`mod-binnen`). Alleen `opacity`: een
  transform op de module zou de vaste knoppen erin laten verspringen.
- *Vensters*: openen met `ha-modalIn`, sluiten met uitfaden + `scale .97`. De
  achtergrond blijft met `display … allow-discrete` staan tot hij weg is, met
  `pointer-events: none` — hij is dan al dicht.
- *Menu's met een class* (`.open`, `data-open`): openen en sluiten met
  `opacity` + `translate 0 -4px`; uit de zijbalk zijwaarts (`-4px 0`). Nieuw
  menu van die soort? Zet de selector bij de regels onder BEWEGING onderaan
  het stijlblok, met zijn open-selector in de open-regel én in `@starting-style`.
- *Menu's die uit de pagina worden gehaald* (`.uren-menu`, `.uren-filterpop`):
  binnenkomen via `@starting-style`, weggaan via een kopie die uitfaded
  (`menuUitfaden()`). Daar hoef je niets voor te doen.
- *Zijbalk*: de wereldbol onderin draait in 120 s rond, op een canvas met 20
  beelden per seconde en alleen zolang hij in beeld is (een dichte lade telt
  niet) en het venster de focus heeft. Bij "beweging beperken" één
  stilstaand beeld (`geenBeweging()`).
- *Dashboard*: rechts in de hero loopt een lijn van stippen (`dashHeroLijn()`,
  canvas `.dash-hero-lijn`), van mint naar cyaan. Hij begint onder het woord
  *chat* in de hint (op een telefoon halverwege). Op de lijn staan de stippen
  vol, eromheen twinkelen ze; een lichter stuk loopt er langzaam overheen.
  Hooguit 30 beelden per seconde, alleen in beeld en met een zichtbaar
  tabblad; bij "beweging beperken" één stilstaand beeld. De vorm is vast:
  sfeer, geen gegevens.
- *Checklist*: afvinken tekent het vinkje (`.zojuist`), klapt de taak dicht en
  hertekent daarna; elke hertekening laat de taken naar hun nieuwe plek glijden
  (FLIP in `renderChecklistModule()`).

**Regels.**
- Alleen `opacity` en `transform`/`translate`/`scale` animeren. Hoogte alleen
  voor het dichtklappen van één taak.
- "Beweging beperken" op het apparaat zet `--duur` en `--duur-kort` op 0; de JS
  vraagt `geenBeweging()` en slaat dan over. Een nieuwe animatie moet dus de
  tokens gebruiken, anders blijft hij lopen.
- Geen animatiebibliotheek: CSS en de Web Animations API zijn genoeg.

---

## 15. Instellingen

Eén pagina (`#instellingen`) met groepen. Elke groep heeft een kop als een
dashboardkaart, met een getint icoon van 30px (`.inst-kop-ic` staat in dezelfde
regel als `.dash-kop-icoon`) en een titel in `--font-display` /
`--fs-groot` / 700. Daaronder komt een uitlegregel in `--fs-klein` muted, en
dan een of meer kaarten met regels.

| | |
|---|---|
| kaart | `--surface`, `0.5px var(--border)`, `--radius-md`; tussen twee kaarten `--sp-1` |
| label boven in een kaart (`.inst-sub`) | `--fs-micro` / 700, kapitalen, `.08em`, muted — zoals `.uren-menu-lab` |
| regel (`.inst-rij`) | ≥ `var(--tap)`, vulling `10px 14px` (mobiel `11px 14px`), scheiding 0.5px `--border` |
| label / bijregel | `--fs-basis` / 600 · `--fs-klein` muted |
| stand rechts (`.inst-waarde`) | `--fs-klein`, cijferletter; een kleur draagt hij als **stip van 7px** ervoor, nooit in de tekst (§12: `--warning` op wit is 1,85:1) |
| hover / focus | `--surface2` · 2px mint, `outline-offset:-2px` |

**De regel is de knop.** Er zijn drie soorten, en het raakvlak is in alle drie de hele regel:

- **opent iets**: een pijl `›` van 16px rechts, in `--text-hint`
- **keuze uit een lijst** (`role="radio"`): een vinkje in mint rechts, en het label op 700, zoals de gekozen regel in een menu
- **aan/uit** (`role="switch"`): een schakelaar `.inst-schakel`, 38×22 met een knop van 18px (mobiel 46×28 met 24px), mint als hij aanstaat

Op een breed scherm staan er twee **vaste** kolommen: links AI en Agenda en
mail, rechts de rest (een grid met `minmax(min(400px,100%),1fr)`, maximaal
1040px breed). Smaller dan 2 × 400px wordt het vanzelf één kolom, in dezelfde
volgorde. Geen CSS-kolommen: die verdelen opnieuw zodra een blok inklapt,
en dan springt een groep naar de andere kant. Op een telefoon gaat de
topbalk weg, want de titel staat al in de mobiele balk.

**Inklappen.** Een accountkaart (Agenda en mail) en een API-sleutel hebben
een kopregel (`.inst-inklap-kop`): een gewone regel met rechts de stand (stip
+ *Verbonden*, *Ingesteld*) en een pijl van 16px in `--text-hint` die
omdraait als hij open is, zoals de cijferbalk in Facturen. Dicht is de
standaard; een sleutel die nog niet is ingesteld staat open, en blijft
open nadat je hem hebt opgeslagen. Wat je
open- of dichtklapt onthoudt het apparaat (`herling_instellingen_open`).
Onder een accountkop staat een scheidingslijn naar de regels; onder een
sleutel niet, dat is één blok. Andere groepen klappen niet in: die zijn
kort genoeg.

**Een API-sleutel** (`.inst-sleutel`) is een blok in plaats van een regel.
Open staat onder de kopregel eerst de uitleg (`--fs-klein` muted).
Bovenaan staat de kop zoals bij een regel, met de stand rechts (een stip, en
"in gebruik" als pil achter de naam). Daaronder staan *Eindigt op …1234* en de
uitslag van de laatste test (stip: grijs, groen of rood), dan een veld met
**Opslaan** ernaast, even hoog (`align-items:stretch`), en tot slot **Testen**,
**Verwijderen** en rechts een link naar de plek waar je de sleutel aanmaakt.
De sleutel zelf komt nooit in de pagina.

Een nieuwe instelling krijgt een regel op deze pagina, ook als hij in een
⋯-menu van een module blijft staan. Hier zoek je, daar gebruik je.

---

## 16. Vraag het je app

**Het paneel** (sinds 2026-10-13; daarvoor een venster met achtergrond). Geen
`.modal-bg`: je werkt ernaast door, en het blijft open als je van pagina
wisselt. Een kop op de band met de sparkle (in het verloop van het logo, geen
emoji), de titel en rechts drie icoonknoppen zoals in §2: de **klok** voor
eerdere gesprekken (aan: mint met een vlak van 12% wit), de **+** voor een
nieuw gesprek (uit, `.35`, zolang er nog geen gesprek is) en de **−** (minimaliseren).
Daaronder het gesprek, de regel *Kijkt mee*, het invoerveld en een voet met
het model en het verbruik.

| | Bureaublad | Telefoon |
|---|---|---|
| plek | zweeft rechtsonder voor de pagina, 24px van de randen, 420 breed; de hoogte volgt de inhoud tot min(660px, scherm − 48px); boven vensters (z-index 210) | blad van onderen over de volle breedte, hoogte volgt de inhoud tot 88vh; onder vensters (190) |
| openen | ronde knop rechtsonder (`.aic-starter`, 52px, `--navy`, sparkle 24px), de sparkle in de zijbalk, de sparkle in de kop van een notitie | de sparkle in de zijbalk en in de kop van een notitie — rechtsonder staat de ronde + |
| ernaast | de pagina blijft staan (het paneel ligt erover). Een venster dat opengaat krijgt de ruimte links van het paneel | — |
| minimaliseren | **−** of Escape in het paneel; het gesprek blijft staan. Komt er een antwoord terwijl het weg is, dan krijgt de ronde knop een mint stip van 12px rechtsboven (knipperend zolang het antwoord onderweg is) | **−**; een klik naar een taak of notitie minimaliseert het blad ook |
| verslepen en maat | de kop is de greep (cursor *move*); randen en hoeken (8px, net buiten het paneel) maken hem groter of kleiner, minimaal 320 × 300; rechtsonder een hoekje van 8px als teken. Blijft binnen het scherm, onthouden per apparaat (`herling_ai_paneel`); dubbelklik op de kop = standaardplek. Een venster houdt de kant vrij waar het paneel staat | niet: een blad versleep je niet |

**Kijkt mee** (`.aic-scherm`). Eén regel boven het invoerveld: een oog en
*Kijkt mee: Notities · Plan van aanpak · selectie (12 woorden)* in
`--fs-micro` / 600 muted; de regel is een knop die het meekijken uit en aan
zet (uit: doorgestreept, oog dicht). Daaronder de snelle knoppen
(`.aic-chip`): pillen van 30px (telefoon `var(--tap)`), `--fs-klein` / 500,
een sparkle van 13px in mint. In een notitie *Aanvullen*, *Opschonen*,
*Advies*, *Actiepunten* (met een selectie: *Werk dit uit*, *Herschrijf dit*);
bij een tekstveld *Schrijf "…"*; elders *Wat valt op?*.

**Eerdere gesprekken** staan in het venster zelf, op de plek van het gesprek:
een kop (`--fs-groot` / 700 display) met een regel over waar ze staan, en per
gesprek een regel van minstens `var(--tap)` met de eerste vraag (`--fs-basis` /
600, op één regel afgekapt) en daaronder *vandaag 14:05 · 3 vragen* in
`--fs-klein` muted. Het open gesprek krijgt een mint stip met *Nu open*. De
prullenbak erachter is een rij-actie zoals het oog in de klantwisselaar:
`--text-hint`, 32px (telefoon `var(--tap)`), altijd zichtbaar, rood bij hover.
Verwijderen geeft een toast met *Ongedaan maken*.

| | Bureaublad | Telefoon |
|---|---|---|
| kop | alleen de titel; klok, **+** en ✕ rechts | idem, elk `var(--tap)` |
| lege stand | onderin bij het invoerveld: kop *Waar kan ik mee helpen?* (`--fs-groot` / 700 display), uitleg `--fs-klein` muted, de eerste **vier** suggesties als regels van de volle breedte (radius 10px, 36px) | dezelfde kop, geen uitleg, vier suggesties als regels (radius 12px, min. `var(--tap)`, `--fs-klein`, links uitgelijnd) |
| voet | model als `.btn-sm`-keuze; het verbruik staat sinds v2.76 op Instellingen → AI, direct onder het model | één regel: model als stille keuze (geen doos, `--fs-klein` muted); onderin ruimte voor de thuisbalk |

De volgorde van de suggesties telt: op een telefoon staan alleen de eerste
vier, dus daar de nuttigste, met één die iets klaarzet. Met een gekoppeld
Google-account (en Claude) gaan de agenda- en mailvraag daar nog voor
(`aiChatSuggesties()`).

**Een taak of notitie in een antwoord** is een link naar die taak in de Checklist (of die notitie)
(`.aic-taak`): de tekst blijft staan, met een onderstreping van 1px in mint en
3px eronder, en 2px bij hover. Geen mint tekst, want op wit is die te licht. Het is
een knop, geen `<a href>`, omdat de app op de hash routeert.

### Een voorstel in de chat

Wil Vraag het je app iets doen, dan staat er een kaart in het antwoord
(`.aic-actie`). Op die kaart staat wat er gaat gebeuren. Er verandert pas iets
als je klikt.

| | |
|---|---|
| kaart | `--surface` op het vlak van de bubbel, `1px var(--border-strong)`, radius 10px, vulling `10px 12px` |
| kop | icoon van 16px in mint, titel `--fs-klein` / 700; rechts de stand in `--fs-micro` met een stip van 7px (grijs, groen als uitgevoerd, rood als het niet kan) |
| regels | `dl` in twee kolommen: label muted, waarde `--text`, beide `--fs-klein`; namen en datums voluit ("vr 16 okt 2026"), zoals ze in de app staan |
| knoppen | `.btn-sm`: **Uitvoeren** primair, **Overslaan** secundair; na uitvoeren een melding, **Bekijk in …** primair (naar het resultaat) en **Ongedaan maken** |
| kan niet | een regel in `--danger` met de reden, zonder Uitvoeren |
| twee of meer open | onder de kaarten één knop **Alles uitvoeren (n)**. Mail-acties tellen niet mee: die voer je per kaart uit, met een regel ernaast die dat zegt |
| met tekst | *Notitie bijwerken* en *Veld invullen*: onder de regels *Bekijk de tekst* (`details`), de tekst in een vak op `--surface2` van hooguit 240px dat zelf scrolt; koppen daarin `--fs-basis`, zonder de band van een vensterkop |

Overgeslagen, ongedaan gemaakte en vervallen kaarten blijven staan op 65%
dekking, zonder knoppen. Zo blijft zichtbaar wat er voorgesteld is. Een
voorstel vervalt zodra je een nieuwe vraag stelt.

**Naar het resultaat.** Een taak waar je vanuit de chat naartoe springt,
licht op met een omlijning van 2px in mint die in `10 × --duur` uitdooft
(`.cl-item.is-gevonden`). Schaduw en vulling van `.cl-item` staan op
`!important` en winnen van een animatie; een `outline` niet.

---

## 17. Agenda en Mail

Twee modules met de balken die er al waren. Agenda heeft de topbalk van
Uren (periode `‹ label ›` met het label als weg naar vandaag, `.uren-scope`
voor Dag / Week / Lijst, `.uren-btn-vandaag`). Mail heeft de tabbalk van
Contracten (`.uren-tabs`) met het zoekveld rechts. Op een telefoon staan
het ⋯ en de ronde + op hun vaste plek (§8). De accountkeuze staat daar in
het ⋯-menu en niet in de balk: een eigen regel van 44px voor een keuze die
je zelden wisselt, is te duur.

**Een kleur draagt een streepje van 3px links**, zoals de klantkleur op een
lijstkaart (§4). In de agenda is dat de kleur van de agenda in Google; een
afspraak met een eigen kleur (`colorId`) krijgt die. In mail is het de kleur
van het account (`GACC_KLEUREN`, in volgorde van koppelen). De vulling van
een afspraak is die kleur voor 20% gemengd met `--surface`. Zo blijft hij in
beide thema's leesbaar met `--text` erop.

| Agenda | |
|---|---|
| uur | `--kal-uur` 48px (telefoon 52px); tijdkolom 52px (44px) |
| afspraak | titel `--fs-klein`/600, tijd `--fs-micro` cijferletter; korter dan 45 min op één regel |
| overlap | naast elkaar (`kalIndeling`), zoals Google Agenda |
| vandaag | in Week een mint vlak en een mint cijfer; in Dag geen kop (de balk zegt het al) |
| nu | lijn van 2px `--danger` met een stip |
| afgezegd | 55% dekking, doorgestreept |
| lijstregel | `var(--tap)` hoog, tijd links in twee regels, titel `--fs-basis`/600 |

| Mail | |
|---|---|
| lijstregel | afzender `--fs-basis`, onderwerp en fragment `--fs-klein`; ongelezen = 700 |
| rij-acties | rechtsonder in elke regel, onder de datum: **Archiveren** (alleen in het postvak) en **Prullenbak** als icoonknop van 32px, `--text-hint`, altijd zichtbaar; hover `--surface3`, de prullenbak dan `--danger`. Onderwerp en fragment korten daarvoor 72px eerder in (telefoon 78px, 8px tussen de knoppen). Met ongedaan maken, zonder de mail te openen |
| datum | `--fs-micro`: "14:20", "gisteren", "ma", "28 sep" (zoals de notitieregel op het Dashboard) |
| leesvenster | sticky knoppenbalk; Archiveren en Prullenbak met woord, Ongelezen, Ster en Gmail als icoonknop; Samenvatten en Antwoord rechts |
| bericht | kaart (`--surface`, `--radius-md`); ingeklapt = afzender + fragment |
| inhoud | iframe, html-mail op wit (zo is hij ontworpen), platte tekst volgt het thema |
| plaatjes van buiten | blokje `--surface2` met "Tonen" |
| opruimen | per afzender een kaart met streepje, aantal rechts `--fs-groot`, knoppen eronder |

Op een telefoon is Mail óf de lijst óf het leesvenster, met een terugknop
links in de knoppenbalk. Daar staan de vaste handelingen alleen als icoon
(44×44); de twee met AI houden hun woord en delen de tweede regel.

> **Twee valkuilen uit de mobiele laag.** `.uren-viewbar` staat daar op
> `nowrap`. Een balk met tabs én zoeken moet dat zelf terugzetten
> (`.uren-viewbar.pv-balk`). En `.uren-btn-icon` krijgt daar
> `margin-left:auto`, voor het ⋯ in de topbalk. Een icoonknop in een
> knoppenrij zet dat terug op 0, anders schuift de hele rij naar rechts.
