# Mobiel — de schaal en de regels

Wat hier staat geldt voor `@media (max-width: 768px)`. Op een bureaublad
gelden andere maten, en die staan er bewust anders in: je houdt een telefoon
verder weg dan een monitor staat, en je wijst met een vinger in plaats van
met een muispunt.

Vastgelegd op 2026-09-05. Achtergrond en de meetwaarden die eraan voorafgingen:
zie de entry van die datum in [`decisions.md`](decisions.md).

## Typografie

Zes trappen. Meer niet.

| Token | Desktop | Mobiel | Waarvoor |
|---|---|---|---|
| `--fs-micro` | 10.5px | **11.5px** | uppercase labels, badges, tellers |
| `--fs-klein` | 12px | **13px** | meta-regels, chips, secundaire tekst |
| `--fs-basis` | 13px | **15px** | kaarttitels, lijstitems, invoervelden |
| `--fs-groot` | 15px | **17px** | subkoppen binnen een kaart of paneel |
| `--fs-kop` | 18px | **20px** | moduletitels, hero-koppen |
| `--fs-cijfer` | 22px | **26px** | KPI-cijfers, bedragen |

**`--fs-micro` is de ondergrens.** Niets in beeld is kleiner. Dat is geen
smaakkwestie: het scherm stond vol met tekst tussen 8,5 en 11px, en het
gevolg was dat niets meer opviel omdat alles even klein was.

**Waarom zes en niet vier.** Vier is het gangbare advies, en voor een
consumenten-app klopt dat. Dit is een administratietool: een KPI-cijfer, het
label eronder, de kaarttitel en de meta-regel zijn vier verschillende rollen
die je in één oogopslag uit elkaar moet houden. Zes trappen met een duidelijke
rol is beter dan vier trappen waar er twee van worden opgerekt.

## Spacing

Veelvouden van vier: `--sp-1` 4px, `--sp-2` 8px, `--sp-3` 12px, `--sp-4` 16px,
`--sp-5` 24px, `--sp-6` 32px.

Stond eerder op 1, 2, 3, 5, 7, 9 en 11px door elkaar. Het gevolg was dat
niets uitlijnde dat wel bij elkaar hoorde.

## Raakvlakken

`--tap` is het streven: **44px op mobiel**, 36px op desktop. Alles wat op
zichzelf staat — een knop in een topbalk, een filterchip, een kaartactie — is
minstens `var(--tap)` hoog.

Twee uitzonderingen die er bewust zijn:

- Een knop **binnen een compacte balk** (de periodekiezer en de Week/Maand-
  schakelaar in Uren) is 30px, omdat de balk zelf 36px is en 3px padding heeft.
  Dat is een afweging die al in de code stond en die overeind blijft: deze
  knoppen zijn breed, en de balk eromheen leest als één geheel.
- Een **icoonknop in een lijstrij** mag 32px zijn als hij ruim omringd is.

Kleiner dan 30px is nooit goed. Vóór deze schaal zaten de pijltjes in de
periodekiezer op 20×23 en de actieknoppen in de notitieboom op 19×14.

**Hover bestaat niet op een telefoon.** De actieknoppen bij een klantgroep in
Notities stonden op `opacity: 0` met `:hover { opacity: 1 }` — onzichtbaar én
aanraakbaar tegelijk. Wat op desktop achter hover verdwijnt, moet op mobiel
gewoon zichtbaar zijn.

## De regel die het bij elkaar houdt

> **Een regel winnen door de bediening onaanraakbaar te maken is geen winst.**

Dit is de fout die vier keer in dit bestand is gemaakt, telkens met een
comment erbij die de afweging netjes uitlegt. De filterchips gingen naar 28px
en 10,5px om zeven knoppen op één regel te krijgen — en liepen daarna alsnog
over de rand. De KPI-labels gingen naar 8,5px om vier tegels naast elkaar te
passen — en werden alsnog afgekapt.

Past het niet? Laat het wrappen, of zet het op twee regels. Een regel extra
kost 44px. Een knop die je niet raakt kost een handeling.

## De vorm van een pagina

