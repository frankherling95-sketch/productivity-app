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

## Als iets niet in de breedte past

Twee wegen, en de keuze hangt af van wat je verliest.

**Laten wrappen** wanneer de onderdelen los van elkaar te lezen zijn: knoppen,
filters, KPI-tegels. Een regel extra kost 44px en je verliest niets.

**Horizontaal laten schuiven** wanneer de onderdelen een raster vormen dat je
niet mag breken — het weekraster in de Agenda is het voorbeeld. Zeven dagen
naast elkaar op 375px geeft 42px per dag, en daar past geen afspraaknaam in.
Honderd pixel per dag maakt het raster breder dan het scherm; dat schuift dan
opzij.

Bij schuiven horen twee dingen: zet de ankers vast (`position: sticky` op de
tijdkolom en de dagkoppen — zonder die weet je na één veeg niet meer waar je
bent), en gebruik **één** scrollcontainer voor het geheel. Sticky ankert aan
de dichtstbijzijnde scrollende voorouder; als het raster zijn eigen verticale
scroll houdt en de horizontale op de buitenkant zit, hangt de tijdkolom aan
een container die niet opzij schuift en schuift hij gewoon mee weg.

## Bekende punten die nog openstaan

- **Checklist** — de bediening boven de eerste taak is nog steeds fors: topbalk,
  hero met vier knoppen, snel-toevoegen, twee filterregels en een zoekbalk.
  De maten kloppen nu; de hoeveelheid is een aparte vraag.
- **De zwevende + in Uren en Agenda** dekt tijdens het scrollen de onderste
  regel af. Dat hoort bij een zwevende knop, maar hij staat precies op het
  bedrag.
- **Agenda, maandweergave** — de pillen tonen nu de titel in plaats van de
  tijd, maar een cel is 50px breed en dus blijft het afkappen. Een maandcel
  op een telefoon kan niet veel meer dan "er is hier iets".