Elke module ziet er op een telefoon hetzelfde uit. Twee vaste plekken:

| | Waar | Raakvlak | Icoon |
|---|---|---|---|
| ⋯-menu | rechtsboven, op de lijn van de moduletitel (`top: 4px` + safe-area, `right: 12px`) | 44×44, randloos, transparant | `var(--icoon)` |
| filter | rechts in de balk eronder, in dezelfde kolom als het ⋯ — bij Uren en Facturen is dat de rij van periode/jaar, niet de tabsrij | 44×44, randloos, transparant | `var(--icoon)` |
| ronde + | rechtsonder, boven de tabbalk (`right: 17px`, `bottom: 80px` + safe-area) | 56×56 | 26px glyph |

### Eén maat voor een icoon: `--icoon`

**16px op desktop, 20px op mobiel** — een eigen token naast `--tap`, want een
raakvlak en het icoon erin zijn twee verschillende maten.

Hetzelfde icoon hoort op elke pagina even groot te zijn. Dat ging mis omdat
het ⋯ op twee manieren getekend werd: als tekstglyph `⋯` in Uren en
Facturen (inkt 16×3px bij 20px/600 Inter) en als svg van 14px in Checklist en
Dashboard (inkt 11,2×2,4px). Naast elkaar scheelde dat 43% in breedte.

Nu is er één vorm — `.icoon`, een svg met drie stippen op
`var(--icoon)` — en meet het icoon op alle vier de pagina's 20×20 met inkt
van 16,3×3,8px, gecentreerd op precies hetzelfde punt.

**Een tekstglyph is geen icoon.** Zijn maat hangt aan `font-size`, `font-weight`
én aan welk font er laadt; twee knoppen met dezelfde `font-size` kunnen alsnog
verschillen. Wie een icoon wil, tekent het.

De brede "+ Nieuw"-knoppen in de topbalken gaan op mobiel uit; de ronde knop
doet hetzelfde. Wie een module toevoegt of een knop verplaatst: zet hem op
deze twee plekken, niet ergens anders die ook past.

**Vastgezet met `position: fixed` op de knopwrapper**, niet door het element
in de DOM te verhuizen. Elk menu hangt aan zijn eigen dispatcher en wordt
soms aan `document.body` gehangen en bij de knop gepositioneerd — verhuizen
maakt die verbanden los, positioneren laat ze intact. Het blok staat aan het
**eind** van de mobiele laag: de dashboard-rasterregels staan op `!important`
en bij gelijke specificiteit wint de laatste regel.

### Een knop met alleen een icoon

Eén regel in de mobiele laag dekt ze allemaal — de trechter en het kruisje van
de Checklist, de filterknoppen van Uren en Facturen:

```css
.cl2-filterbtn, .cl2-filterwis.zichtbaar, #urenFilterBtn, #facFilterBtn {
  width: var(--tap); height: var(--tap);
  padding: 0; background: transparent; border: 0; box-shadow: none;
}
```

Wie een nieuwe icoonknop maakt, zet zijn selector er**bij** in plaats van een
eigen maat te kiezen. Zo ontstonden de drie uitvoeringen die er stonden.

**Let op `box-shadow`.** `.uren-btn` draagt er een van 1px. Met alleen
`border: 0` tekent die alsnog een randje, en dan lijkt de knop nog steeds niet
op de andere. Zulke dingen zie je in `getComputedStyle`, niet op een screenshot.

## Geen getal twee keer in beeld

Staat een getal al ergens in dezelfde weergave, dan hoort het er niet nog een
keer — ook niet anders geformuleerd. Een **afgeleide** waarde telt als
hetzelfde getal: "31 openstaand" naast "75 van 106 afgerond" is 106 min 75.

Wat wél mag: een telling die een eigen deelverzameling telt (een groepskop,
een dagtotaal), en een telling die het antwoord is op wat je net deed — het
aantal treffers na een filter. Die laatste hoort er dan ook alleen te staan
*als* er gefilterd is.

Zoek dit niet met het oog. Loop per module de zichtbare tekstknopen langs,
haal de getallen eruit en kijk welke waarde twee keer voorkomt; dan scheid je
echte herhaling van toeval. Zie de entry van 2026-09-06 in
[`decisions.md`](decisions.md).

## Werkwijze bij een mobiele wijziging

1. **Gebruik de tokens.** Wie een token gebruikt schaalt vanzelf mee; wie een
   los px-getal neerzet begint de wildgroei opnieuw. `validate.mjs` waarschuwt
   bij een nieuwe `font-size` onder 11,5px in de mobiele laag.
2. **Meet in de browser, niet in de CSS.** Deze laag zit vol `!important` en
   de generieke input-regel weegt zwaarder dan een losse class (twee `:not()`'s
   tellen mee in de specificiteit) — wat er staat is niet wat je krijgt.
   Start de preview en lees `getComputedStyle` uit.
3. **Kijk naar de andere modules.** Uren en Facturen delen `.uren-topbar`,
   `.uren-tab`, `.uren-btn` en `.uren-kpis`. Een wijziging aan een van die
   selectors raakt beide.
4. **Controleer daarna desktop.** De media query hoort dat af te schermen,
   maar HTML-wijzigingen en regels in laag 1 raken allebei.

### Preview met testdata

De app vraagt om een Google-login en leest uit Drive. Lokaal lukt dat niet
(de origin is niet geregistreerd). Zet daarom in de console van
`http://localhost:8765` een `herling_login` en een
`herling_analytics_local_backup` klaar; de app valt dan terug op de lokale
kopie en schrijft niets weg — dat meldt hij ook zelf. Dat is een andere origin
dan de live site, dus je eigen gegevens blijven buiten schot.

## Waar het nu staat

Gemeten over zes modules op 375×812, met de zijbalk dicht en zonder modals:

| | Vóór | Na |
|---|---|---|
| Tekst onder 11,5px | 30 van 42 op één scherm | **0 van 222** |
| Knoppen onder 36px | 25 van 32 op één scherm | 12 van 83 (alle 30–32px) |
| Verschillende maten | 12 op één scherm | 6–9 per module |
| Afgekapte labels | 5 gevonden | 0 |

De twaalf knoppen onder 36px zijn de uitzonderingen hierboven: de
periodekiezer, de Week/Maand-schakelaar en de vier acties in de notitieboom.

> Gemeten vóór het verwijderen van de agenda (2026-09-06); die kolom telde toen mee.

## Als iets niet in de breedte past

Twee wegen, en de keuze hangt af van wat je verliest.

**Laten wrappen** wanneer de onderdelen los van elkaar te lezen zijn: knoppen,
filters, KPI-tegels. Een regel extra kost 44px en je verliest niets.

**Horizontaal laten schuiven** wanneer de onderdelen een raster vormen dat je
niet mag breken — een tabel met kolommen die elkaar nodig hebben. Dat is de
uitzondering, en hij moet expliciet aangezet worden: sinds 2026-09-06 staat
`overflow-x: hidden` op `html`, `body`, `#appScreen`, `.main-area`, `.module`
en de modals, zodat de página zelf nooit opzij kan. Wat wél mag schuiven staat
in één lijst in de mobiele laag (`.board`, `.uren-content`, `.card-body`,
`.import-table-wrap`, …).

Bij schuiven horen twee dingen: zet de ankers vast (`position: sticky` op de
kop- of eerste kolom — zonder die weet je na één veeg niet meer waar je bent),
en gebruik **één** scrollcontainer voor het geheel. Sticky ankert aan de
dichtstbijzijnde scrollende voorouder; houdt het raster zijn eigen verticale
scroll terwijl de horizontale op de buitenkant zit, dan hangt het anker aan
een container die niet opzij schuift en schuift het gewoon mee weg.

## Bekende punten die nog openstaan

- **De zwevende + dekt tijdens het scrollen de onderste regel af.** Dat hoort
  bij een zwevende knop, maar in Uren staat hij precies op het bedrag.
- **Notities heeft geen ⋯-menu.** De vier andere modules wel, op dezelfde
  plek. Komt er ooit een, dan hoort hij daar ook.
