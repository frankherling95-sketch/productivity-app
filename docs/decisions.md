# Beslissingen-log

Append-only log van significante design-, architectuur- en UX-beslissingen.

**Hoe te gebruiken**:
- Nieuwste entries bovenaan
- **Nooit oude entries wijzigen** — append-only. Als een beslissing achterhaald raakt: voeg een nieuwe entry toe die de oude vervangt en verwijs ernaar.
- Kort houden: 5–10 regels per entry. Voor diepe duiken: link naar `docs/<module>.md` of een commit-hash.
- Format: `## YYYY-MM-DD · Korte titel`, daarna *Probleem / Beslissing / Waarom / Bestanden / Niet doen*.

---

## 2026-09-09 · Drie dingen die pas op een echte telefoon opvielen

**De tabstrip kon omhoog.** `overflow-x:auto` maakt de andere as stilzwijgend
óók scrollbaar — dezelfde valkuil als op 2026-09-06 bij het scherm zelf. Hier
ging het om één pixel: het streepje onder de actieve tab staat op `bottom:-1px`
en steekt dus onder zijn vak uit. Genoeg om de hele strip een stukje omhoog te
kunnen duwen. Nu `overflow-y:hidden`, en het streepje staat binnen het vak
(`bottom:0`) zodat het niet wordt afgeknipt. `overscroll-behavior-x:contain`
houdt de zijwaartse beweging bovendien in de strip.

**De periodekiezer liep over het label eronder.** `.uren-scope-pop` heeft een
vaste hoogte van 34px, gemaakt voor één rij knoppen. Vier keuzes passen niet op
één regel in een popover van 236px, dus staan ze 2×2 — maar de doos bleef 34px
hoog en de tweede rij landde boven op "KLANT". Hoogte nu `auto`, knoppen
`var(--tap)` hoog op een telefoon.

**Niet elke maand had een cijfer.** De regel was "past het niet, dan om de
maand", en dat viel op een telefoon uit op de helft. Gemeten in plaats van
geschat: "€18k" is 30px bij 11,5px in een baan van 33px — het pást dus. De
schatting eromheen was te ruim afgesteld.

De grafiek kiest nu de ruimste vorm die past: mét euroteken, anders zonder, en
pas als ook dat niet lukt om de maand. Bij "Dit jaar" (negen banen van 33px)
staat er `€18k` boven elke maand; bij twaalf maanden (banen van 25px) `17k`,
ook boven elke maand. Datalabels hebben bovendien geen decimaal meer: "€4,9k"
is vijf tekens en past niet, "€5k" wel — en het precieze bedrag staat in de
tooltip en in de tabel.

**Waarom niet gewoon een kleinere letter.** Dat was de vraag, en het zou
werken: 10px past altijd. Maar 11,5px is de ondergrens uit de mobiele schaal
(2026-09-05) en die staat er omdat een app vol kleine uitzonderingen precies zo
ontstaat. De vorm aanpassen kost hier niets en de regel blijft heel.

**Bestanden**: `index.html` — `#mod-facturen .uren-tabs`,
`.uren-scope-pop.fac-an-popscope`, `facAnLabel()` en de vormkeuze in
`facAnKolomGrafiek()`; `sw.js` → `herling-v89`

## 2026-09-09 · De keuzes van de analyse zitten op een telefoon achter de trechter

**Probleem.** De balk met periode, uitsplitsing en tabelknop past op een
bureaublad prima onder de tabs, maar kostte op 375px een hele regel — boven een
scherm waar de grafiek zelf al krap is. En hij stond op een plek die nergens
anders in de app een filter herbergt.

**Beslissing.** Twee vormen van dezelfde keuzes, en de CSS kiest welke je ziet:

- **Bureaublad**: de brede balk onder de tabs. Eén rij boven alles wat hij
  aanstuurt, zodat je in één blik ziet waar de cijfers over gaan.
- **Telefoon**: de trechterknop in de topbalk, tegen de rechterrand — dezelfde
  plek, dezelfde vorm en dezelfde popover-machinerie als in de facturenlijst,
  Uren en de Checklist. Erin: periode (2×2), klant, Eindklanten + Regels, en
  de tabelweergave. Een telletje op de knop zegt hoeveel er niet op de
  standaard staat; de tabelweergave telt daar niet in mee, want dat is geen
  filter.

**Waarom allebei renderen en met CSS kiezen.** Ze staan er allebei in de DOM.
Draai je je telefoon, dan hoeft er niets opnieuw getekend te worden om de juiste
bediening te krijgen — en er is maar één plek waar de knop wordt opgebouwd.

**Waarom de popover openblijft.** Na een keuze wordt alleen de markering erin
bijgewerkt (`facAnPopMarkeer()`), zoals `facScopeZet()` dat al deed. Je ziet de
grafiek achter de popover meebewegen; sluiten en opnieuw openen om twee dingen
te kiezen is een tik te veel.

**Bestanden**: `index.html` — `facAnPopInhoud()`, `facAnPopMarkeer()`,
`facAnFilterAantal()`, tak in `facToggleFilters()` en `facRenderFilters()`,
`.fac-an-filterknop`; `sw.js` → `herling-v88`

**Niet doen**: de trechter ook op een bureaublad tonen. Dan staan dezelfde
keuzes op twee plekken en raken ze uit de pas.

## 2026-09-08 · Analyse: een zesde tab in Facturen, en wie zit er achter je klant

**Probleem.** De facturenlijst vertelt wat er is gefactureerd, niet of het
oploopt of terugvalt en waar het vandaan komt. En één regel omzet klopt niet:
LabsData is één factuurklant maar vijf opdrachtgevers.

**Waar het staat.** Een zesde tab in Facturen (niet een eigen module), met een
eigen periodekeuze in de balk onder de tabs. De jaarpijlen in de topbalk gaan
in deze weergave uit — twee periodekiezers naast elkaar is er één te veel.

**Wat er staat, en waarom in die vorm.**

- *Vier tegels*: omzet excl. btw met de groei, aantal facturen met het
  gemiddelde, het aandeel van de grootste klant, en wat er nog openstaat. Het
  aandeel en niet de naam: een naam is geen getal, past niet in een tegel, en
  de bijregel valt op een telefoon weg. Wie het is staat in de ranglijst.
- *Omzet per maand*, kolommen, met de vorige periode ernaast in grijs.
- *Cumulatief*, twee lijnen, met het bedrag aan het eind van elke lijn.
- *Waar komt het vandaan*: een ranglijst per klant, alle balken in dezelfde
  kleur. Kleur per klant zou alleen overdoen wat de lengte al zegt.
- *Tabel* (knop): dezelfde cijfers om te lezen of over te nemen.

**Nadruk, geen categorieën.** Twee reeksen zijn hier "deze periode" tegen "de
vorige". De huidige krijgt de kleur, de vorige is grijs, zodat je niet twee
kleuren uit elkaar hoeft te houden om te zien welke kant het opgaat. De twee
stappen zijn met de validator uit de dataviz-richtlijn gekozen: licht
`#0E8F73` tegen `#98A2AE` (ΔE 16,8 normaal / 10,9 bij kleurenblindheid),
donker `#12A583` tegen `#63718A` (16,4 / 11,4). Het grijs blijft onder 3:1
contrast; dat is gedekt doordat het cijfer er altijd bij staat (tegel,
eindlabel, tooltip, tabel).

**Het lopende jaar loopt tot déze maand.** Anders zet je negen maanden omzet
naast twaalf van vorig jaar en staat er een daling in beeld waar groei zit —
en tekent de cumulatieve lijn een vlak stuk voor maanden die nog moeten komen.
"Dit jaar" vergelijkt dus met dezelfde maanden van vorig jaar.

**Eindklanten.** Twee wegen naar dezelfde uitkomst:
1. Een *regel* per doorgeefluik: "voor klant LabsData, als de betreft `Uwoon`
   bevat → telt als Uwoon". De app stelt die regels voor uit je eigen
   facturen; `facEindRaad()` knipt de klantnaam, de omschrijving ("Gewerkte
   uren", "Consultancy") en de periode weg en houdt de naam over.
2. Een *veld* op de factuur zelf (Eindklant, onder Betreft). Dat gaat vóór de
   regels: een regel is een vuistregel, het veld is een besluit.

Raden mag niet beslissen — een verkeerd gelezen naam schuift omzet naar een
klant die hem niet had. Daarom stelt de app alleen voor; jij legt vast. Wat
door niets wordt geraakt heet "&lt;klant&gt; · overig" en blijft zichtbaar,
in plaats van stilletjes bij de verkeerde te belanden.

**Mobiel.** Zes tabs passen niet meer in gelijke vakken (59px per vak,
"Debiteuren" vraagt er 62 — "Verzonden" en "Klanten" liepen in elkaar over).
De strip schuift nu zijwaarts en de actieve tab wordt in beeld gezet. De
balk met de periodekeuze krijgt een eigen regel onder de tabs, net als de
btw-kiezer; zonder dat kneep hij de tabs tot nul breedte.

**Bestanden**: `index.html` — `facAnRange/facAnData/facRenderAnalyse`,
`facAnKolomGrafiek/facAnLijnGrafiek/facAnKlantBalken/facAnTabellen`,
`facEindRaad/facEindklantVan/facEindRegels`, `#facEindModal`, `.fac-an-*` en
de tokens `--gr-nu/--gr-vorig`; `docs/stijlgids.md` §11; `test.html` (67);
`sw.js` → `herling-v87`

**Niet doen**: een kleur per klant in de ranglijst, of een tweede y-as om
omzet en aantal in één grafiek te wringen. Het eerste verspilt het enige vrije
kanaal aan iets wat de balk al zegt; het tweede laat de lezer een verband zien
dat er niet is.

## 2026-09-08 · Eén mintknop in de voet van een factuur, en de voet past

**Probleem.** Bij een verstuurde factuur die te laat was zakte "Betaling
registreren" naar een tweede regel, en stond het mint op *Mailen*. Bij een
factuur die je wél gemaild had stond het mint juist op Betaling registreren en
paste alles wel. Dezelfde balk zag er dus per factuur anders uit.

**Beslissing, deel 1 — het mint staat vast.** Op een verstuurde factuur is
"Betaling registreren" altijd de mintknop; Mailen is altijd secundair. Is de
factuur betaald, dan valt die knop weg en is er geen mintknop. Eén primaire
knop per scherm blijft gelden — hij verhuist alleen niet meer.

**Waarom niet "wat je nog niet gedaan hebt".** Dat was de oude regel: mint op
Mailen zolang `gemaildOp` leeg was. Bij een factuur die je print of post komt
dat moment nooit, dus bleef het mint eeuwig wijzen naar iets wat je niet gaat
doen — precies het geval hier, een factuur van 113 dagen oud.

**Beslissing, deel 2 — de editor is 1000px breed.** Acht knoppen vragen 886px
plus 44px padding; op 900px was er 854px. Dat is 48px tekort, en dat haal je
niet uit kortere labels zonder er één onherkenbaar te maken. Deze modaal draagt
bovendien als enige een tabel van zes kolommen: op 900px kapte de btw-kolom af
tot "21% (h" (86px voor tekst die er 95 vraagt), op 1000px staat er "21% (hoog)".
De gap ging van 8 naar 6px, gelijk aan elke andere modaalvoet.

**Waarom niet gewoon laten omslaan.** Een tweede regel met één knop leest als
een aparte handeling, terwijl het er een van de rij is. En de knop die eronder
valt is juist degene die je zoekt.

**Mobiel** verandert niets aan de opzet: twee kolommen, de mintknop over de
volle breedte onderaan. Die is nu Betaling registreren, dus waar je duim al is.

**Bestanden**: `index.html` — `facEditorRender()` (tak `definitief`),
`#facEditorModal` (max-width, gap); `docs/stijlgids.md` §7; `test.html`
(voettest, 62); `sw.js` → `herling-v86`

**Niet doen**: het mint terug laten afhangen van `gemaildOp`. Dan springt de
kleur weer tussen twee knoppen en betekent mint niet meer "dit is de handeling".

## 2026-09-08 · Een vaste modelnaam is even breekbaar als een alias

**Probleem.** Inscannen brak opnieuw, nu met: *"This model models/gemini-2.5-flash
is no longer available to new users. Please update your code to use
models/gemini-3.6-flash."* Twee keer op rij lag de scanner dus stil om iets wat
niets met de factuur te maken had.

**Oorzaak.** Beide keren dezelfde denkfout, van twee kanten bekeken. Een alias
(`-latest`) verandert onder je handen mee met wat Google uitbrengt; een vaste
naam blijft staan tot Google hem intrekt. In beide gevallen kiest Google het
moment en merk jij het pas als je een factuur inleest.

**Beslissing.** Geen naam meer maar een voorkeursvolgorde (`GEMINI_TERUGVAL`),
en een 400/404 die zegt dat het model weg is laat de app zélf overstappen:
`_geminiVolgendModel()` vraagt bij Google op welke modellen déze sleutel mag
gebruiken (`GET /v1beta/models`, veld `supportedGenerationMethods`), neemt de
eerste uit de voorkeurslijst die daarin voorkomt, onthoudt die en probeert het
verzoek één keer opnieuw. Standaard is nu `gemini-3.5-flash`: een generatie
terug, want nieuw = duur = krap op de gratis laag. Het menu Instellingen →
AI-model toont voortaan de lijst die je sleutel werkelijk heeft, en test je
keuze meteen met één klein verzoek.

**Waarom niet de Interactions API.** Google's eigen foutmelding raadt hem aan en
sinds juni 2026 is het de hoofdingang. Maar `generateContent` blijft volgens
diezelfde documentatie volledig ondersteund — de curl-voorbeelden voor Gemini
3.8 Flash staan er gewoon — en Interactions bewaart standaard elke interactie
server-side (`store`). Voor factuurinhoud is dat een keuze die je bewust maakt,
niet en passant bij een storing.

**Wat er verder mis was — en bij een Gemini 3-model meteen zou zijn gaan wringen.**

- *Het denkdeel telde als antwoord.* `parts[0].text` was de aanname, maar een
  denkend model (Gemini 3 staat standaard op "medium") zet zijn samenvatting als
  eigen part met `thought:true` vóór het antwoord. `_geminiTekst()` plakt nu
  alles zonder `thought` aan elkaar. Meteen ook `thinkingConfig.thinkingLevel:
  "low"` meegestuurd bij een 3-model: aan een factuur valt niets te overwegen,
  en denkwerk telt mee als uitvoer. Alleen bij een 3 — op 2.5 bestaat het veld
  niet en is het een 400.
- *Het bedrag verdween.* Er wordt om een getal gevraagd, maar bij een
  Nederlandse factuur komt `"€ 1.234,56"` terug. `Number()` maakt daar NaN van,
  dus bleef juist het veld leeg waarvoor je scande. `facScanBedrag()` leest
  beide notaties, `facScanDatum()` leest 31-03-2026 net zo goed als 2026-03-31.
- *Het mime-type was een gok.* `file.type||'application/pdf'` plakte "PDF" op
  een JPG uit Drive (die komt binnen als `application/octet-stream`) — een 400
  die naar de factuur leek te wijzen. `facScanMime()` valt terug op de extensie
  en weigert wat Gemini niet leest vóór het een verzoek uit je dagquotum kost.
- *Een hangend verzoek gijzelde de stapel.* Geen fout, geen antwoord, alleen een
  spinner. Nu een `AbortController` op twee minuten; afgebroken telt als
  tijdelijk en komt in de volgende ronde terug.

**Bestanden**: `index.html` — `GEMINI_TERUGVAL`, `geminiHaalModellen()`,
`geminiFlashModellen()`, `_geminiVolgendModel()`, `_geminiModelWeg()`,
`_geminiUrl()`, `_geminiFetch()`, `_geminiTekst()`, `_geminiJson()`,
`_geminiLeegUitleg()`, `facScanMime()`, `facScanBedrag()`, `facScanDatum()`;
`test.html` (61 tests); `sw.js` → `herling-v85`

**Niet doen**: bij het opstarten controleren of het model nog bestaat. Dat kost
elke sessie een verzoek uit hetzelfde dagquotum om iets te weten te komen wat de
eerste echte aanroep je gratis vertelt.

## 2026-09-08 · Op een gratis laag volg je geen "-latest"

**Probleem.** Het dagquotum was op na **~23 geslaagde verzoeken**, terwijl voor
Gemini 3 Flash 1.500 per dag geldt. Frank zat dus nergens in de buurt van de
gepubliceerde limiet en kon toch niet verder.

**Oorzaak.** `GEMINI_MODEL` stond op `gemini-flash-latest`. Die alias wijst
altijd naar de nieuwste Flash — bij Frank **Gemini 3.8 Flash** — en juist het
nieuwste model heeft de krapste gratis laag. De 1.500/dag uit de documentatie
gaat over een ouder model. Je plafond verandert daarmee onder je handen zodra
Google een nieuwe Flash uitbrengt, zonder dat je iets doet.

**Beslissing.** Vastgezet op `gemini-2.5-flash` en instelbaar gemaakt
(Instellingen → AI-model, bewaard in `localStorage`). Drie voorgestelde
keuzes: 2.5-flash (ruime laag, leest PDF goed), 2.5-flash-lite (ruimer en
sneller, iets minder nauwkeurig) en `-latest` voor wie het nieuwste wil.

**Waarom instelbaar en niet gewoon een andere constante.** Welk model welke
gratis laag krijgt verandert, en is niet gepubliceerd. Met een schakelaar kost
uitproberen een minuut in plaats van een release.

**Waarom dit ná de vorige entry pas zichtbaar werd.** Zolang de app een
dagquotum als "te snel achter elkaar" meldde, leek dit een pacing-probleem. Pas
toen de melding klopte, viel op dat het aantal veel te laag was voor 1.500.

**Bestanden**: `index.html` — `geminiModel()`, `GEMINI_MODELLEN`,
`openGeminiModelPrompt()`, menu-item AI-model; `sw.js` → `herling-v84`

**Niet doen**: terug naar een `-latest`-alias zolang je op de gratis laag zit.
Dan is je dagplafond een bewegend doel.

## 2026-09-08 · Welke quota op is staat niet in `message` maar in `details`

**Probleem.** De app meldde *"Te snel achter elkaar voor de gratis laag"* bij
**1 tot 3 verzoeken per minuut**. Aan een limiet per minuut kun je op drie
verzoeken niet komen, dus de melding klopte niet.

**Oorzaak.** `_aiParseErrorResponse()` keek alleen naar `error.message`, en
daar staat bij een 429 alleen *"You exceeded your current quota, please check
your plan and billing details."* — geen woord over wélke quota. Het onderscheid
zit in `error.details[]`: een `QuotaFailure` met een `quotaId`
(`...PerDayPerProjectPerModel-FreeTier` versus `...PerMinute...`) en een
`RetryInfo` met `retryDelay`. Die lazen we niet. Een opgeraakt **dagquotum**
kwam daardoor binnen als een limiet per minuut — waarna de app de hele dag
bleef proberen aan iets dat pas morgen weer opengaat.

**Beslissing.** De parser leest `details`: `quotaId` en `quotaMetric` bepalen
`perDag`, en `retryDelay` levert de wachttijd (voorheen alleen de
`Retry-After`-header, die hier niet meekomt). Zegt Google zelf dat je langer
dan vijf minuten moet wachten, dan telt dat óók als niet-wegwachtbaar, ook als
de quotaId niets prijsgeeft.

**Tweede fout, bij de limiet per minuut.** Daar wachtten we 20 seconden en
probeerden we opnieuw — maar twintig seconden later zit je nog in hetzelfde
venster en krijg je dezelfde 429 terug. Nu legt een 429 alles stil tot het
venster om is (`_geminiStopTot`, ook bewaard zodat een herlaad hem niet wist).

**Derde: de rem begon te hoog.** 6 per minuut bleek nog te veel. Nu 4, en hij
kruipt omhoog. Wat de gratis laag per model toestaat is niet gepubliceerd —
Google verwijst naar AI Studio — dus laag beginnen en leren is de enige manier
die niet op een gok berust.

**Vierde: de badge loog.** Er stond `X / 1500 vandaag` als feit. Dat plafond
verschilt per model en bleek veel lager. Een verzonnen plafond dat op 12% staat
terwijl je quotum al op is, laat je de fout op de verkeerde plek zoeken. Nu
alleen nog de telling.

**Bewijs.** 46 tests, waaronder een nagebootst 429-antwoord in Google's echte
vorm: dagquotum wordt herkend uit `quotaId` (niet uit `message`), er volgt geen
herhaling, `retryDelay` wordt gelezen, en een lange `retryDelay` telt als
niet-wegwachtbaar.

**Bestanden**: `index.html` — `_aiParseErrorResponse()` leest `details`,
`_geminiStopTot`, start op 4, `_updateAIQuotaBadges()` zonder plafond;
`sw.js` → `herling-v83`

**Niet doen**: bij een 429 op `error.message` afgaan. Die tekst is voor beide
soorten limieten hetzelfde.

## 2026-09-08 · Een nieuwe factuur bestaat pas na Opslaan

**Probleem.** `factuurNieuw()` duwde de factuur meteen in
`factuurState.invoices` en sloeg op. Drukte je op "Factuur opstellen" en
bedacht je je, dan stond er een leeg concept in je administratie dat je apart
moest opruimen. Frank: *"dat je dan eerst op opslaan moet drukken voordat een
factuur pas daadwerkelijk wordt aangemaakt."*

**Beslissing.** Een nieuwe factuur leeft eerst in `facConcept`, buiten de
lijst. `factuurById()` kent hem wél, zodat de hele editor zonder verdere
aanpassing blijft werken — die vraagt overal via die ene functie. Pas
`facConceptVastleggen()` zet hem in de administratie: via **Opslaan**, of via
**Versturen** (dat is een steviger besluit dan opslaan, dus dat legt hem
vanzelf eerst vast).

**Waarom dit veilig kan.** `factuurSyncUren()` slaat concepten over, dus een
niet-bewaard concept houdt geen urenregistraties vast. Een verworpen concept
laat daardoor niets achter — geen halve koppeling, geen vergrendelde uren. Het
factuurnummer was al voorlopig tot het versturen, dus daar wordt ook geen
teller op verbruikt.

**Waarom de vraag bij het sluiten.** Weggooien is gratis zolang je er niets in
hebt gedaan, dus dan gebeurt het zonder ophef. Heb je er wél in gewerkt
(`updatedAt > createdAt`), dan wordt het nagevraagd — een Escape of een misklik
op ✕ is zo gegeven. Dat zit in `closeFacEditor()`, het enige sluitpunt van de
editor, dus ✕, Verwerpen en Escape lopen er allemaal langs.

**Wat níet verandert.** Een bestáánde factuur bewerk je nog steeds live, zoals
altijd. De vraag ging over aanmaken, en een tweede bewerkmodel ernaast zou
alleen maar verwarren.

**Knoppen bij een concept.** Verwerpen · Voorbeeld · Versturen · **Opslaan**.
Geen "Verwijderen" (er is niets om te verwijderen) en geen "Dupliceren" (van
iets dat nog niet bestaat).

**Bewijs.** 22 tests: niet in de administratie maar wel vindbaar voor de
editor, Opslaan maakt hem aan en tweemaal opslaan geeft geen dubbele, sluiten
zonder wijzigingen vraagt niets en laat niets achter, met wijzigingen wordt het
gevraagd en "nee" houdt de editor open. Plus een end-to-end test in `test.html`.

**Bestanden**: `index.html` — `facConcept`, `factuurNieuw()` zonder push,
`factuurById()`/`facIsConcept()`/`facConceptVastleggen()`/`facConceptOpslaan()`,
guard in `closeFacEditor()`, concept-knoppen in de editor, `facVerstuur()`;
`test.html` — 2 tests; `sw.js` → `herling-v82`

**Niet doen**: het concept ook bij een bestaande factuur invoeren. Live
bewerken is daar de bestaande afspraak, en twee modellen naast elkaar maakt
onduidelijk wanneer iets nu wel of niet vastligt.

## 2026-09-08 · Versienummer in de zijbalk, met één bron

**Probleem.** Er stond nergens in beeld welke versie je voor je had. Bij "ik zie
de oude versie" of "sinds vandaag gaat X mis" is dat het eerste wat je wilt
weten, en het was alleen te achterhalen via DevTools.

**Beslissing.** Rechtsonder naast *Inklappen*: `v1.81`. Vorm is **MAJOR.BUILD**,
waarbij BUILD de release-teller uit `sw.js` is (`CACHE_NAME = 'herling-v81'`).
MAJOR gaat naar 2 bij een echte herziening.

**Waarom niet een eigen nummering.** Een tweede teller die je met de hand
bijhoudt loopt vroeg of laat uit de pas met de cache — en dan wijst het nummer
in beeld naar iets anders dan wat er draait, wat erger is dan geen nummer.
`CACHE_NAME` moest sowieso al bij elke release omhoog, dus dat ís de teller.
`validate.mjs` vergelijkt de twee en blokkeert een push als ze verschillen.

**Waarom geen datum.** `2026.09.08` zegt meer over ouderdom, maar twee releases
op één dag krijgen hetzelfde nummer — en dat gebeurt hier regelmatig.

**Vormgeving.** `--fs-micro` in `--text-hint`: de stilste combinatie die de
stijlgids kent, want dit is metadata en mag niet met de navigatie concurreren.
De inklapknop hield zijn volle breedte (`flex:1`); het nummer staat er rechts
naast. Ingeklapt verdwijnt het (`display:none`), op mobiel valt de inklapknop
weg en houdt `margin-left:auto` het nummer rechts.

**Bewijs.** Nagemeten op desktop (10,5px, geen overlap met de knop, binnen de
balk) en in de mobiele laag (11,5px). Voor/na-beeld gemaakt met de echte CSS.

**Bestanden**: `index.html` — `.sidebar-onderrij`, `.app-versie`;
`validate.mjs` — controle tegen `CACHE_NAME`

**Niet doen**: het nummer met de hand ophogen zonder `sw.js` mee te nemen.
Validate blokkeert dat, en terecht.

## 2026-09-08 · De snelheidsrem moet een herlaad overleven

**Probleem.** `_geminiTijden` stond alleen in het geheugen. Elke Ctrl+Shift+R
zette de rem daarmee op nul, terwijl Google gewoon doortelt — precies de
situatie tijdens het testen: herladen, stapel kiezen, meteen weer 429. Een
tweede tabblad had hetzelfde gat.

**Beslissing.** localStorage (`herling_gemini_tempo`) is de waarheid, niet het
geheugen. `_geminiSlot()` leest bij elke ronde opnieuw, dus verzoeken uit een
vorige sessie of een ander tabblad tellen mee. De geleerde snelheid
(`_geminiPerMin`) gaat mee, zodat hij niet na elke herlaad opnieuw op 6 begint
en het opnieuw moet ontdekken.

**Waarom dit erbij hoort.** De rem van de entry hieronder was juist bedoeld om
429's te voorkomen. Met een geheugen dat bij elke herlaad leegloopt deed hij dat
alleen binnen één sessie — en zo wordt de app niet gebruikt.

**Wat het níet verklaart.** Dat het PDF-lezen te zwaar zou zijn. Uit Frank's
eigen statistieken: piek 2,6K input-tokens tegen een plafond van 250.000 per
minuut. De limiet die dichtsloeg telt verzoeken, geen omvang.

**Bewijs.** 43 tests, waaronder het echte scenario: twee verzoeken, dan een
tweede exemplaar van dezelfde code op dezelfde opslag (een "herlaad"), en die
wacht alsnog op zijn beurt.

**Bestanden**: `index.html` — `LS_GEMINI_TEMPO`, `_geminiTempoLees()`/
`_geminiTempoBewaar()`; `sw.js` → `herling-v81`

## 2026-09-08 · Inleeslogboek: een dubbele PDF herken je vóór het scannen

**Probleem.** Er was al een dubbelcheck, maar die werkt op factuurnummer en
slaat dus pas aan *nadat* Gemini het bestand heeft gelezen. Bij een stapel wil
je het eerder weten: welke van deze twaalf PDF's heb ik al gehad?

**Beslissing.** `factuurState.scanLog` — één regel per ingelezen bestand, met
een SHA-256 van de **inhoud**. Bij het kiezen krijgt elk bestand zijn
vingerafdruk en gaat het langs het logboek. Wat je al hebt opgeslagen komt wél
in de stapel te staan (je moet kunnen zien wat er is overgeslagen en waarom)
maar wordt niet naar Gemini gestuurd. In beeld staat wanneer je hem eerder las,
onder welk nummer, bij welke klant en voor welk bedrag, met een knop om hem
tóch in te lezen.

**Waarom op inhoud en niet op naam.** `F000065.pdf` en
`kopie-van-F000065.pdf` zijn hetzelfde bestand. Een hash over de bytes weet dat,
een naam niet. Lukt het hashen niet (geen https, onleesbaar bestand), dan valt
hij terug op naam+grootte en wordt dat er in het logboek bij gezet — dan doet
het niet alsof het zeker weet.

**Waarom in `factuurState` en niet in localStorage.** Het gaat mee naar Drive,
dus op je andere computer weet de app óók welke PDF's je al hebt gehad. Dat is
het halve punt van de vraag.

**Wat er wel en niet in komt.** Opgeslagen en overgeslagen — de twee momenten
waarop jij een besluit neemt. Een overgeslagen bestand telt níet als dubbel:
dat mag je later alsnog inlezen. Een dubbele die je overslaat komt er niet bij,
want die staat er al van de keer dat hij wel binnenkwam. Ging het lezen mis,
dan staat dat bij de regel, ook als je hem daarna met de hand hebt ingevuld.

**Vormgeving.** Geen nieuwe rijvorm bedacht: een logboekregel ís de bestaande
lijstkaart `.uren-mcard` (links waar het over gaat, rechts de status) met de
bestaande `.fac-pill`. Nieuw is alleen `cursor:default` — erbij gezet in de
regel waar `.fac-mcard-deb` al stond, want dat is precies dezelfde uitzondering
— en `gap:8px` op de lijst. Nagemeten op echte 375px (modaal 358px, lange naam
afgekapt binnen de kaart, geen zijwaartse scroll) en op 1500px.

**Bewijs.** 57 tests, waaronder: zelfde inhoud onder een andere naam geeft
dezelfde hash, de kopie wordt als dubbel gemerkt en is nooit verstuurd, een
overgeslagen bestand telt niet als dubbel, en "toch inlezen" haalt hem alsnog op.

**Bestanden**: `index.html` — `factuurState.scanLog` + hydratie,
`facScanVingerafdruk()`/`facLogZoek()`/`facLogSchrijf()`/`facScanMerkDubbel()`,
`#facScanLogModal` + `facScanLogRender()`, menu-item Inleeslogboek;
`test.html` — 3 tests; `sw.js` → `herling-v80`

**Niet doen**: een dubbele stilzwijgend uit de stapel gooien. Je moet kunnen
zien dát er iets is overgeslagen en waarom — anders mis je een factuur zonder
het te merken.

## 2026-09-08 · Een rem vóór het herhalen, en de stapel loopt onbewaakt door

**Probleem.** Na de vorige entry kwam er bij de tweede factuur een 429:
*"Limiet bereikt"*. De statistieken van Google lieten zien wat er gebeurde:
pieken van 7–8 verzoeken vlak achter elkaar, eerst 503's en daar bovenop 429's,
en een success rate van 0%. Het verbruik zelf was minimaal (piek 2,6K input
tokens) — het dagquotum was dus nergens in zicht.

**Oorzaak: de vorige entry.** Vier pogingen per bestand bij een 503, drie
bestanden achter elkaar, en er staan er twaalf in een minuut. Dan slaat de
limiet per minuut dicht. Het geduld dat 503 moest opvangen produceerde 429.

**Beslissing.** De rem staat nu vóór het herhalen: `_geminiSlot()` laat er nooit
meer dan `_geminiPerMin` in een voortschrijdende minuut door, hoeveel er ook
klaarstaan. Herhalen gebeurt binnen die rem, niet eromheen.

**Waarom de rem zichzelf bijstelt.** Wat de gratis laag toestaat verschilt per
model en verandert; de badge zei "15/min" maar bij 7–8 ging het al mis. In
plaats van een getal te raden begint hij op 6, gaat bij een 429-per-minuut twee
omlaag (bodem 3) en na acht gelukte verzoeken één omhoog (plafond 12). Zo vindt
hij zelf de goede snelheid.

**Twee dingen die daarbij bovenkwamen.** (1) De badge telde alleen gelúkte
verzoeken — precies waarom hij laag stond terwijl de limiet dichtsloeg. Nu telt
elke poging, want die belasten allemaal je quotum. (2) De 429-melding gooide
Google's eigen tekst weg en noemde "1500/dag of 15/min", terwijl je juist wilt
weten wélke. `_aiParseErrorResponse()` geeft nu `{msg, perDag, wacht}` terug —
inclusief Google's `Retry-After`, zodat we niet hoeven te gokken hoe lang.

**Onbewaakt doorlopen.** De wachtrij doet niet één maar zes rondes, oplopend van
20s naar 10 minuten (samen ruim een half uur). Je kunt het venster open laten en
weglopen; in beeld staat dan dat het druk is en dat hij vanzelf verder gaat. Een
dagquotum is de uitzondering: dat wacht je niet weg, dus `_aiTijdelijk()` geeft
daar `false` en de stapel stopt ermee.

**Wat níet is veranderd.** Opslaan blijft per factuur. De vraag of complete,
niet-dubbele facturen automatisch opgeslagen mogen worden staat nog open —
dat is een aparte afweging, want een verkeerd gelezen bedrag komt dan ongezien
in het btw-overzicht.

**Bewijs.** 41 tests op de API-kant (rem houdt echt tegen, 429 zet de rem omlaag,
dagquotum wordt niet herhaald, elke poging telt, Retry-After overgenomen) en 40
op de wachtrij (zeven pogingen over zes rondes, dagquotum stopt meteen, een al
getoonde fout wordt met rust gelaten).

**Bestanden**: `index.html` — `_geminiSlot()`/`_geminiRemOmlaag()`/
`_geminiRemOmhoog()`/`GEMINI_VENSTER`, `_aiParseErrorResponse()` geeft een
object, `_aiBumpUsage()` verhuisd naar `_geminiFetch()`, `FAC_SCAN_RONDES`;
`sw.js` → `herling-v79`

**Niet doen**: de rem hoger zetten om een stapel sneller binnen te halen. Dat is
precies de fout die deze entry repareert — sneller vragen levert bij een limiet
minder op, niet meer.

## 2026-09-08 · Bij een 503 wachten we nu net zo lang als we beloven

**Probleem.** Een factuur uit een stapel viel om met *"Gemini-server tijdelijk
niet beschikbaar (status 503). Probeer over een minuut opnieuw."* 503 is
overbelasting aan Google's kant — niet een te zwaar verzoek (dat geeft 400) en
niet een limiet (429). Op de gratis laag komt het regelmatig voor.

**Twee dingen aan onze kant maakten het erger.** De herkansing in `callGemini()`
wachtte 1,2s en 3,5s: samen krap vijf seconden, terwijl de melding eronder
"probeer over een minuut opnieuw" zei. En de wachtrij van vanochtend vuurde de
bestanden zonder tussenruimte achter elkaar de deur uit — precies het ritme
waarop een overbelaste server je afwijst.

**Beslissing.** Drie dingen:
1. Eén gedeelde `_geminiFetch()` voor de gewone én de streaming-aanroep, met
   vier pogingen die oplopen (2s, 5s, 12s) en ruis erop, zodat een stapel niet
   synchroon tegen dezelfde dichte deur loopt. De streaming-kant had daarvóór
   helemaal geen herkansing.
2. Een adempauze tussen twee bestanden (700ms), en 6s als het net misging omdat
   het druk was.
3. Een tweede ronde aan het eind van de stapel voor wat *tijdelijk* misging,
   zodat je er zelf niets voor hoeft te doen.

**Waarom alleen bij 503 en niet bij 500.** Een 500 kan aan het verzoek zelf
liggen; dan is vier keer hetzelfde sturen zonde van de tijd én van je quotum.
Voor de vraag of iets later nog eens geprobeerd mag worden geldt een ruimere
regel (`_aiTijdelijk()`: netwerkfout, 429, 5xx) — dat is een andere afweging,
want daar zit al een lange pauze tussen.

**Waarom niet alles automatisch herkansen.** Alleen bestanden die je nog niet in
beeld hebt gehad. Heb je de foutmelding gezien, dan kun je het formulier
ondertussen met de hand hebben ingevuld, en dat mag een late scan niet
overschrijven. Daar blijft de knop "probeer opnieuw" voor.

**Bewijs.** 30 tests op de API-kant (twee keer 503 dan raak, vier pogingen en
dan opgeven met de juiste melding en statuscode, een 4xx die níet herhaald
wordt, netwerkfout herkend) en 37 op de wachtrij, waaronder de stille tweede
ronde, het overslaan van blijvende fouten, en dat een al getoonde fout met rust
wordt gelaten.

**Bestanden**: `index.html` — `_geminiFetch()`/`_aiTijdelijk()`/`GEMINI_WACHT`,
`facScanLus()` met pauzes en tweede ronde; `sw.js` → `herling-v78`

**Niet doen**: de wachttijden verder oprekken om 503 helemaal weg te krijgen.
Voorbij een halve minuut per bestand wordt een stapel onwerkbaar; de echte
oplossing voor structurele drukte is de betaalde laag.

## 2026-09-08 · Een stapel facturen inscannen, één voor één nakijken

**Probleem.** De scanner las één bestand per keer. Voor het bijwerken van een
administratie is dat de verkeerde maat: je hebt een map met tien oude facturen,
niet één.

**Beslissing.** Het bestandsveld staat op `multiple` en de gekozen bestanden gaan
in een wachtrij (`facScanRij`). Ze worden **één voor één** gelezen door een lus
die op de achtergrond doorloopt terwijl jij de vorige nakijkt — na de eerste is
er in de praktijk geen wachttijd meer. De kop telt mee ("Factuur 2 van 5"), de
hoofdknop wordt "Opslaan en volgende", en er is een **Overslaan** ernaast.

**Waarom niet parallel.** De gratis laag staat 15 verzoeken per minuut toe. Een
stapel van twintig tegelijk loopt daar dwars doorheen, en dan mislukken er een
paar om een reden die niets met de factuur te maken heeft. Sequentieel is snel
genoeg omdat de gebruiker het traagste onderdeel is.

**Waarom nog steeds één formulier per factuur.** De hele reden dat de scanner een
*voorstel* invult en niet direct opslaat, is dat één verkeerd overgenomen bedrag
in de btw-aangifte belandt. Een stapel verandert daar niets aan; alleen het
kiezen van de bestanden gebeurt in één keer.

**Wat een enkele fout doet.** Niets aan de rest. Een te groot bestand of een
mislukte scan krijgt zijn eigen regel in beeld met "probeer opnieuw"; de lus gaat
ondertussen door met de volgende. Sluiten breekt de lus af via een
generatieteller (`facScanGen`); een verzoek dat al onderweg is loopt af en wordt
weggegooid.

**Bewijs.** 25 tests op de toestandsmachine: volgorde, te groot bestand, mislukte
scan, opnieuw proberen, afbreken bij sluiten, en dat een herteken-actie het
formulier niet overschrijft waar iemand in typt.

**Bestanden**: `index.html` — `facScanRij`/`facScanLus`/`facScanToon`/
`facScanVolgende`/`facScanHerkans`, `facOudKop()` voor kop en voetknoppen,
`multiple` op `#facScanInput`; `test.html` — 4 tests; `sw.js` → `herling-v76`

**Niet doen**: de facturen parallel inlezen om het sneller te maken, of de
resultaten in één lijst tonen om in bulk op te slaan. Beide halen het nakijken
per factuur weg, en dat is precies waar de scanner voor bestaat.

**Bijkomend**: "Opslaan en volgende" (de knop voor een handmatige stapel) is
verborgen zolang er een wachtrij loopt — de stapel heeft dan zijn eigen
"volgende" en twee betekenissen naast elkaar leest verkeerd.

## 2026-09-08 · Klantnamen gaan gemaskeerd naar Gemini

**Probleem.** De AI-functies praten rechtstreeks vanuit de browser met de
Gemini-API, op de gratis laag. Daar mag Google de inhoud voor training
gebruiken. Bij "slim toevoegen" is dat onschuldig, maar de wekelijkse review
stuurt de complete takenlijst mee — met klantnamen erin.

**Beslissing.** Een `aiMaskerder()` om `callGemini()`/`_streamGemini()` heen.
Klantnamen, contactpersonen, mailadressen, adressen, KVK- en btw-nummers uit de
klantenkaart worden vervangen door `{{KLANT_1}}`-achtige tokens; het antwoord
wordt lokaal weer teruggezet. Aan/uit in Instellingen → *Namen maskeren*,
standaard aan. Aangezet bij "slim toevoegen" en de wekelijkse review.

**Waarom geen NER en geen proxy.** Namen herkennen die *niet* in de klantenkaart
staan vraagt een taalmodel of een woordenlijst, en dat past niet in een app
zonder build step. Een proxy (het gangbare advies) betekent infrastructuur die de
data óók ziet — dat verplaatst het probleem. Wat we wél kennen, kennen we exact,
en dat is zoeken-en-vervangen zonder model.

**Waarom opt-in per aanroep en niet standaard aan.** De factuurscan stuurt een
PDF mee en heeft de klantenlijst juist leesbaar nodig om de naam op de factuur
ertegen te matchen. `callGemini()` slaat maskeren daarom sowieso over zodra er
een bestand meegaat, maar de vlag staat per aanroepplek zodat het een bewuste
keuze blijft.

**Drie dingen die stuk gingen zonder dat je het ziet.** (1) Systeemprompt en
gebruikerstekst moeten door *dezelfde* kaart, anders krijgt de klantenlijst een
ander token dan de naam in de zin en kan het model ze niet meer koppelen.
(2) Bij streaming breekt een token over twee chunks (`{{KLA` + `NT_1}}`);
`_aiKnippunt()` houdt de staart vast tot de rest binnen is. (3) Langste term
eerst vervangen, anders maakt "Staedion" van "Staedion B.V." een halve naam.

**Wat het niet is.** Geen slot. Bedragen, uren, deadlines en omschrijvingen gaan
onveranderd mee, en een naam die nergens in de klantenkaart staat wordt niet
herkend. Wie dit echt dicht wil, neemt een betaalde API-key — daar vervalt de
traindata-clausule, ook voor de factuurscan die niet te maskeren is.

**Bestanden**: `index.html` — maskeerblok vóór `callGemini()`, `maskeer`-vlag in
`callGemini()`/`_streamGemini()`, schakelaar in `toggleAppInstellingen()`;
`test.html` — 7 tests; `sw.js` → `herling-v75`

**Niet doen**: het maskeren aanzetten bij `facScanVraagGemini()`. Die stuurt een
PDF en moet de klantnamen kunnen lezen.

## 2026-09-07 · Urenregel: de status onder het getal, niet naast de klant

**Wijziging op de entry hierboven.** De regel stond als *klant · status · uren*. De statuspil hoort echter bij het getal, niet bij de klantnaam: hij zegt of dié uren gefactureerd zijn. Nu twee kolommen — links waar het over gaat (klant, met de omschrijving eronder), rechts het getal met de status eronder, allebei rechts uitgelijnd.

**Bewijs.** Gemeten op 375px: kaart 67px (van 93px in de oorspronkelijke vorm), pil precies onder het getal uitgelijnd, en een lange klantnaam kapt af met een beletselteken in plaats van de rechterkolom weg te duwen.

**Bestanden**: `index.html` — `.uren-mcard` als twee kolommen (`.links` / `.rechts`); `sw.js` → `herling-v48`

## 2026-09-07 · Het sluitkruis overleeft een kop die opnieuw wordt gezet

**Probleem.** In "Nieuwe registratie" ontbrak het kruisje. Het stond er wél tot je de modaal opende: `urenNewEntry()` zet de titel met `textContent`, en dat wist álle kinderen van die kop — inclusief het kruisje dat er sinds vanochtend in hangt.

**Beslissing.** Niet elke titelregel aanpassen, maar één observer: zodra een `.modal-bg` de klasse `open` krijgt, kijkt `zetModalSluitknoppen(modal)` of er nog een kruisje in zit en zet het er anders opnieuw in. De functie slaat een modaal die er al een heeft over, dus herhalen is gratis en er komt er nooit een tweede bij.

**Waarom een observer en niet elke opener aanpassen.** De modalen gaan open op ruim twintig plekken, en een nieuwe opener zou de val opnieuw kunnen inlopen. Dit vangt het bij de enige gebeurtenis die ze delen: de klasse `open`.

**Bewijs.** Alle 19 modalen met een voet nagemeten: elk precies één kruisje, geen enkele zonder. Ook via de echte openers (`urenNewEntry`, `openChecklistItemModal`): één kruisje, niet twee.

**Bestanden**: `index.html` — `zetModalSluitknoppen(root)` met een overslaan-als-aanwezig, plus een `MutationObserver` op `class`

**Niet doen.** De titel met `innerHTML` zetten om het kruisje mee te schrijven. Dan staat de knop op twintig plekken in de code in plaats van op één.

## 2026-09-07 · Urenregels: één regel per registratie, en de dagen chronologisch

**Probleem 1 — de dagvolgorde.** De registraties stonden met de nieuwste dag bovenaan. Voor een logboek is dat de gewone volgorde, maar dit is een week- of maandoverzicht waarin je je eigen week naloopt — en dan lees je van maandag naar vrijdag. Bij een maand betekende het dat je onderaan begon.

**Beslissing.** `days` sorteert chronologisch. Dat is één lijst voor beide periodes én voor beide breedtes: de mobiele kaarten en de tabel op een bureaublad lezen nu allebei van boven naar beneden in de tijd.

**Probleem 2 — de hoogte.** Een registratie was drie regels boven elkaar (klant, omschrijving, statuspil) met het aantal uren ernaast in 19px: het grootste getal op het scherm, voor de eenheid die het minst wisselt. Vier registraties vulden een scherm.

**Beslissing.** Klant, status en uren op één regel; de omschrijving alleen daaronder als er een is. Het getal gaat naar `var(--fs-basis)` — dezelfde maat als het bedrag op een factuurkaart, want het is hetzelfde soort ding: het getal op een regel in een lijst. **Kaart van 93px naar 64px**, en zonder omschrijving korter.

**Bewijs.** Gemeten op 375px: kaart 93 → 64px, uren 19 → 15px, en de maandweergave loopt van "Di 1 sep" naar "Ma 7 sep" in plaats van andersom.

**Bestanden**: `index.html` — `urenRenderRegView()` (dagsortering en kaartmarkup), `.uren-mcard` en zijn onderdelen; `sw.js` → `herling-v46`

**Niet doen.** De omschrijving inline achter de klantnaam zetten om écht alles op één regel te krijgen. Op 375px blijft daar na de naam, de pil en het getal geen leesbare breedte voor over.

## 2026-09-07 · Een stijlgids, omdat het steeds dezelfde knop met andere tekst is

**Probleem.** Vandaag ging het vier keer over hetzelfde soort fout: het ⋯ had drie maten, de filterknop twee, het taakmenu stond op 15px terwijl elk ander menu 13px is, en twee keer bleef er een schaduw op een knop staan die randloos hoorde te zijn. Steeds omdat een nieuw onderdeel een eigen CSS-blok kreeg in plaats van aan te sluiten bij de bestaande regel.

**Beslissing.** [`docs/stijlgids.md`](stijlgids.md): per soort onderdeel — icoonknop, tekstknop, menu-item, kaart, pil, invoerveld, modaal — wat de maat is, welk token erbij hoort en op welke plek het staat. Gemeten met `getComputedStyle` op 375px en 1400px, niet uit het hoofd opgeschreven.

**Met een lijst bekende afwijkingen.** Wat er nu níét klopt staat er ook in: `.client-filter-btn` op 12px terwijl de trap 13 is, `.cl2-item-meta` op 11px (onder de eigen ondergrens), `.btn`, `.btn-sm` en `.btn-xs` die op een telefoon alle drie op 14px uitkomen omdat twee `!important`-regels met dezelfde specificiteit elkaar overschrijven. Zo hoeven die niet opnieuw ontdekt te worden, en is duidelijk dat ze geen voorbeeld zijn om te volgen.

**De regel die het bij elkaar houdt.** Nieuw onderdeel van een bestaande soort? Zet je selector **bij** de bestaande regel. Niet een eigen blok — daar komen die drie maten vandaan.

**Waarom een apart bestand en niet in `mobile.md`.** Dat bestand gaat over de schaal en de afwegingen (waarom 44px, waarom zes trappen). De stijlgids gaat over wat je moet typen, en geldt op beide breedtes. `CLAUDE.md` verwijst er nu naar bij de CSS-conventies: lezen vóór vormgeefwerk.

**Bestanden**: `docs/stijlgids.md` (nieuw), `CLAUDE.md` (bestandenboom, CSS-conventies, toolingtabel), `docs/mobile.md` (verwijzing bovenaan)

**Niet doen.** De afwijkingenlijst stilzwijgend wegwerken in een grote opruimbeurt. Per familie, met een meting ervoor en erna, en een entry hier.

## 2026-09-07 · De acties van een taak achter één knop

**Probleem.** Elke taak droeg vijf icoonknoppen — vastpinnen, in-/uitklappen, bewerken, archiveren, verwijderen — en op een telefoon stonden die op een eigen regel onder de titel. Vijf knoppen per kaart is meer bediening dan inhoud, en bij twintig taken zijn dat twintig van die regels.

**Beslissing.** Op mobiel gaan ze achter één ⋯ in de taakrij zelf, rechts naast de titel. Dat scheelt **28px per kaart** (196 → 168px) én haalt de bediening uit een kaart die over de inhoud hoort te gaan. Op een bureaublad blijft de rij staan: daar is de ruimte er, en een muis wijst exact aan wat een vinger moet zoeken.

**Het menu hangt aan `document.body`, niet in de kaart.** Een kaart is klein en staat in een lijst die schuift; een menu erbinnen zou tegen de rand aanlopen of afgeknipt worden. `urenPlacePopover()` zet het onder de knop en klapt het naar boven als daar geen ruimte is — hetzelfde als bij de filterknoppen van Uren en Facturen.

**De labels zijn woorden geworden.** In de rij waren het vijf icoontjes zonder tekst; in het menu staat er wat ze doen, en of het "Vastpinnen bovenaan" of "Losmaken van bovenaan" is hangt af van de taak. Verwijderen staat onder een scheidingslijn en in rood.

**Bewijs.** Gemeten op 375px: knop 44×44 op 13px van de kaartrand, menu 200×245 volledig in beeld, vijf regels met de juiste labels, en "Vastpinnen bovenaan" pint de taak ook echt (één vastgepind → twee). Op 1400px is de knop verborgen en staat de rij icoontjes er onveranderd.

**Bestanden**: `index.html` — `.cl2-item-meer` in `clItemHtml()`, `toggleClItemMenu()` / `closeClItemMenu()`, zeven acties in `APP_ACTIONS`, `.cl2-item-menu*` in de basis- en de mobiele laag, derde rasterkolom in `.cl2-row-head`; `sw.js` → `herling-v44`

**Niet doen.** Hetzelfde met de subtaakrijen. Daar staat één kruisje per regel, en dat is precies het aantal dat nog geen menu nodig heeft.

## 2026-09-07 · De voortgangskaart telt binnen de gekozen klant

**Probleem.** Kies je een klant, dan filtert de lijst mee maar bleef de kaart erboven het totaal van alles tonen: "78 van 103 taken afgerond" boven twee zichtbare taken. Het cijfer waar je naar keek ging niet over waar je naar keek.

**Beslissing.** De kaart telt binnen het klantfilter. Staat er een klant gekozen, dan staat zijn naam in de eyebrow — "Voortgang · Staedion" — want "0 van 2 afgerond" is anders een raadsel naast een lijst van honderd taken.

**Waarom alleen dit filter en niet de andere.** Het klantfilter is een keuze van *bereik*: ik werk nu voor Staedion. Prioriteit, periode en het zoekveld zijn zoekhulpen — een *lens*, geen bereik. Zou de ring daarop meebewegen, dan verspringt hij bij elke tik en zegt "3 van 3 afgerond" niets meer. Dezelfde scheiding zit al in de filterbalk: de telling daar verschijnt alleen als je filtert, en dan is dat precies het antwoord op wat je net deed.

**Het archief blijft ongefilterd geteld.** Die weergave laat sowieso alles zien, ongeacht de gekozen klant; een knop die een ander aantal noemt dan wat erachter zit is erger dan een knop die het totaal noemt.

**Geldt op beide breedtes** — dit is geen mobiele kwestie maar een rekenfout in wat het getal beweert te zijn.

**Bewijs.** Gemeten: zonder filter "1 van 10 · 10% · 4/6 subtaken" bij negen zichtbare taken; met Bakkerij Roos & Zn "0 van 2 · 0% · 2/3 subtaken" bij twee zichtbare taken; filter weg → weer het totaal.

**Bestanden**: `index.html` — `renderChecklistModule()` geeft een op klant gefilterde set aan `renderChecklistHero()`, plus de klantnaam voor de eyebrow; `sw.js` → `herling-v43`

**Niet doen.** De hele filterset op de kaart loslaten. Dan is het geen voortgang meer maar een telling van je zoekresultaat, en dat staat al in de filterbalk.

## 2026-09-07 · Wie de actieve notitie verandert, moet ook het scherm meenemen

**Probleem.** Verwijder je op een telefoon de notitie die je open hebt, dan bleef je in de editor staan — met "Geen notitie geselecteerd" als enige inhoud. Een scherm van een pagina die er niet meer is, terwijl je naar de lijst wilde.

**Oorzaak, en het is de tweede keer.** Deze module toont op een telefoon óf de boom óf de editor, en dat hangt aan één klasse: `mobile-editing` op `#mod-notes`. Alleen `selectNote()` zette die klasse. Vandaag bleek eerst dat een notitie maken vanuit een sjabloon hem niet zette (je maakte iets aan en zag niets gebeuren), en nu dat verwijderen hem niet weghaalt.

**De regel die eruit volgt:** elke functie die `notesState.activeId` verandert, hoort ook te zeggen welk van de twee schermen daarbij hoort. Aanzetten bij openen en aanmaken, uitzetten bij verwijderen — en bij *ongedaan maken* weer aan, want dan sta je weer in die notitie.

**Bestanden**: `index.html` — `deleteNode()` haalt `mobile-editing` weg als de verwijderde notitie de actieve was, en de undo-tak zet hem terug; `sw.js` → `herling-v42`

**Niet doen.** De klasse ergens centraal "afleiden" uit `activeId`. Openen en aanmaken zetten hem aan, terug naar de lijst zet hem uit terwijl `activeId` gewoon blijft staan — die twee zijn niet hetzelfde en horen apart te blijven.

## 2026-09-07 · Notities krijgt een prullenbak

**Probleem.** Notities was de enige module waar iets écht weg was. Een taak gaat naar het archief, een factuur heeft een versiegeschiedenis, maar een verwijderde notitie had alleen de ongedaan-knop in de toast — en die is na een paar seconden weg. Daarna was de tekst er niet meer, en op een telefoon is een misgetikte prullenbak-knop zo gebeurd.

**Beslissing.** `notesState.prullenbak`: een lijst met `{node, ouderId, verwijderdOp}`, gevuld door `deleteNode()`. De toast blijft wat hij was — die is nog steeds de snelste weg terug — maar wat je daarna nog kunt doen staat nu in een venster: terugzetten of definitief weggooien, plus "Prullenbak legen".

**Terugzetten probeert de oude plek.** `ouderId` onthoudt in welke groep het zat; bestaat die groep nog, dan gaat het daarheen (en klapt hij open), anders onderaan de lijst. Een groep die je terugzet neemt zijn notities mee — hij is als geheel opgeslagen.

**Twee ingangen, want twee schermen.** Op een telefoon zit de prullenbak in het ⋯-menu, met het aantal erbij: "Prullenbak (2)". Op een bureaublad is dat menu verborgen, dus daar staat hij als derde knop in de kop "Pagina's", achter nieuwe notitie en nieuwe groep. Zonder die tweede ingang zou de webversie de prullenbak helemaal niet kunnen bereiken.

**Definitief weggooien vraagt om bevestiging** — en dat is de enige plek in deze module waar iets echt verdwijnt.

**Bewust geen automatische opruiming.** Een prullenbak die zichzelf na dertig dagen leegt gooit data weg zonder dat iemand het vraagt, en dat is precies wat hier voorkomen moest worden. De keerzijde: hij groeit. Een notitie kan geplakte afbeeldingen bevatten, en die gaan als data-URL mee naar Drive. Wie veel weggooit doet er goed aan de bak af en toe te legen — de knop staat er, met het aantal erboven.

**Bewijs.** Nagemeten op 375px: verwijderen haalt de notitie uit de boom en het menu toont "Prullenbak (1)"; het venster noemt de titel en het tijdstip; terugzetten brengt hem terug in de boom en laat de bak leeg achter; definitief weggooien laat hem verdwijnen en verbergt de knop "legen". Op 1400px staat de derde knop in de kop en werkt hetzelfde venster.

**Bestanden**: `index.html` — `notesState.prullenbak` met hydratiestap, `deleteNode()` vult de bak, `notesPrullenbakTerug/Weg/Legen()`, `renderNotesPrullenbak()`, modaal `#notesPrullenbakModal`, vijf acties in `APP_ACTIONS`, knop in de kop "Pagina's", `.notes-bak-*` stijlen; `sw.js` → `herling-v41`

**Niet doen.** De bak stilletjes begrenzen op een aantal items of een aantal dagen. Wie dat wil, hoort het te kiezen — niet te ontdekken.

## 2026-09-07 · Notities krijgt een ⋯-menu, en de editor houdt alleen wat over de pagina gaat

**Probleem.** Notities was de enige module zonder ⋯-menu. Alles wat niet in de balk paste bestond gewoon niet: de boom in- of uitklappen kon alleen groep voor groep, en sorteren kon helemaal niet — de volgorde was die van de boom. Tegelijk stond in het editscherm nog steeds de bediening van de lijst: een klantfilter en een knop voor een nieuwe groep, terwijl je naar één pagina kijkt.

**Beslissing — één knop, twee inhouden.** Op een telefoon staan de lijst en de editor op hetzelfde scherm, dus wat in het menu hoort hangt af van waar je bent. In de lijst gaat het over de lijst (alles in-/uitklappen, sorteren); in de editor over de pagina die je open hebt (aan welke klant hij hoort). Dezelfde afspraak als bij Facturen, waar de balk per tab meewisselt. De knop zelf staat op de vaste plek uit 2026-09-06: rechtsboven, 44×44, `var(--icoon)`.

**Sorteren** krijgt een eigen veld, `notesState.sortBy`, met drie standen: *handmatig* (de sleepvolgorde, en dan raakt `notesSorteer()` de lijst niet aan), *laatst gewijzigd* en *naam A–Z*. Groepen staan altijd boven losse pagina's: een groep heeft geen eigen datum en zou anders tussen de pagina's door schuiven.

**In-/uitklappen pakt beide lagen.** De boom heeft er twee: klantgroepen (`clientGroupCollapsed`) en mappen daarbinnen (`collapsed`). Alleen de bovenste dichtklappen laat de mappen eronder openstaan, en dan klapt "alles uitklappen" iets uit wat al open was.

**De klantbalk in de editor is weg.** Die stond er sinds vanochtend als kiezer voor de klant van de notitie, maar een hele balk voor iets wat je zelden wijzigt is te veel; hij zit nu in het ⋯. Daarmee gaat in de editor de hele topbalk uit — filter, mapknop en kiezer waren de enige inhoud.

**Het ⋯ staat bewust buiten die topbalk in de DOM.** Een `display:none` op een ouder haalt ook het kind uit beeld, hoe vast het zelf ook gepositioneerd is; in de topbalk zou het menu in de editor verdwijnen — precies waar de klantkeuze nu in zit.

**Bewijs.** Gemeten op 375px: knop 44×44 op `right:12px`/`top:4px` met een icoon van 20px, menu 260px breed en volledig in beeld, "Alles inklappen" brengt vier open groepen naar nul, en in de editor toont het menu de klantenlijst met een vinkje op de huidige — wisselen werkt en de notitie verhuist in de lijst mee. Op 1400px is de knop verborgen en staat de topbalk er gewoon.

**Bestanden**: `index.html` — `notesSorteer()` + `NOTES_SORTEER`, `notesState.sortBy` met hydratiestap, `toggleAlleNoteGroepen()`, `renderNotesOverflowMenu()`/`toggleNotesOverflow()`, vier nieuwe acties in `APP_ACTIONS`, `.notes-overflow*` in de basis- en de mobiele laag; `sw.js` → `herling-v40`

**Niet doen.** Het menu vullen met alles wat kan. Wat in de lijst hoort staat in de lijst, wat over één pagina gaat in de editor — en wat je met één tik in de balk kunt doen, hoort niet in een menu.

## 2026-09-07 · Tabstrip op een telefoon: onderstreept in plaats van pillen

**Probleem.** De tabs stonden op `flex: 1 1 auto` en groeiden dus vanaf hun eigen tekstbreedte: Facturen 66px, Debiteuren 79, Btw 38, Verzonden 78, Klanten 60. Vijf omlijnde vakken van vijf verschillende maten, vlak onder de topbalk, boven een scherm dat al vol staat met kaarten met randen.

**Waarom gelijke pillen niet konden.** Er is 351px beschikbaar; vijf gelijke vakken met tussenruimte geeft 67px per tab. "Debiteuren" is op 12px al 64px breed plus 2px rand — één pixel speling. Dat is te weinig om op te bouwen: een ander toestel of een terugvalfont en het kapt af. Kleiner zetten kon (11,5px, de ondergrens uit `docs/mobile.md`), maar dan lever je leesbaarheid in voor een vorm.

**Beslissing.** De pillen gaan eraf. Geen randen, geen achtergrond, geen tussenruimte; de balk krijgt één onderrand en de actieve tab een mintstreepje dat op die lijn valt. **De ruimte die je daarmee wint is precies de ruimte die je tekortkwam** — de randen en de tussenruimte — dus de vakken kunnen wél gelijk zijn zonder de tekst te verkleinen. Gemeten: Facturen 5 × 69px, Uren 4 × 87,8px, alle tabs 44px hoog, niets afgekapt.

**Meegenomen: 14px die nergens voor stond.** Naast de tabs stond nog het balkje waar de filterknop uit verhuisd is (2026-09-06). Leeg, maar het nam wel breedte in. `.uren-filters:empty { display: none }`.

**Waarom Uren mee verandert.** `.uren-tab` is dezelfde component in beide modules. Wat er in Facturen goed staat, hoort in Uren net zo te staan — daar zijn het vier tabs met ruim genoeg speling.

**Op een bureaublad verandert er niets:** daar blijft het een segmented control met pillen in een eigen spoor. Daar is de ruimte er wel, en de balk staat naast andere knoppen die dezelfde vorm hebben.

**Bestanden**: `index.html` — `.uren-viewbar` / `.uren-tabs` / `.uren-tab` / `.uren-tab.active` in de mobiele laag herschreven, de losse regel `.uren-tab.active { background: var(--navy) }` verderop verwijderd (restant van de pilvorm), `.uren-filters:empty`; `sw.js` → `herling-v33`

**Niet doen.** De tabs alsnog gelijk maken *met* pillen door de tekst naar 11,5px te brengen. Dat is de ondergrens van de schaal, en je betaalt hem hier voor een rand die niets toevoegt.

## 2026-09-07 · De factuureditor: geen zijwaartse schuif meer, en een knoppenbalk in twee kolommen

**Probleem 1 — de pagina kon opzij.** Op 2026-09-06 is `overflow-x: hidden` gezet op `html`, `body`, `#appScreen`, `.main-area`, `.module` en de modals. De factuureditor ontsnapte daaraan: zijn inhoud zit in `#facEditorBody`, een div met een eigen `overflow-y: auto` in een style-attribuut. Zodra één as op `auto` staat maakt de browser de andere óók schuifbaar — dus daar kon je alsnog slepen.

**Beslissing.** `#facEditorBody` krijgt op mobiel `overflow-x: hidden`. Dat mag: het enige brede onderdeel is de regeltabel, en die staat op een telefoon als blokjes onder elkaar. Op een bureaublad blijft `auto` staan, want daar is het wél een tabel.

**Probleem 2 — de oorzaak, niet alleen het symptoom.** Een `input[type="date"]` heeft een eigen voorkeursbreedte, en die verschilt per browser: Safari is ruimer dan Chrome. Is hij breder dan zijn kolom, dan rekt hij het raster op. In Chrome viel het niet op — vandaar dat het hier niet te reproduceren was terwijl het op de telefoon zichtbaar was. Elk datum- en tijdveld krijgt daarom `width: 100%; min-width: 0; max-width: 100%`.

**Probleem 3 — de knoppenbalk.** Op een bureaublad is dat één regel: links beheer, rechts wat je met de factuur doet, met een vuldiv ertussen. Op een telefoon werd het een rafelrand: bij een verstuurde factuur zeven knoppen over vier regels, elk 35px hoog, elk een andere breedte, en de vuldiv die "Voorbeeld" halverwege naar rechts duwde.

**Beslissing.** De vuldiv (nu `.fac-ed-actievul`) gaat op mobiel weg en elke knop wordt een half vak: `flex: 1 1 calc(50% - 4px)`, `var(--tap)` hoog. De hoofdknop krijgt de volle breedte en `order: 1`, dus hij staat altijd onderaan.

**Waarom halve vakken en niet "groei tot het past"** (zoals in de voet van een modaal): met vijf tot zeven knoppen levert dat losse knoppen op die over de volle breedte uitrekken en dan als hoofdknop lezen. Twee vaste kolommen lijnen uit, ongeacht het aantal:

```
Verwijderen        | Dupliceren
← Terug naar conc. | Voorbeeld
↧ PDF              | ✉ Opnieuw mailen
Betaling registreren (volle breedte)
```

**Bestanden**: `index.html` — `#facEditorBody { overflow-x: hidden }` en het blok `#facEditorActies` in de mobiele laag, `.fac-ed-actievul` in plaats van vier `<div style="flex:1">`, datum/tijd-velden begrensd; `sw.js` → `herling-v32`

**Niet doen.** `overflow-x: hidden` op een schuifvlak zetten zonder te kijken wát er breed is. Hier mag het omdat de tabel op mobiel geen tabel meer is; bij Uren en het kanbanbord is schuiven juist de bedoeling (zie de lijst uitzonderingen in de mobiele laag).

## 2026-09-07 · Het kruisje hoort ín de kopbalk — en waarom de eerste poging de balk sloopte

**Wat er misging.** De eerste uitwerking (2026-09-06) zette het kruisje in een eigen rij als *eerste kind* van `.modal`. Daarmee viel de gekleurde kopbalk weg in twaalf modalen. Die balk is namelijk geen eigen element: hij wordt getekend door `.modal h3:first-child` — **de kop ís de band**. Zet je er iets voor, dan matcht de selector niet meer en is de band weg. Gemeten was alles behalve of de koppen er nog hetzelfde uitzagen; dat is precies wat een voor/na-beeld in één oogopslag had laten zien.

**Beslissing.** Het kruisje gaat *in* de kop, nooit ervoor. `zetModalSluitknoppen()` kiest per modaal een gastheer, in deze volgorde:

1. is er een `.modal-kop` (eigen balk), dan daarin;
2. is het eerste kind een `h2`/`h3` (de band zelf), dan daarin;
3. anders — alleen bij Importeren — zwevend in de modaal.

In geval 1 en 2 staat het kruisje op de band en erft het `color: #fff`. Die band is in beide thema's dezelfde donkere gradient, dus dat klopt licht én donker zonder een aparte regel. Nagemeten in allebei: `rgba(255,255,255,0.9)`.

**Meegenomen: de band raakte de rand niet.** De negatieve marges die de kop tot de rand trekken stonden vast op −20px, terwijl de ene modaal 20px binnenmarge heeft en de andere 22 of 24 — bij vijf modalen bleef er een strookje achtergrond naast staan, en bij Uren zelfs asymmetrisch (20 links, 22 rechts). Bovendien droegen vijf koppen een eigen `margin` in een style-attribuut, en dat wint van elke stijlregel. `zetModalSluitknoppen()` zet nu `--modal-pad-x`/`-y` uit de echte binnenmarge en haalt die inline marge weg. **Alle achttien banden lopen nu van rand tot rand en elk kruisje staat op 9px van de rechterrand** (was 9 tot 36).

**Ook de kruisjes die er al stonden** (factuureditor, voorbeeld, sjablonen, versies, urensjablonen) doen mee: ze houden hun eigen knop en gedrag, maar krijgen dezelfde svg, dezelfde maat en dezelfde plek. Ook in modalen zónder voet, want anders zou juist daar een ander kruisje staan.

**Bewijs.** 21 modalen nagemeten op 375px en 1400px, in licht en donker: band van rand tot rand, kruisje 44×44 op 9px, geen titel die eronder doorloopt, geen zichtbare "Annuleer" meer op mobiel, en elk kruisje sluit zijn modaal. Op 1400px is het kruisje verborgen (behalve de vijf die het altijd al hadden) en staat "Annuleer" gewoon in de voet.

**Bestanden**: `index.html` — `zetModalSluitknoppen()`, `.modal > h2/h3.heeft-sluit` met `--modal-pad-x/-y`, `.modal-sluit` / `.op-band` / `.al-aanwezig` / `.los-kruis` in de mobiele laag; `sw.js` → `herling-v31`

**Niet doen.** Iets vóór de kop van een modaal zetten. `:first-child` draagt daar de hele kopbalk; wie er een element voor plaatst, haalt de band weg zonder dat een maatmeting dat opmerkt.

## 2026-09-06 · Eén KPI-kaart, en een cijfertrap die niet schreeuwt

**Probleem.** Bij Debiteuren stonden negen kaarten boven elkaar en begon de eerste factuur pas op y=627 — je moest scrollen om te zien wie er nog moet betalen. Erger: de bovenste vier en de onderste vijf waren *hetzelfde blok met andere tekst* (streepje links, label in kapitalen, bedrag, bijregel) maar met eigen maten: label 600 tegen 700 en .08em tegen .07em, cijfer op een telefoon 26px tegen 19px.

**Beslissing.** `.uren-kpi` en `.fac-aging-cel` delen nu één set regels: label `var(--fs-micro)` 600 .06em, waarde `var(--fs-cijfer)`, bijregel `var(--fs-klein)`, dezelfde binnenmarge en hetzelfde raster. Gemeten na afloop: beide kaarten 169×65px, letter voor letter dezelfde stijl. Wie er één aanpast, past ze allebei aan.

**De cijfertrap op een telefoon gaat van 26px naar 22px** — gelijk aan de desktopwaarde. 26px maakte van een KPI-strip een muur van cijfers en kostte 5px hoogte per kaart; 22px leest op armlengte nog prima.

**De bijregel valt weg op een telefoon**, voor allebei. Hij herhaalde grotendeels wat er in de lijst eronder staat ("3 facturen") en kostte een regel op élke kaart — bij Debiteuren vijf.

**En de strip boven Debiteuren gaat helemaal weg.** Die weergave heeft haar eigen samenvatting: de ouderdomskaarten, in dezelfde vorm en op dezelfde plek. "Openstaand" in de strip was bovendien de som van precies wat er direct onder stond — hetzelfde getal twee keer (zie de entry van vandaag daarover). `facRenderKpis()` had al takken per weergave; er is er één bij.

**Wat het oplevert.** De eerste factuur bij Debiteuren staat op **y=426 in plaats van y=627** — 201px minder scrollen. Kaarthoogte 70→65 (KPI) en 82→65 (ouderdom).

**Bestanden**: `index.html` — `.uren-kpi-lab/-val/-sub` en `.fac-aging-lab/-val/-sub` samengevoegd, `--fs-cijfer` mobiel 26→22, `.uren-kpis:empty{display:none}`, tak voor `debiteuren` in `facRenderKpis()`

**Niet doen.** De ouderdomskaarten weer een eigen maat geven omdat ze "kleiner mogen dan de KPI's". Het is hetzelfde blok; twee maten betekent dat het scherm er in twee talen uitziet.

## 2026-09-06 · Sluiten met een kruisje rechtsboven in plaats van "Annuleer" onderin

**Probleem.** Elke modaal had onderin een knop "Annuleer", pal naast de knop die je juist wél wilt. Twee tegengestelde acties naast elkaar, en op een telefoon kostte de minst gebruikte van de twee een half vak in de voet.

**Beslissing.** Op mobiel verhuist annuleren naar een kruisje rechtsboven — dezelfde icoonknop als het ⋯ en de trechter: `var(--tap)` in het vierkant, randloos, icoon op `var(--icoon)`. De voet houdt alleen nog de knoppen die iets dóén. Op een bureaublad verandert er niets.

**Eén keer opgezet, niet vijfentwintig keer.** `zetModalSluitknoppen()` loopt bij het opstarten alle modalen langs, zoekt in de voet de knop met "Annuleer"/"Annuleren"/"Sluiten", markeert die en hangt er een kruisje boven dat gewoon díé knop aanklikt. Alle bestaande afhandeling (dispatchers, bevestigingen, opruimen) blijft daarmee ongemoeid, en een nieuwe modaal met een annuleerknop krijgt zijn kruisje vanzelf.

**Modalen die al een kruisje hadden** (factuureditor, voorbeeld, sjablonen, versies, urensjablonen) krijgen er geen tweede: dat ene wisselt zijn losse ✕-teken voor dezelfde svg, zodat elk kruisje in de app dezelfde tekening en maat heeft.

**De rij eromheen is 0px hoog en plakt bovenaan** (`position: sticky`). Zo blijft het kruisje in beeld als de modaal zelf scrollt, én duwt het niets naar beneden. Zit er een gekleurde kop onder, dan tekent het kruisje daarop in wit; die kop schuift niet mee, dus daar wordt het kruisje in de kop gezet — anders stond het 3px van de rand (die `.modal` heeft `padding: 0`) terwijl de rest op 22px staat.

**Bleef er niets over in de voet** (Versiegeschiedenis, Categorieën, Sjabloonkiezer, Sneltoetsen), dan gaat de hele voet weg in plaats van een lege balk achter te laten.

**Bewijs.** Alle 18 modalen met een voet nagemeten op 375px: kruisje 44×44 op 20–24px van de rechterrand, geen titel die eronder doorloopt, en in alle 18 sluit het kruisje de modaal daadwerkelijk.

**Bestanden**: `index.html` — `zetModalSluitknoppen()` + `SLUIT_SVG`, `.modal-sluitrij` / `.modal-sluit` / `.modal-annuleer` / `.voet-leeg` in de mobiele laag; `sw.js` → `herling-v29`

**Niet doen.** Per modaal een eigen kruisje in de HTML zetten. Dan loopt het over vijfentwintig plekken weer uiteen — precies wat hier is opgeruimd.

## 2026-09-06 · Voetknoppen van een modaal: één regel als het past, anders de hoofdknop eronder

**Probleem.** De voet van een modaal is `[knop links] [Annuleer] [hoofdknop]`, waarbij de laatste twee in een eigen groepje zitten. Op een telefoon paste dat niet: "Lege factuur", "Annuleer" en "Factuur opstellen" zijn samen 335px op een blad van 331. Het afbreken viel tússen de groepen, dus je kreeg één losse knop links op de eerste regel en het paar rechts eronder — scheef, en de hoofdknop was met 122px het smalste doel van de drie terwijl hij het vaakst wordt aangetikt.

**Beslissing.** Op mobiel lost het groepje op in de voet (`display: contents`) en is elke knop een vak dat meegroeit (`flex: 1 1 auto`, `min-height: var(--tap)`). Daarmee valt het afbreken tussen knoppen in plaats van tussen groepen: past alles op één regel, dan verdelen ze die; past het niet, dan zakt de laatste — altijd de hoofdknop — naar een eigen regel over de volle breedte.

**Waarom niet de tekst inkorten.** Dat was de andere weg: "Opstellen" in plaats van "Factuur opstellen", en dan passen er drie naast elkaar van elk 107px. Maar dan staat de belangrijkste knop even breed als "Annuleer" en heet hij minder dan hij doet. De volle regel is duidelijker én een groter doel.

**Wat het over de hele app doet** (19 modaalvoeten, allemaal nagemeten op 375px):
- drie knoppen → twee gedeeld op regel 1, hoofdknop 313px op regel 2 (factuurwizard, mailinstellingen)
- twee knoppen → naast elkaar, samen de volle breedte (~150px elk)
- één knop → volle breedte

Alle voetknoppen zijn nu 44px hoog; ze stonden op de 40px van `.btn-sm`.

**Op een bureaublad verandert er niets.** De regels staan in de mobiele laag; daar blijft het links een knop, rechts het paar, op hun eigen breedte (28px hoog).

**Bestanden**: `index.html` — de regel `.modal-footer{flex-wrap:wrap}` in `@media (max-width:768px)` vervangen door de drie regels hierboven; `sw.js` → `herling-v28`

**Niet doen.** Per modaal een eigen voetindeling maken. Het zijn er negentien; wat hier goed staat, staat overal goed.

## 2026-09-06 · De filterknop staat overal op dezelfde plek en heeft dezelfde maat

**Probleem.** Drie modules met een trechter, drie verschillende uitvoeringen. Checklist: 44×44, randloos, icoon 20px, in de topbalk. Uren en Facturen: 37×36 met rand en schaduw, icoon 13px, een rij lager tussen de tabs. Ook het pad van het icoon verschilde. Naast elkaar gezet is dat één functie in drie gedaanten.

**Beslissing — plek.** De trechter hoort bij het kiezen van je periode, niet bij het kiezen van je weergave. Hij staat nu in de topbalk, op de rij van jaar en bedrijf (Facturen) en van periode en Week/Maand (Uren), tegen de rechterrand in dezelfde kolom als het ⋯ erboven. De tabsrij houdt alleen nog tabs.

**Beslissing — maat.** Eén regel voor elke knop die alleen een icoon draagt: `var(--tap)` in het vierkant, geen rand, geen vulling, geen schaduw, icoon op `var(--icoon)`. Die regel dekt de trechter én het kruisje van de Checklist en de filterknoppen van Uren en Facturen — vier selectors, één set getallen, zodat er niet weer drie maten ontstaan. `FILTER_ICOON` gebruikt nu hetzelfde pad als de knop in de Checklist.

**De schaduw was het addertje.** `.uren-btn` draagt `box-shadow: 0 1px 2px`. Met `border: 0` alleen bleef die schaduw een randje tekenen, en dan lijkt de knop nog steeds niet op die van de Checklist. Gemeten in `getComputedStyle`, niet gezien op een screenshot.

**De teller in de knop verdwijnt op een telefoon.** Naast een trechter die al mint kleurt zei "2" niets extra's, en de wisbare chips ernaast zeggen wél *wat* er aanstaat. Op een bureaublad, waar het woord "Filter" ernaast staat, blijft hij.

**Twee hosts bij Facturen.** De btw-weergave zet geen filterknop maar een tijdvakkiezer van zeven knoppen in de balk; die past niet in de topbalk. `facRenderFilters()` schrijft daarom in `#facFilterTop` (topbalk) óf in `#facFilterBar` (onder de tabs), nooit in allebei.

**Vier pixels.** De rij van Uren was met de trechter erbij 4px te lang, en een flexrij die mag wrappen wrapt eerder dan dat hij krimpt — de trechter belandde op een tweede regel en de balk werd 101px hoog. De 12px komen uit de zijvulling van Week/Maand (9px → 6px); die knoppen blijven ruim boven de 44px breed. Balk weer 61px, en het periodelabel wordt niet afgekapt.

**Bestanden**: `index.html` — `#urenFilterTop`/`#facFilterTop` in beide topbalken, `.uren-topfilter`, `urenRenderFilters`/`facRenderFilters` schrijven naar de nieuwe host, `FILTER_ICOON` met `class="icoon"`, gedeelde icoonknop-regel in de mobiele laag; `sw.js` → `herling-v26`

**Niet doen.** De btw-tijdvakkiezer alsnog naar de topbalk verplaatsen. En geen aparte maat meer per module: wie een nieuwe icoonknop maakt, zet zijn selector in die ene regel.

## 2026-09-06 · Checklist: een kruisje naast de trechter om te wissen

**Probleem.** Wissen kon alleen ín het filterpaneel. Wie een filter had staan en het kwijt wilde, moest eerst het paneel openen — twee tikken voor iets wat er één hoort te zijn.

**Beslissing.** Naast de trechter verschijnt een ✕ zodra er iets aanstaat, in dezelfde vorm als de knoppen ernaast: 44×44, randloos, icoon op `var(--icoon)`. Hij staat links van de trechter, want die hoort in dezelfde kolom te blijven als het ⋯ erboven; de auto-marge verhuist daarom mee naar het kruisje (`.cl2-filterwis.zichtbaar + .cl2-filterbtn { margin-left: 0 }`).

**Alleen als er iets te wissen valt.** Een kruisje bij een leeg filter belooft een handeling die niets doet. Het verschijnt bij dezelfde toestand die de trechter mint kleurt, en wist precies dat: prioriteit, periode en zoektekst.

**De klant hoort er niet bij.** `clFilters.clientId` wordt bij elke render gespiegeld uit het globale klantfilter (`activeClientFilter`), dus wissen zou daar toch niets uithalen — en dat filter heeft zijn eigen zichtbare knop met "Alle klanten" erin. Indicator, kruisje en de knop "Wissen" in het paneel dekken zo alle drie exact dezelfde verzameling.

**Bestanden**: `index.html` — `#clFilterWisBtn` in de checklist-topbalk, `.cl2-filterwis` in de basis- en de mobiele laag, klasse `zichtbaar` gezet in `renderClFilterBar`; `sw.js` → `herling-v25`

**Niet doen.** Het kruisje altijd tonen "voor de duidelijkheid".

## 2026-09-06 · Nooit twee keer hetzelfde getal in beeld

**Probleem.** De Checklist toonde "106 taken" in de filterbalk, twee regels onder "75 van 106 taken afgerond" in de voortgangskaart. Zelfde getal, zelfde scherm, en daarmee zegt geen van beide nog iets.

**Aanpak.** Niet op het oog gezocht maar gemeten: per module alle zichtbare tekstknopen doorlopen, de getallen eruit gehaald en gekeken welke waarde op twee verschillende plekken terugkomt. Dat scheidt echte herhaling van toeval (twee dingen die nu net allebei 1 zijn).

**Drie keer echt dubbel, drie keer opgelost:**

- **Checklist, filterbalk.** De telling verscheen ook zonder filter. Nu alleen nog als er gefilterd is — dan is het juist het antwoord op wat je net deed, en anders is het de kaart erboven.
- **Checklist, voortgangskaart.** "31 openstaand" is `totalActive - itemsDone`, en die twee staan één regel hoger in "75 van 106 taken afgerond". Weg; `4/6 subtaken` blijft, want dat staat nergens anders.
- **Dashboard, Checklist-kaart.** De telling op die kaart was letterlijk `s.openClCount` — dezelfde variabele als "9 open taken" in de hero erboven. Weg. De notitiekaart houdt de zijne: het aantal pagina's staat nergens anders.
- **Facturen, factuurkaart.** Het bedrag stond er twee keer als incl. en excl. gelijk zijn (0% of btw verlegd). De regel "… excl." verschijnt nu alleen bij een verschil.

**Wat bewust bleef staan.** Een factuur toont zijn datum rechtsboven én "gemaild <datum>" eronder, en die vallen vaak samen. Het zijn twee verschillende feiten (factuurdatum en verzenddatum); één ervan verbergen zodra ze gelijk zijn maakt onduidelijk óf er gemaild is. Ook gebleven: groepstellingen ("Prioriteit: hoog · 18") en dagtotalen in Uren — die tellen elk een eigen deelverzameling.

**De regel.** Staat een getal al ergens in dezelfde weergave, dan hoort het er niet nog een keer — ook niet in een andere formulering. Een afgeleide waarde (totaal min afgerond) telt als hetzelfde getal.

**Bestanden**: `index.html` — `renderClFilterBar`, de checklist-hero, `dashCountChecklist`, de factuurkaart

**Niet doen.** Een telling weghalen die de enige plek is waar dat aantal staat, of twee tellingen samenvoegen die verschillende dingen tellen. Het gaat om herhaling, niet om zuinigheid.

## 2026-09-06 · Checklist: filteren achter één icoonknop in de balk

**Probleem.** De ingeklapte filterbalk (2026-09-05) kostte een volle regel van 44px plus de marge eronder, en droeg twee dingen die er niet hoefden te staan: het woord "Filteren en zoeken" — dat is wat een trechter al betekent — en een telling die zonder filter hetzelfde getal was als in de kaart erboven.

**Beslissing.** De balk verdwijnt. Wat overblijft is een trechterknop in de topbalk, rechts naast het klantfilter, in **precies dezelfde vorm als het ⋯ erboven**: 44×44, randloos, transparant, icoon op `var(--icoon)`. Het paneel klapt uit als eerste blok van de kolom, direct onder die balk.

**Zichtbaar dat er gefilterd is.** Dat was de reden dat de dichte balk een samenvatting droeg — een filter dat je niet ziet is een valstrik. Nu draagt de knop het: de trechter kleurt mint en krijgt een stip. In het paneel staat de telling én een knop "Wissen", allebei alleen als er iets aanstaat.

**In de stroom, niet zwevend.** Een uitklappaneel en geen venster, om dezelfde reden als in 2026-09-05: bij een takenlijst wissel je vaak tussen Alles en Hoog en wil je de lijst zien meebewegen. Er is ook een technische reden: `.cl2-scroll` heeft een fade-in met `transform`, en een transform maakt een element het ankerpunt voor `position: fixed` binnen zijn subboom — een zwevend paneel begon daardoor 113px te laag. Gemeten, niet vermoed.

**Op een bureaublad verandert er niets.** Daar staat de filterrij gewoon in de kolom en blijft de knop verborgen; de telling en Wissen gedragen zich er hetzelfde (alleen bij een actief filter).

**Wat het oplevert.** De eerste taak stond op y=356, daarna op y=305 (snelveld weg), nu op **y=251**.

**Bestanden**: `index.html` — `.cl2-filterbtn` in de checklist-topbalk, `renderClFilterBar` zonder kop, `.cl2-filter-kop`/`-sam`/`-chev`/`-icoon` en hun CSS verwijderd, `.cl2-filter.open` als uitklapkaart met `order:-1`; `sw.js` → `herling-v24`

**Vervangt** de dichte samenvattingsbalk uit *2026-09-05 · Checklist op een telefoon*. De afweging daar (uitklappen boven een venster) blijft staan; alleen de dichte toestand is nu een icoon in plaats van een balk.

**Niet doen.** De knop ergens anders neerzetten dan rechts in de balk — hij hoort in dezelfde kolom als het ⋯ erboven. En het paneel niet alsnog laten zweven zonder eerst die transform op `.cl2-scroll` weg te halen.

## 2026-09-06 · Eén maat voor een icoon: het token `--icoon`

**Probleem.** Het ⋯-menu stond na de vorige stap op alle vier de pagina's op dezelfde plek, maar zag er niet even groot uit. Gemeten op 375px: in Uren en Facturen was het de tekstglyph `⋯` (inkt **16 × 3px** bij 20px/600 Inter), in Checklist en Dashboard een svg van 14px (inkt **11,2 × 2,4px**). Dat is 43% verschil in breedte, in hetzelfde hoekje van hetzelfde scherm. Bovendien was het raakvlak op het Dashboard geen 44×44 maar **28×44**: de wrapper hield 8px zijpadding uit de rasterregel, en met `border-box` bleef daar voor de knop erin 28px van over.

**Beslissing.** Eén vorm en één token. `.icoon-meer` is een svg met drie stippen (`viewBox 0 0 16 16`, `r=1.5`), en zijn maat komt uit het nieuwe token **`--icoon`: 16px op desktop, 20px op mobiel** — naast `--tap`, want het raakvlak en het icoon erin zijn twee verschillende maten. De 20px is gekozen op de grootste van de vier: de glyph in Uren gaf inkt van 16×3px, de svg op 20px geeft 16,3×3,8px. Zo groeit wat te klein was en krimpt er niets.

**Waarom een tekstglyph niet deugt als icoon.** Zijn maat hangt aan `font-size`, `font-weight` én aan welk font er daadwerkelijk laadt. Twee knoppen met dezelfde `font-size` kunnen dus alsnog verschillen, en je ziet het pas op het scherm. Een svg heeft één maat, in één token, op één plek te wijzigen.

**Gemeten na afloop**, alle vier: raakvlak 44×44 op `right: 12px`, icoon 20×20, middelpunt op x=341 en y=26 — tot op de pixel gelijk. Op desktop (1400px) staan Uren en Facturen op 32×32 met een icoon van 16px (inkt 13×3px), praktisch de oude glyphmaat op 17px.

**Meegenomen.** De regel `.dash-mobile-settings > button svg { margin-right: 2px }` was een restant van het tandwiel-met-label en duwde het icoon 1px uit het midden. En het klantfilter op het dashboard: dat heeft op mobiel de eerste regel voor zichzelf, maar de basisregel kapte de knop af op `max-width: 220px`, waardoor er 104px leeg naast stond. Alleen daar opgeheven.

**Bestanden**: `index.html` — token `--icoon` in `:root` en in de mobiele laag, nieuwe class `.icoon-meer`, vier knoppen (`#urenMenuBtn`, `#facMenuBtn`, `#clOverflowBtn`, de dashboardknop) met dezelfde svg, `padding: 0 !important` op de vier vaste wrappers; `docs/mobile.md`; `sw.js` → `herling-v23`

**Niet doen.** Terug naar een tekstglyph omdat het "korter" is in de HTML. En: `--icoon` niet oprekken tot een tweede `--tap` — het is de maat van de tekening, niet van het gebied waar je op tikt.

## 2026-09-06 · Checklist: het snelveld gaat op een telefoon uit

**Probleem.** Er stonden twee wegen naar dezelfde taak: het veld "Nieuwe taak toevoegen…" boven de lijst en de ronde knop rechtsonder. Het veld klapte bij aanraken uit tot prioriteit, klant en datum — precies wat het venster achter de ronde knop ook vraagt, maar dan geperst in een balk van 375px.

**Beslissing.** `.cl2-newitem { display: none }` in de mobiele laag, met alle uitklapregels die erbij hoorden. De eerste taak staat daardoor op y=305 in plaats van y=356: **51px minder bediening** boven de lijst.

**Op een bureaublad blijft het staan.** Daar is dit veld de enige plek om een taak toe te voegen — de ronde knop is op desktop verborgen en de topbalk heeft geen toevoegknop. Nagemeten op 1400px: het veld is er nog (880×51).

**Bestanden**: `index.html` — het blok `.cl2-newitem` in `@media (max-width:768px)` vervangen door één hide-regel

**Niet doen.** Het veld ook op desktop weghalen zonder daar eerst een andere toevoegknop te zetten.

## 2026-09-06 · Eén mobiele paginavorm: ⋯ rechtsboven, ronde + rechtsonder

**Probleem.** Elke module had zijn eigen bediening bedacht. Uren en Facturen hadden een zwevende ronde knop, Notities een `+ Nieuw` in de balk, Checklist een breed veld, het Dashboard een keuzeknop met icoon en tekst. Het ⋯-menu stond overal op een andere hoogte en een andere afstand tot de rand, en de instellingenknop op het Dashboard was een tandwiel met het woord "Instellingen" ernaast. Op een telefoon betekent dat: per pagina opnieuw zoeken waar je moet tikken.

**Beslissing.** Twee vaste plekken, op elke module dezelfde. Het **⋯-menu** staat rechtsboven op de lijn van de moduletitel (`top: 4px + safe-area`, `right: 12px`, 44×44, randloos en transparant). De **ronde +** staat rechtsonder boven de tabbalk (`right: 17px`, `bottom: 80px + safe-area`, 56×56). Het tandwiel op het Dashboard is nu ook ⋯; de brede knoppen in de balken gaan op mobiel uit.

**Waarom `position: fixed` en niet verplaatsen in de DOM.** De vier menu's hangen elk aan hun eigen dispatcher (`data-uren-action`, `data-fac-action`, `data-action`), en bij Uren en Facturen wordt het uitklapmenu aan `document.body` gehangen en bij de knop gepositioneerd — bij Checklist en Dashboard zit het juist ín de knopwrapper. Alleen de positie vastzetten laat al die verbanden intact: het menu volgt de knop vanzelf. De wrapper zelf krijgt de positie, niet de knop erin, want anders klapt het menu op de oude plek open.

**Het Dashboard is geen losse knop maar een keuze** ("Taak", "Notitie", …). Daarom is dáár de wrapper de ronde knop geworden: dan hangt het menu aan de plek waar je tikt. Label en pijltje verdwijnen, alleen de + blijft, en het menu klapt naar bóven open — rechtsonder is er onder de knop geen ruimte. De trigger staat op `position:absolute; inset:0`, want als inline-block kind stak hij 8px buiten de wrapper en stond de knop niet op één lijn met die van de andere modules.

**Plaats in het bestand.** Dit blok staat aan het eind van de mobiele laag, ná de dashboard-rasterregels. Die staan zelf op `!important`; bij gelijke specificiteit wint de laatste regel, en eerder in het bestand verloor dit blok het van het raster.

**Wat er in dezelfde ronde is meegegaan** (nog zonder eigen entry): de gekleurde kopbalk van de acht modals vult nu de volle breedte (`.modal-kop`), en de statuspillen daarop waren donker-op-donker — die krijgen op die balk een eigen, lichtere variant.

**Bestanden**: `index.html` — CSS-blok aan het eind van `@media (max-width:768px)`, `.uren-fab` toegevoegd in `#mod-notes` en `#mod-checklist`, tandwiel in `#dashMobileSettings` vervangen door het ⋯-icoon; `sw.js` → `herling-v22`

**Niet doen.** De knoppen alsnog in de DOM verhuizen naar één gedeelde balk. Dan moet elk menu opnieuw aan een dispatcher gehangen worden en breekt de plaatsing van de menu's van Uren en Facturen. En: geen aparte maten per module terugbrengen — de winst zit er juist in dat de duim op elke pagina op dezelfde plek landt.

## 2026-09-06 · Op een telefoon schuift het scherm alleen nog omhoog en omlaag

**Probleem.** Je kon de hele pagina zijwaarts wegslepen — topbalk en tabbalk mee. Het viel op in de factuureditor, maar het kon overal.

**Oorzaak.** `.module` stond op `overflow-y: auto`. Dat is de valkuil: zodra één as op `auto` staat, maakt de browser de andere óók scrollbaar zodra er iets uitsteekt. `overflow-x` bleef dus niet op `visible` maar werd stilzwijgend `auto`, en dan sleept één te breed element het hele scherm mee.

**Beslissing.** `overflow-x: hidden` op alle vijf de lagen die dit kunnen doen: `html`, `body`, `#appScreen`, `.main-area` en `.module`. Modals krijgen hetzelfde — de factuureditor is er een.

Wat legitiem breder is dan een telefoon houdt zijn eigen zijwaartse scroll *binnen zijn eigen kader*: het kanbanbord, de notitie-werkbalk, de urentabel, de importtabel en het sjabloonvoorbeeld. Die schuiven zonder de pagina mee te nemen. Dat onderscheid is het hele punt — `overflow-x: hidden` zonder die uitzonderingen zou brede inhoud onbereikbaar maken in plaats van scrollbaar.

Twee dingen die anders alsnog zouden uitsteken:

- `.uren-tabs` stond op `overflow-x: visible` en paste net niet: bij Facturen vragen vijf tabs 311px terwijl er 291px is. Nu schuift de strip zelf, zonder zichtbare scrollbalk.
- Lange aaneengesloten tekst — een factuurnummer, een e-mailadres, een URL in een notitie — rekt zijn regel op en duwt het blad breder. Modules en modals krijgen `overflow-wrap: break-word`, dus dat breekt alleen als het écht niet past.

**Hoe het is nagegaan.** Een geïnstrumenteerde kopie van de app in een iframe van precies 375/360/390px, die per module elk element meet dat rechts uitsteekt of zelf horizontaal scrollt. Headless Chrome maakt geen venster smaller dan 500px, dus direct meten geeft een layout van 504px en daarmee alleen ruis — de iframe is de enige manier om de echte mobiele breedte te treffen. Na de wijziging geldt op alle vijf de lagen `scrollWidth == clientWidth`.

**Niet doen.** `overflow-x: hidden` op `.module` weghalen "omdat een tabel niet meer past". De tabel hoort dan een eigen `overflow-x: auto`-container te krijgen, zoals de uitzonderingen hierboven. En: geen `overflow: hidden` (beide assen) op deze lagen — dan is er ook niet meer verticaal te scrollen.
---

## 2026-09-06 · Drie sluittags te veel weg — en waarom niets dat ving

**Wat er gebeurde.** Bij het verwijderen van de agenda-kaart uit het dashboard gingen drie `</div>`'s mee die daar niet bij hoorden: die van het kaartenraster, van de scroll-container en van `#mod-dashboard` zelf. Gevolg: alle andere modules kwamen in de DOM *binnen* het dashboard te liggen in plaats van ernaast. Zodra het dashboard niet de actieve module was kreeg die ouder `display:none`, en verdween de inhoud van elke andere module mee. Het scherm was leeg op alles behalve het dashboard.

**Waarom niets het ving.** Drie vangnetten keken alle drie de andere kant op:

- de HTML-parser van de browser dicht onbalans stilzwijgend, dus de pagina laadde zonder één fout in de console;
- `test.html` controleert of losse elementen bestaan (`getElementById('mod-uren')`), niet waar ze in de boom hangen — 33/33 bleef groen;
- `validate.mjs` telde alleen `<script>` en `<style>`, niet `<div>`.

Het viel dus pas op toen Frank het zag.

**De data is nooit in gevaar geweest.** `loadGist()` slaagde gewoon — de statusbalk meldde "Geladen" — en `verzamelModuleState()` schrijft de geladen state weg, niet een lege. Puur weergave.

**Wat er nu tegen staat.** `validate.mjs` controleert de div-balans per module: hij meldt zowel een `#mod-*` die niet sluit als een module die binnen een andere ligt. Getest tegen de kapotte commit (`4fe389b`), die correct wordt afgekeurd.

**Les voor grote verwijderingen.** Een blok afbakenen op "de eerste `</div>` op de juiste diepte" is niet genoeg als dat blok het laatste kind is: de sluittags van de ouders staan er direct onder en zien er identiek uit. Bepaal bij zo'n verwijdering de grenzen door tags te tellen vanaf de *start*, niet door het einde te herkennen aan zijn vorm — en draai daarna de balanscheck.
---

## 2026-09-06 · Agenda-module verwijderd

**Probleem.** De agenda werd nauwelijks gebruikt en deed niet betrouwbaar wat hij moest doen. De iCal-kant is daar de oorzaak van: feeds gaan via vier CORS-proxies omdat er geen OAuth is (zie de verwijderde `docs/agenda.md`), Microsoft cachet gepubliceerde feeds 15–30 minuten, en RRULE/RECURRENCE-ID/EXDATE-afhandeling is precies het soort werk dat blijft terugkomen. Daar stond weinig gebruik tegenover.

**Beslissing.** De hele module eruit: **2.635 regels** verwijderd, verspreid over CSS (basis, thema-overlay en de mobiele laag), HTML (module, drie modals, twee navigatie-ingangen, dashboardkaart en -KPI) en JS (de blokken MODULE: AGENDA, NATIVE EVENT CRUD en ICS FILE IMPORT, plus de iCal-proxyketen en alle state). Ook meegegaan: de agenda-tak in de globale zoekfunctie, de klantdashboard-sectie "Komende afspraken", en het events-deel van de AI-invoer — die maakt nu alleen nog taken.

**Wat blijft.** `dateStr()` stond middenin de agenda-code maar wordt zeventien keer door Uren en Facturen gebruikt; die is naar UTILS verhuisd voordat het blok eruit ging.

**Wat er met de opgeslagen afspraken gebeurt.** Niets. `rawState.agenda` wordt niet meer aangemaakt, niet meer gelezen en niet meer geschreven, maar wat er in Drive staat blijft daar gewoon staan: `saveGist()` schrijft `rawState` in zijn geheel weg, en wat bij het laden binnenkomt gaat er ongemoeid weer uit. Wie de module ooit terughaalt, vindt zijn afspraken terug. Actief wissen zou onomkeerbaar zijn en levert niets op.

**Wat het opleverde.** `index.html` van 24.731 naar 22.096 regels. Weg zijn ook de vier externe CORS-proxies (`corsproxy.io`, `allorigins.win` ×2, `codetabs.com`) — daarmee passeert er geen enkele feed-URL meer een derde partij, en het aantal externe afhankelijkheden gaat van Google + vier proxies naar alleen Google.

**Bewijs.** `test.html` 33/33 groen, inclusief "no console errors" en twee nieuwe tests die vastleggen dát de module weg is (`Module: Agenda is weg`, `Nav: geen agenda-item meer`). Alle zes overgebleven modules openen zonder fout; dashboard, klantdashboard, globale zoek en de AI-invoer nagelopen op zowel 375×812 als 1440×900.

**Bestanden.** `index.html`, `sw.js` → `herling-v16`, `test.html` (agenda-test vervangen), `CLAUDE.md`, en `docs/agenda.md` is verwijderd — die staat in de git-historie als de iCal-keten ooit nog eens nodig is.

**Niet doen.** `rawState.agenda` alsnog opruimen in een migratiestap. Dat is precies de onomkeerbare stap die hier bewust is vermeden. En: mocht de agenda terugkomen, begin dan niet opnieuw met iCal-proxies — de reden dat dit werd afgeschaft zit in die keten, niet in de weergave.
---

## 2026-09-05 · Checklist op een telefoon: filters achter één regel, acties in een ⋯-menu

**Probleem.** Boven de eerste taak stond ruim 300px bediening: de topbalk over twee regels (klantfilter, sorteerkeuze, prio-groepen), een hero met vier knoppen in een 2×2 (Uitklappen, Met AI, Verwijder afgerond, Archief), en daaronder twee rijen filterchips plus een zoekbalk. Bij elkaar meer dan een derde van het scherm, elke keer dat je de lijst opende — voor acties die je hooguit een paar keer per week gebruikt.

**Beslissing.** De filters gaan achter één regel van 44px die uitklapt. De rest van de bediening verhuist naar een ⋯-menu in de topbalk, met dezelfde vorm en hetzelfde gedrag als het menu in de Agenda (inclusief `clampDropdownToViewport`: de knop staat halverwege de balk, en een menu van 280px stak links buiten beeld). De hero houdt over waar hij voor bedoeld is — hoever je bent.

**Waarom uitklappen en niet een apart venster.** Beide waren op tafel. Bij een takenlijst wissel je vaak tussen Alles en Hoog, en dan wil je de lijst zien meebewegen; een venster kost twee tikken per wissel en verbergt juist het resultaat waar het je om gaat. Uren en Facturen hébben een filtervenster, maar daar filter je zelden en staat er een tabel onder die je toch niet naast het venster leest.

**Waarom de dichte balk toont wát er aanstaat.** Dit is het zwaarste punt en de reden dat het geen kale knop is geworden: een filter dat je niet ziet is een valstrik. Je mist een taak, denkt dat hij weg is, en gaat zoeken. Staat er iets aan, dan kleurt de balk mint en staat er `Hoog · Deze week` met een kruisje om alles in één tik te wissen. Ingeklapt kost dat evenveel ruimte als een leeg label.

`clFiltersOpen` wordt bewust niet bewaard: hij hoort elke keer dicht te beginnen, anders is de ruimtewinst na één keer filteren weg.

**Bestanden.** `index.html` — `renderClFilterBar()` (kop + body), `renderClOverflowMenu()`, `toggleClOverflow()`, `closeClOverflow()`, de acties `toggleClFilters` / `clSetSort` / `clOvf*`, de CSS bij `.cl2-filter-kop` en `.cl-overflow`, en het CHECKLIST-blok in laag 4.

**Niet doen.** De kop van de filterbalk of de ⋯-knop op een bureaublad tonen: daar is de ruimte er wel, en `.cl2-filter-body` staat op `display: contents` zodat de chips gewoon in dezelfde flex-rij blijven staan als voorheen. En: de telling niet ook in de uitgeklapte rij zetten — die staat al in de kop en stond er daardoor twee keer.
---

## 2026-09-05 · Agenda op een telefoon: Dag als start, en een weekraster dat opzij schuift

**Probleem.** De Agenda was op mobiel de duurste module in schermruimte en de armste in informatie. Gemeten op 375×812:

- De balk was **156px hoog** met acht knoppen over zes rijposities; samen met de dagkoppen begon de kalender pas op **208px** — een kwart van het scherm bediening.
- In de weekweergave was een afspraakblok **42px breed**. De titel kreeg 29px terwijl er 104px nodig was: **72% van elke afspraaknaam was onzichtbaar**. Je zag dát je iets had, niet wát. Zeven kolommen passen domweg niet op 375px.
- De dagweergave werkte wél (één brede kolom, titels voluit), maar was niet de standaard — terwijl de kop van MOBILE LAYOUT al jaren "agenda day-default" beloofde.
- In de dagweergave kostte de dagkop "DONDERDAG 3" **130px** voor informatie die de titel erboven al gaf.
- In de maandweergave vulde de tijd de pil: "09:0…", "Dagst…". In een cel van 50px blijft er na `09:00 ` niets over voor de titel.

**Beslissing.**

*Weekraster schuift opzij in plaats van samen te knijpen.* Elke dag krijgt minimaal 100px, wat het raster 748px breed maakt — twee keer het scherm. De titel gaat daarmee van 29 naar **83px**. De tijdkolom en de dagkoppen blijven vastgezet terwijl je veegt; zonder die ankers weet je na één veeg niet meer welke dag of hoe laat. Vastklikken per dag met `proximity`, niet `mandatory`, zodat je nog een stukje kunt bijschuiven om de rand van een blok te zien.

*Dag is de standaard op een telefoon.* `agendaView` start op `day` als `matchMedia('(max-width: 768px)')` matcht, anders op `week`. Week en Maand blijven één tik weg.

*De balk gaat van vier rijen naar twee.*

```
rij 1   [ Dag | Week | Maand ]   [klant]  [⋯]
rij 2   [←]   datum, klikbaar = vandaag   [→]
```

"+ Nieuwe afspraak" is de zwevende + geworden (zelfde gebaar en plek als in Uren), "Vandaag" zit nu in de titel — hetzelfde patroon als het periodelabel in Uren en Facturen — en "Met AI" staat in het ⋯-menu. Niets is verdwenen, alles is één tik weg. De balk is nu 125px en de kalender begint op 177px.

**Waarom `display: contents` op de datumnavigatie.** De pijlen zitten met "Vandaag" in een eigen div en de titel staat daar los naast, dus je krijgt ze nooit op één regel als `[←] datum [→]`. `display: contents` lost die div op zodat de pijlen zelf flex-items worden en met `order` om de titel heen kunnen — zonder de HTML te verbouwen en zonder desktop te raken. De lege vuldiv, die op desktop naar rechts duwt, doet op mobiel dienst als regeleinde (`flex: 0 0 100%; height: 0`): één element, twee rollen.

**Waarom één scrollcontainer.** De eerste opzet liet het uurraster zijn eigen verticale scroll houden en zette de horizontale op de buitenkant. Sticky ankert aan de dichtstbijzijnde scrollende voorouder, dus de tijdkolom hing aan een container die niet opzij schuift — en schoof gewoon mee weg. Nu doet de buitenste beide richtingen en ankeren de koppen dááraan.

**Bestanden.** `index.html` — `agendaView` initialisatie, `.agenda-hdr-vul`, `.agenda-fab`, `.agenda-overflow-mobiel`, `.cal-grid-week` (nieuwe class op de weekcontainer), `.cal-pil-tijd` (tijd in een eigen span zodat de mobiele laag hem kan weglaten), plus het herschreven AGENDA-blok in laag 4. `docs/mobile.md` — bijgewerkt.

**Niet doen.** De minimumbreedte van 100px ook op de dagweergave zetten: die deelt dezelfde onderdelen maar heeft één kolom, en zou dan zinloos gaan schuiven. Daarvoor is de class `.cal-grid-week` er. En: de tijd niet terugzetten in de maandpil zonder de cel breder te maken — dat was precies de ruil die de titel opat.
---

## 2026-09-05 · Eén mobiele typografische schaal, en 44px als ondergrens voor een raakvlak

**Probleem.** De mobiele weergave voelde druk en de verhoudingen klopten niet, maar dat was nooit gemeten. Gemeten op één scherm (Checklist, boven de vouw, 375×812): **twaalf verschillende lettergroottes**, waarvan **dertig van de tweeënveertig tekstblokken onder 12px**, met een gat tussen 11 en 17px. Er was dus geen leesbare middenmaat — alles las als óf een microlabel óf een kop. En **vijfentwintig van de tweeëndertig knoppen** waren in minstens één richting kleiner dan 44px; de filterchips waren 28px hoog en enkele 29px breed. Over het hele bestand: 28 verschillende `font-size`-waarden, inclusief halve pixels (10.5, 11.5, 12.5, 13.5).

De oorzaak is systematisch. Elke losse regel is verdedigbaar — er is telkens een pixel gewonnen om iets op één regel te krijgen — maar de optelsom is een scherm waarop niets meer opvalt omdat alles even klein is. Meerdere comments in de mobiele laag leggen precies die afweging uit ("met krappere knoppen passen beide groepen op één regel"), en in drie gevallen liep het element dan alsnog over de rand.

**Beslissing.** Zes trappen als tokens in `:root`, op een telefoon een trap ruimer dan op een bureaublad, plus `--sp-1` t/m `--sp-6` op veelvouden van vier en `--tap` als minimale knopmaat (36px desktop, 44px mobiel).

| Token | Desktop | Mobiel | Rol |
|---|---|---|---|
| `--fs-micro` | 10.5px | 11.5px | labels, badges, tellers |
| `--fs-klein` | 12px | 13px | meta-regels, chips |
| `--fs-basis` | 13px | 15px | kaarttitels, invoervelden |
| `--fs-groot` | 15px | 17px | subkoppen |
| `--fs-kop` | 18px | 20px | moduletitels |
| `--fs-cijfer` | 22px | 26px | KPI-cijfers, bedragen |

Desktop blijft ongemoeid: de mobiele waarden staan in laag 4, en de omzetting naar tokens raakt alleen regels die al binnen de mobiele media query stonden. Achteraan die laag staat één blok dat alles wat nog onder 11,5px zat naar `--fs-micro` tilt.

**Waarom niet de skill `mobile-app-ui-design`.** Die was de aanleiding voor het onderzoek en zijn diagnose klopt — max vier lettergroottes, een 8pt-raster, 44px raakvlakken —, maar hij is niet overgenomen. De implementatiehelft schrijft React, Tailwind, Lucide en Recharts voor en botst frontaal met de hard rules (vanilla, geen frameworks, geen utility-classes); een skill die bij elke UI-taak meekomt en dan de verkeerde kant op duwt is netto negatief. En de maatvoering is consumenten-app-kalibratie: 80–96px sectiepadding en "CTA in de duimzone" horen bij een landingspagina, niet bij een administratietool waar informatiedichtheid het punt is. Zes trappen in plaats van vier is om diezelfde reden bewust.

**Meegenomen in dezelfde stap.**

- **Dubbele titels weg.** Checklist en Notities herhaalden de modulenaam één regel onder de topbalk. De verbergregel stond alleen op `.dash-topbar` met de aanname dat het dashboard de enige module met een eigen kop was; Notities zat bovendien in een losse inline-stijl en was voor geen enkele selector bereikbaar. Nu geldt `.module-title, .cl2-title { display:none }` voor alle modules, ook de volgende die er een krijgt.
- **De ververs-knop rechtsboven verschijnt alleen nog bij een sync-fout.** Sinds `autoSyncKijk()` (zie de entry hierboven) doet de handmatige klik bij normaal gebruik niets, terwijl de knop wel de aandacht trok en de titel uit het optische midden duwde. Bij een fout is hij nog steeds het herstelpad waar de melding letterlijk naar verwijst, dus daar verschijnt hij — in de rode staat. De daarmee onbereikbare `saved`/`saving`-stijlen en `mobileSyncPulse` zijn verwijderd. De ↻ in de zijbalk blijft ongewijzigd.
- **Zoekicoon over de tekst.** In Notities stond het vergrootglas op de eerste letter. De generieke mobiele input-regel weegt zwaarder dan een losse class (twee `:not()`'s tellen mee) en overschreef de linkerpadding die ruimte voor het icoon maakt — ook mét `!important`. Alle 35 tekstvelden in zeven modules en twaalf modals zijn nagelopen; dit was de enige.
- **Lege flex-spacer.** In de Uren-topbalk stond een `<div style="flex:1">` die op desktop het ⋯-menu naar rechts duwt. Op mobiel eiste die alle restruimte op, waardoor het ⋯ naar een eigen regel wrapte: 90px voor één knop. De spacer heet nu `.uren-topbar-vul` en gaat op mobiel uit — 95px werd 53px.

**Bestanden.** `index.html` — tokens in `:root` (laag 1), mobiele waarden en het ondergrensblok in "MOBILE LAYOUT" (laag 4), plus `.uren-topbar-vul`. `docs/mobile.md` — de schaal en de regels. `validate.mjs` — bewaakt de ondergrenzen.

**Niet doen.** De desktopwaarden aan de tokens koppelen zonder te meten. De schaal is op mobiel ruimer omdat je een telefoon verder weghoudt en met een vinger wijst; op een bureaublad is dichter juist beter en werkt Frank er dagelijks mee. En: geen nieuwe `font-size` in pixels meer neerzetten in de mobiele laag — wie een token gebruikt schaalt mee, wie een los getal neerzet begint de wildgroei opnieuw.

---

## 2026-09-05 · Vanzelf bijwerken vanuit Drive, in plaats van op ↻ klikken

**Probleem.** De app haalde Drive alleen op bij het opstarten en bij één specifiek geval: terugkomen op het tabblad na meer dan 30 seconden weg, en dan nog alleen als er geen save klaarstond (`_hiddenSince` + `visibilitychange`). Dat dekt de praktijk niet. Frank werkt vanaf meerdere computers (nooit tegelijk), en `visibilitychange` vuurt niet als je van *venster* wisselt terwijl het tabblad zichtbaar blijft — precies wat er op de desktop gebeurt. Een venster dat de hele dag openstaat liet dus de stand van vanochtend zien, tot je op ↻ klikte. De regel "Drive is de waarheid" gold wel bij het schrijven, maar op het scherm liep het uren achter.

**Beslissing.** Eén poort, `autoSyncKijk()`, met drie aanleidingen:

1. terug bij het venster — `visibilitychange` (ander tabblad), `focus` (ander programma) en `online` (netwerk terug);
2. weer iets doen in de app na een minuut stilte — `pointerdown`/`keydown`, op capture en passive;
3. elke vijf minuten, zolang het venster zichtbaar is.

De poort kijkt eerst goedkoop: `driveZoekBestand()` haalt alleen metadata op. Is `modifiedTime` gelijk aan `driveGezien`, dan gebeurt er níets — geen download, geen `renderAll()`, geen knipperende statusbalk. Alleen bij een echt nieuwere versie volgt `loadGist()` plus een korte melding dat er is bijgewerkt. De ↻-knop en het trek-omlaag-gebaar blijven: die halen Drive altijd op.

**Waarom een aparte poort en niet gewoon `loadGist()`.** `loadGist()` vervangt de state en hertekent alles. Dat mag niet zomaar midden in het werk gebeuren, dus `autoSyncVeilig()` zegt nee bij: Drive deze sessie nog niet gelezen (verbinden blijft de taak van ↻ — een achtergrondpoging opent het inlogvenster zonder klik, en dat blokkeert de browser toch), een oud versleuteld blok nog dicht, een wachtende of lopende save of herkansing, een open modaal, of focus in een invoerveld. Eigen werk gaat voor. De poort wordt twee keer gelopen: één keer vooraf en één keer ná het metadata-antwoord, want in die honderd milliseconden kan er alsnog getypt zijn. Verder een bodem van 5 s tussen twee controles, wat de aanleiding ook is.

**Bestanden.** `index.html` — blok "Automatisch bijwerken" (`autoSyncVeilig`, `autoSyncKijk`, de drie luisteraars) vervangt het oude `_hiddenSince`-blok; `sw.js` → `herling-v14`.

**Niet doen.** De metadata-stap overslaan en gewoon periodiek `loadGist()` draaien. Dat downloadt elke vijf minuten het hele bestand (honderden kB) en hertekent de app onder je handen, ook als er niets veranderd is. En: de vijf-minuten-tik niet korter zetten. De aanleidingen 1 en 2 dekken het echte gebruik; de tik is er alleen voor het venster dat openstaat terwijl je niets doet.

---

## 2026-08-21 · Code-opschoning: stubs, altijd-ware guards en dode functies eruit

**Probleem.** `index.html` droeg een laag ruis mee uit de tijd dat het bestand in delen werd samengesteld ("STUB functions — will be completed in next parts"):

- **58 lege stub-functies** (`function renderTodoModule(){}` enz.) die verderop allemaal een echte definitie kregen. Door hoisting wint de laatste declaratie, dus ze deden niets — maar ze zijn wél een valstrik: verdwijnt ooit de echte definitie, dan slikt de stub de aanroep geruisloos in plaats van een `ReferenceError` te geven.
- **45 guards `typeof x==='function'`** rond functies die állemaal top-level gedeclareerd staan. Ze zijn per definitie waar (en zouden bij een `let` in de temporal dead zone tóch gooien). Ze suggereren onzekerheid die er niet is; één ervan draaide per factuur in een filter.
- **17 functies die nergens werden aangeroepen**, waaronder de complete `calAddDropdown`-feature: drie functies plus een `click`-listener op `document` die bij elke klik in de app een element opzocht dat niet bestaat, en ~65 regels CSS.
- **`getISOWeek` stond er twee keer**, met twee verschillende implementaties. De tweede overschreef de eerste.
- De **rawState-verzamelstap stond viermaal** uitgeschreven, in twee varianten (met en zonder `typeof`-guard). Dat is precies de code waar vergeten duur is: wat er niet in staat, gaat niet naar Drive.

**Beslissing.** Alles hierboven verwijderd. Eén `verzamelModuleState()` als enige plek waar de module-states in `rawState` landen; `huidigeStateSnapshot()` bouwt daarop voort en wordt nu ook door `saveGistIntern` en `downloadBackup` gebruikt. De dubbele kop-en-streep in de PDF-generator zit in `facPdfBlokKop()`. Verder: een zoekbare inhoudsopgave boven zowel de stylesheet als het script, de sectie "UTILS" gesplitst (die bevatte 600 regels opslaglaag onder de naam "hulpjes"), en de verouderde Engelse module-banners vertaald en op de feiten gecontroleerd.

**Waarom dit veilig is.** Geen enkele wijziging verandert gedrag, en dat is gemeten in plaats van aangenomen:
- `validate.mjs` groen; `test.html` 29/29 inclusief "geen console-fouten".
- AST-vergelijking met de versie van vóór de opschoning: elke verwijderde naam komt nergens meer voor, top-level variabelen ongewijzigd, geen dubbele declaraties, geen aanroep naar een onbekende naam.
- Dezelfde factuur gerenderd in oud en nieuw geeft **byte-identieke PDF's** in alle vier combinaties van kop/lijn-boven — de branches die `facPdfBlokKop()` overnam.
- Berekende stijlen en geometrie van alle 1337 elementen: **0 verschillen** op desktop, mobiel, licht én donker.

**Bestanden.** `index.html` (−240 regels netto), `CLAUDE.md`.

**Niet doen.** De 668 `!important`-declaraties en de gelaagde CSS-overlays zijn níet aangeraakt. Die dichtheid is een gevolg van de opbouw in lagen (basis → thema-overlay → post-fixes → componenten → media queries); daar iets uithalen vraagt om per selector te controleren wie er wint, en dat is een aparte klus met echt regressierisico. De inhoudsopgave boven de stylesheet legt de laagvolgorde uit zodat die controle te doen is.

---

## 2026-08-21 · Botsingscheck bij het schrijven, netwerk-eerst voor de app, tests op de synclogica

Vervolg op de entry hierboven; drie resterende gaten in hetzelfde verhaal.

**1. Twee vensters konden elkaar nog overschrijven.** Er was al een herlaad bij terugkeer in een tabblad na >30 s (`visibilitychange`), maar die vuurt niet bij twee vensters náást elkaar (allebei `visible`) en slaat over als er een save klaarstaat (`!saveTimer`). Op het moment van schrijven werd niets gecontroleerd.
→ `driveSchrijf(obj, verwachtTijd)` vergelijkt nu de `modifiedTime` van het bestand met de versie die **dit venster** kent (`driveGezien`, bewust in het geheugen — twee vensters delen localStorage, dus dáár zou de vergelijking altijd "bij" zeggen). Wijkt het af, dan gooit hij `code:'botsing'` en voegt `saveGistIntern` eerst samen met `voegStateSamen()` voordat er geschreven wordt. De vergelijking is gratis: `driveZoekBestand()` haalde `modifiedTime` toch al op vlak vóór de upload.
→ Bekende beperking: een merge op id ziet geen verwijderingen, dus een item dat in het andere venster verwijderd is komt terug. Dat is de goede kant om het mis te hebben.

**2. Service worker serveerde na een deploy nog één keer de oude app.** Stale-while-revalidate gold ook voor `index.html`. Dat is niet alleen ongemak: je werkt dan in een oude app — met bugs die al gerepareerd zijn — die wél naar dezelfde Drive schrijft.
→ Het document (`req.mode==='navigate'`, `/`, `/index.html`) gaat nu **netwerk eerst** met de cache als terugval; de rest blijft stale-while-revalidate. Offline getest met de dev-server uit: index.html komt dan gewoon uit de cache. `CACHE_NAME` naar `herling-v9`.
→ Bij het uitrollen van een nieuwe SW is er nog één keer een tweede reload nodig: de eerste navigatie wordt nog door de oude worker afgehandeld. Daarna niet meer.

**3. De synclogica werd door niets getest.** `test.html` controleerde of functies *bestonden*. Daarbij stonden drie tests permanent op rood: ze keken naar `w.rawState`, maar dat is een top-level `let` en die staat niet op `window` — ze konden dus nooit slagen en werden genegeerd.
→ Twaalf functionele tests op `stateOmvang`, `voegStateSamen` en `versieTelling`: ontbrekende notitie komt terug, ingekorte tekst wordt hersteld, een lángere huidige tekst blijft staan, nieuwere uren blijven behouden, de invoer wordt niet gemuteerd, gelijke states geven een leeg rapport. De drie kapotte tests lopen nu via `huidigeStateSnapshot()`. 29/29 groen.

**Bestanden**: `index.html` — `driveSchrijf` (parameter `verwachtTijd`), `saveGistIntern` (botsingsafhandeling), `driveGezien` (nieuw), `driveProbeerLaden`; `sw.js` — documenttak + `herling-v9`; `test.html` — synctests + `mkState`/`zonderNotitie`/`metKorteTekst`/`vindNotitie`

**Niet doen**: `driveGezien` in localStorage zetten "zodat het een herlaad overleeft". Dan delen twee vensters dezelfde waarde en is de hele botsingscheck waardeloos — dat is precies het geval dat hij moet vangen.

## 2026-08-21 · Drive is de waarheid; terugzetten via Versiegeschiedenis

**Probleem**: op 20 augustus om 18:33 sprong het bestand in Drive van 674 kB naar 429 kB — het niveau van vóór 16 augustus. Een deel van de notities was weg. Oorzaak: de melding uit `meldLokaalTerugzetbaar()` die tijdens het opstarten verschijnt met de knop "↺ Werk van dit apparaat gebruiken". Die knop roept `herstelLokaalTerug()` aan en schrijft de lokale kopie over Drive heen. Frank klikte hem aan zonder te kunnen zien wat erin zat; de lokale kopie was dagen oud. De data is teruggehaald uit Drive's eigen revisiegeschiedenis (`files/{id}/revisions`), die de app tot dan toe niet gebruikte.

**Beslissing**:
- **Geen keuze meer tijdens het laden.** Wat in Drive staat is de administratie. De melding met de terugzet-knop is weg.
- **Eén uitzondering, en dat is geen conflict**: staat Drive nog exact op de versie die dit apparaat het laatst zag (`stand.driveTijd === d.tijdISO`), dan heeft niemand anders geschreven en was het lokale werk alleen nog niet weg. Dat wordt stil ingehaald en meteen weggeschreven. Dit dekt het gewone geval "tabblad gesloten binnen de 1,5 s debounce".
- **Rem op dat inhaalpad**: het gebeurt alleen als de lokale kopie minstens 90% van de omvang van de Drive-versie heeft (`stateOmvang()`, telt items over alle modules). Dit is de enige plek waar lokaal nog voorrang krijgt, dus de rem zit daar.
- **Terugzetten verhuist naar Instellingen → Versiegeschiedenis**: een lijst van Drive-revisies, per dag gegroepeerd met de laatste versie voorop. Klik een versie open en je ziet per module hoeveel erin zit versus nu, met drie acties: *Ontbrekende items aanvullen* (merge op id, raakt bestaande data niet aan), *Volledig terugzetten* en *Downloaden*. Lokaal werk dat Drive nooit kreeg staat als eigen kaart bovenaan.
- **Eén versie per dag wordt vastgehouden** (`keepForever` via `driveBewaarDagversie()`, boven de 180 wordt de oudste weer losgelaten). Google bewaart standaard ~100 revisies; bij drukke dagen is dat maar een paar dagen geschiedenis.
- **Drive leeg + lokale kopie** schrijft nu meteen weg in plaats van te wachten op een volgende wijziging — anders stond de balk groen terwijl er in Drive niets was.

**Waarom**: Frank leunt op de groene status als bewijs dat de cloudversie klopt. Dan mag de app hem tijdens het opstarten geen vraag stellen die dat kan omdraaien, zeker niet met twee knoppen waarvan de gevolgen onzichtbaar zijn. Kiezen hoort een handeling te zijn die je opzoekt, waarbij je ziet wat je kiest. Dat terugzetten veilig is, komt doordat elke save zelf weer een revisie maakt: de stand van vóór het terugzetten blijft in dezelfde lijst staan.

**Bestanden**: `index.html` — `loadGist` (conflictblok en het lege-Drive-pad), `stateOmvang` (nieuw), `meldLokaalTerugzetbaar` (verwijderd), `herstelLokaalTerug` (blijft, alleen nog vanuit het versiescherm), `driveRevisies`/`driveRevisieState`/`driveBewaarDagversie` (nieuw), `driveSchrijf` (`headRevisionId` in `fields`), `saveGistIntern` (dagversie vasthouden), `versies*`-functies en `#versiesModal` (nieuw), `toggleAppInstellingen` + mobiel instellingenmenu

**Niet doen**: het inhaalpad verruimen zodat lokaal ook wint als Drive wél veranderd is. Dat is precies de fout van 20 augustus, alleen dan automatisch in plaats van met een misklik. Ook niet: de 90%-rem eraf halen — die is het enige dat een kapotte of halflege lokale kopie tegenhoudt.

## 2026-08-19 · Urensjablonen: vier bugs in het toepassen en herhalen

**Aanleiding**: melding dat de sjablonen "niet helemaal goed werken". Het opslaan, bewerken en verwijderen bleek in orde; het toepassen en het wekelijks herhalen niet. Vier fouten, alle vier reproduceerbaar gemeten voordat er iets veranderd is.

**1. "Toepassen" negeerde de getoonde periode.** `urenApplyTemplate` deed `urenWeekDates(urenScope()==='week' ? urenOffset.week : 0)`. Alleen in weekweergave keek dat naar wat je zag; in maandweergave, "Per klant" en "Per week" viel het terug op de week van vandaag. Meting: kijkend naar **mei 2026** landden de uren op **17–19 augustus**, met de melding "3 regels toegevoegd" — je zou het pas veel later ontdekken.
→ Volgt nu de periode in beeld: een week vult die week, een maand vult de hele maand (dagen die buiten de maand vallen worden overgeslagen). In het jaaroverzicht wordt niets toegevoegd maar gevraagd eerst een week of maand te kiezen. De melding noemt de periode.

**2. Herhalen vulde niet bij bladeren.** `urenApplyRecurring()` stond alleen in `renderUrenModule()`, dus alleen bij het openen van de module. Blader je twee weken terug, dan bleef die week leeg; verliet je de module en kwam je terug, dan stond hij er ineens wél.
→ Ook aangeroepen vanuit `urenNav`, `urenNavToday`, `urenSetView` en `urenSetRegScope`. Bewust niet vanuit `urenRenderAll`: dan zou een regel die je verwijdert bij de eerstvolgende render terugkomen.

**3. Herhalen vulde onbeperkt terug.** Een sjabloon had geen startdatum. Bladeren naar juni 2025 maakte daar **21 regels / 168 uur** aan voor een periode waarin het sjabloon nog niet bestond — uren die meetellen in facturen en de btw-aangifte. Dit was de ernstigste, en fix 2 zou hem verergerd hebben.
→ Veld **"Herhalen vanaf"** toegevoegd (`t.vanafDatum`), standaard vandaag bij een nieuw sjabloon. Bestaande sjablonen krijgen bij de migratie de **eerste van de lopende maand**: niet vandaag, want de maand waar je nu in werkt hoort gewoon aangevuld te blijven worden.

**4. Einddatum werd met vandaag vergeleken.** `if(t.untilDate && today > t.untilDate) return;` zette het hele sjabloon uit zodra de einddatum verstreken was — ook voor weken *binnen* de looptijd. Een sjabloon dat t/m 30 juni liep, vulde in juli zijn eigen mei-weken niet meer aan.
→ Nu per gevulde dag: `if(t.untilDate && date > t.untilDate) return;`, plus dezelfde vergelijking voor `vanafDatum`. Opslaan weigert een einddatum vóór de startdatum.

**Wat al goed was** (nagemeten, niet gewijzigd): opslaan, bewerken zonder duplicaat, verwijderen, de dagknoppen met urenvelden, en de dubbelcheck — een handmatig ingevulde of al gefactureerde dag wordt nooit overschreven of verdubbeld, en herhaald aanvullen voegt niets dubbels toe.

**Bestanden**: `index.html` — `urenApplyTemplate`, `urenApplyRecurring`, `urenSaveTpl`, `urenEditTemplate`, `urenResetTplForm`, `urenMigrateEntries`, `renderUrenTemplatesModal`, formulier-HTML (`#urenTplVanaf`), `urenNav`/`urenNavToday`/`urenSetView`/`urenSetRegScope`

**Niet doen**: `urenApplyRecurring()` in `urenRenderAll()` zetten. Het lijkt de nettere plek, maar dan kun je een door een sjabloon gemaakte regel niet meer verwijderen — hij staat er na de volgende render weer.

## 2026-08-19 · Uren van één klant binnen een factuurpartij kiezen

**Probleem**: je factureert LabsData, maar schrijft je uren op POM en Staedion — twee klanten die via LabsData op de rekening komen. De wizard nam altijd álle openstaande uren van de partij in één keer mee (116 u in één regelblok), zonder manier om er een deel uit te pakken. Wil je POM en Staedion op aparte facturen, dan kon dat niet.

**Beslissing**: onder de gekozen partij verschijnt een uitsplitsing per meeliftende klant, met vinkjes en per klant de uren en het bedrag. Standaard staat alles aan, dus één klik blijft één klik; wie wil splitst uit.
- De uitsplitsing verschijnt **pas na het kiezen** van de partij en **alleen bij meer dan één** leverende klant — bij Kasparov zou een vinkje alleen ruis zijn.
- De kop van de partij telt mee met de vinkjes, zodat je het effect direct ziet (44,00 u → 24,00 u).
- Het laatste vinkje kan niet uit: nul klanten geeft een factuur zonder regels, en daarvoor is "Lege factuur" de eerlijkere weg.
- Van partij wisselen of de periode aanpassen zet de keuze terug op alles — een vinkje van de vorige situatie zegt niets over de nieuwe.

**Technisch**: een optionele `alleenKlanten` (array met client-ids, leeg/afwezig = alles) loopt door `factuurNieuw` → `factuurRegelsUitUren` en `factuurStandaardBetreft`. De keuze wordt als `f.urenKlanten` op de factuur bewaard, zodat "Uren ophalen" in de editor niet alsnog de rest erbij haalt.

**Naamgeving, twee kanten op**:
- `factuurStandaardBetreft` noemt de klantnaam nu ook als er precies één klant is gekozen binnen een partij. Zonder dat heten twee facturen aan LabsData allebei "Gewerkte uren Augustus 2026".
- `factuurRegelsUitUren` zet de klantnaam alleen nog vóór de regel als er méér dan één klant op de factuur staat. Anders werd het "POM B.V. — POM B.V. Gewerkte uren Augustus 2026", omdat het onderwerp de naam al noemt.

**Bestanden**: `index.html` — `facWizardRenderKlanten`, `facWizardKies`, `facWizardKlantToggle` (nieuw), `facWizardMaak`, `factuurNieuw`, `factuurRegelsUitUren`, `factuurStandaardBetreft`, `facUrenOphalen`, CSS `.fac-wizard-partij`/`.fac-wizard-sub`

**Let op** (bestaand gedrag, niet gewijzigd): uren worden pas aan een factuur gekoppeld bij het versturen, niet bij het maken van een concept. Een openstaand concept reserveert zijn uren dus niet — maak je twee concepten achter elkaar, dan biedt de wizard dezelfde uren nog een keer aan.

## 2026-08-19 · Facturentabel: één lettertype, vaste kolommen, duidelijker knoppen

**Probleem**: met de kolom "Excl. btw" erbij werd de tabel te breed. Het bedrag brak over twee regels (`.fac-bedrag` had geen `white-space:nowrap`), en bij twee bedrijven schoof de tabel 65px binnen zijn kaart. Daarnaast stond het mono-lettertype op de ene plek wel en op de andere niet, en lazen de tabs en knoppen als platte tekst.

**Beslissing**:
- **Eén lettertype in de hele module.** Niet per regel omgezet maar de variabele zelf overschreven voor `#mod-facturen` en alle facturenvensters: `--font-mono: var(--font-body)`. Alles wat `var(--font-mono)` gebruikt volgt vanzelf, ook wat er later bij komt. `tabular-nums` blijft overal staan, zodat bedragen en datums onder elkaar uitlijnen. Mono is bovendien fors breder — dat was de helft van het ruimteprobleem.
- **`table-layout:fixed`** op `.fac-table`. Betreft slokt de resterende ruimte op en kapt af met een ellipsis, in plaats van de tabel breder te duwen dan de kaart. Zonder dit eiste `.fac-betreft` zijn `max-width` van 260px op, ongeacht de beschikbare ruimte.
- **Kolom "Vanuit" vervalt**; het bedrijf staat als kleine regel onder het factuurnummer. Ze horen bij elkaar (elke administratie heeft een eigen nummerreeks) en het scheelt een kolom. De tabel is nu altijd acht kolommen en past op 1280px, met of zonder tweede bedrijf.
- **Knoppen en tabs**: hele rand in plaats van een haarlijn, lichte schaduw, en een indrukgevoel (`:active{transform:translateY(1px)}`). Tabs krijgen een altijd aanwezige maar doorzichtige rand, zodat de balk niet 1px springt bij het wisselen.
- **Tijdstip in Verzonden**, naast de datum en in de KPI. Twee berichten van dezelfde dag — een factuur 's ochtends, een herinnering 's middags — waren anders niet te onderscheiden. Alleen bij een volledige tijdstempel; regels die uit `f.gemaildOp` zijn afgeleid hebben die soms niet.

**Bijwerking van `table-layout:fixed`** die we moesten opvangen: kolommen knippen nu wat niet past. De bedrijfsnaam onder het nummer (96px kolom) en de knoppenkolom bij Debiteuren (150px) werden afgekapt. Nummer wordt 116px zodra het bedrijf eronder staat, de actiekolom 172px.

**Bestanden**: `index.html` — `.fac-table`/`.fac-nr`/`.fac-datum`/`.fac-bedrag`/`.fac-betreft`, `.uren-btn`, `.uren-tab`, `facRenderLijst`, `facRenderMails`, `facRenderKpis`, `factuurFmtTijd`

**Niet doen**: `.fac-betreft` een `max-width` teruggeven — in combinatie met `table-layout:fixed` is dat overbodig, en zonder fixed layout maakt juist die max-width de tabel te breed.

## 2026-08-19 · Betalingsherinnering, betaalvenster met datum, en zicht op de vervaltermijn

**Probleem**: drie gaten rond het innen van geld.
1. Debiteuren toonde keurig 30/60/90+ dagen en er was een KPI "Te laat", maar je kon er niets mee — geen manier om een herinnering te sturen, terwijl de Gmail-koppeling er al lag.
2. Betaling registreren liep via `prompt()`. Geen datumveld, dus elke betaling belandde op vandaag. Bij het **kasstelsel** bepaalt die datum in welk btw-tijdvak de omzet valt, dus een betaling van vorige maand hoorde daar ook echt in te kunnen.
3. `factuurDagenTeLaat` gaf alleen iets terug als de termijn al verstreken was. Hoeveel dagen een klant nog had, stond nergens.

**Beslissing**:
- **`factuurDagenTot(f)`** naast het bestaande `factuurDagenTeLaat`: positief = zoveel dagen te gaan, 0 = vervalt vandaag, negatief = te laat, `null` als de vraag niet speelt (concept of betaald). Getoond onder de vervaldatum in de facturenlijst, in debiteuren, op de mobiele kaarten en in de editor. Grijs, en oranje in de laatste week.
  - **Alleen de nog-lopende kant.** Is de termijn verstreken, dan zegt de statuspil dat al ("19 dagen te laat"); het er nog eens onder zetten is dubbelop.
- **Herinnering** als tweede stand van hetzelfde mailvenster (`openFacMail(id,'herinnering')`), met een eigen sjabloon (`settings.herinneringMail`) en drie nieuwe plaatshouders: `{openstaand}`, `{dagenTeLaat}`, `{factuurdatum}`. Knop verschijnt alleen als de factuur écht te laat is — de standaardtekst zegt "de betaaltermijn is verstreken", en dat moet kloppen.
  - **Raakt `gemaildOp` niet aan.** Dat veld betekent "de factuur is verstuurd"; een herinnering is iets anders. Zou een herinnering het overschrijven, dan zou de KPI "Nog niet gemaild" leeglopen door een herinnering in plaats van door de factuur zelf. In plaats daarvan `herinnerdOp` + teller `herinneringen`, en een logboekregel met `soort:'herinnering'` die in Verzonden een eigen pil krijgt.
- **Betaalvenster** in plaats van `prompt()`: bedrag (voorgevuld op het openstaande), **ontvangstdatum**, en een lijstje eerder ontvangen betalingen. Meer dan het openstaande bedrag vraagt eerst om bevestiging.
- **Snelknoppen in Debiteuren**: per regel *Herinner* (alleen bij achterstand) en *Betaald*. Daar zit je als je achter je geld aan gaat, niet in de editor.

**Mobiele debiteuren** (nieuw, en eigenlijk een bestaande bug): `.uren-sheet-card` is onder 768px verborgen, en Debiteuren had geen mobiele tegenhanger. Op een telefoon zag je dus alleen de ouderdomstegels en geen enkele factuur. Er is nu een `.fac-mlist`-variant met dezelfde knoppen plus *Openen* — juist achter debiteuren aanzitten doe je onderweg.

**Bestanden**: `index.html` — `factuurDagenTot`/`factuurVervalTekst`/`factuurVervalKleur`/`facVervalRegel`, `facBetaaldDialoog`+`facBetaalOpslaan`+modal `#facBetaalModal`, `FAC_HERINNERING_STANDAARD`+`facHerinneringSjabloon`, `openFacMail(id,modus)`, `facMailVerstuurActie`, `facRenderDebiteuren`, `facRenderMails`

**Niet doen**: de resterende dagen óók tonen als de factuur al te laat is — dan staat er twee keer hetzelfde in één rij. En een herinnering `gemaildOp` laten zetten; zie hierboven.

## 2026-08-19 · Factuur dupliceren: knop overal, en drie lekken gedicht

**Probleem**: dupliceren bestond al (`factuurDupliceer` + knop "Dupliceren"), maar alleen bij een verstuurde factuur — niet bij een concept. En de kopie nam meer mee dan de bedoeling was. Gemeten op de bestaande code:

| Veld | Ging mee | Zou niet moeten |
|---|---|---|
| `gemaildOp` / `gemaildAan` | ja | de kopie is nooit gemaild |
| `nummerVast` | ja | het nummer is een vers voorstel, niet handmatig gezet |

Het eerste had een zichtbaar gevolg: `factuurMailsAanvullen` vult het logboek Verzonden aan op basis van `gemaildOp`, dus de kopie kreeg daar een **verzonnen regel** voor een bericht dat nooit is verstuurd. Reproductie: bron met één mailregel → dupliceren → `factuurMailsAanvullen()` → twee regels.

**Beslissing**:
- Knop **Dupliceren** ook in de actiebalk van een concept.
- `factuurDupliceer` wist nu ook `gemaildOp`, `gemaildAan` en `nummerVast`.

**Wat een kopie wél meeneemt** (bewust, dit is de reden dat je dupliceert): klant, bedrijf, betreft, referentie, notitie, sjabloonkeuze, en alle regels met bedragen. Wat er niet in zit: nummer (nieuw voorstel uit de reeks van dát bedrijf), datum (vandaag) en vervaldatum (opnieuw berekend met de betaaltermijn van de klant), betalingen, verstuurd-/betaald-/maildata, de bevroren klant- en afzendergegevens, en de urenkoppeling — `r.urenIds=[]`, zodat dezelfde uren niet twee keer gefactureerd worden en bij de bron op gefactureerd blijven staan.

**Bestanden**: `index.html` — `factuurDupliceer`, `facEditorRender` (actiebalk concept)

**Niet doen**: `referentie` ook wissen bij een kopie. Dat is verdedigbaar (een inkoopnummer is vaak factuurspecifiek), maar bij een maandelijks terugkerende factuur is het juist hetzelfde — en stil laten verdwijnen is vervelender dan even overtypen.

## 2026-08-19 · Wanneer bevriest een factuur zijn klantgegevens

**Probleem**: het sjabloon en de gegevens synchroniseerden verschillend, en dat verschil was nergens zichtbaar. Vink je achteraf "KVK-nummer klant" aan in de sjabloonbouwer, dan werkt dat vinkje wél door op een oude factuur (het sjabloon wordt live gelezen), maar er verschijnt niets — want de klantgegevens waren bij "verstuurd" bevroren in `f.klant`, met `kvk:""` erin. Gemeten: sjabloonwijziging op een verstuurde factuur → zichtbaar; klant-KVK later ingevuld → op een concept zichtbaar, op een verstuurde factuur niet.

**Beslissing** (twee kanten van hetzelfde):
1. **Bevriezen verhuist van "verstuurd" naar het mailmoment.** `factuurMarkeerVerstuurd` maakt geen momentopname meer; `factuurBevriesGegevens(f)` doet dat in het mailpad, vóór het bouwen van de bijlage — zodat de bewaarde kopie exact is wat de klant in handen krijgt. Mislukt de verzending, dan draait de catch precies terug wat dít bevriezen aanmaakte (de functie geeft `{klant,afzender}` terug, zodat een oudere kopie blijft staan). Rationale: "verstuurd" aanvinken is vaak dagen vóór het echte moment; tot dan is er niets te beschermen en mag de factuur je klantenkaart volgen.
2. **`factuurSnapshotVerschil(f)` + knop "Gegevens bijwerken"** in het Factuuradres-blok, zichtbaar zodra de bevroren kopie afwijkt van de klantenkaart of de bedrijfsgegevens. Toont per veld `oud → nieuw` (afzendervelden gelabeld), werkt in één klik zonder bevestigingsvraag — de verschillen staan al uitgeschreven boven de knop — en is terug te draaien via de toast.

Het adresblok zegt nu ook wát er geldt: *"Volgt je klantgegevens; wordt vastgelegd zodra je de factuur mailt"* versus *"Vastgelegd bij het mailen op <datum>"*. En het toont KVK, dat er nog niet in stond.

**Ook gerepareerd**: `factuurTerugNaarConcept` liet `f.klant`/`f.afzender` staan. Onder het nieuwe model klopte dat niet meer — de editor meldde "volgt je klantgegevens" terwijl de PDF nog uit de oude kopie las. Die worden nu losgelaten.

**Waarom niet automatisch verversen na het mailen**: dan zou een geregenereerde PDF afwijken van het bestand dat de klant heeft. Bijwerken is daarom altijd een expliciete daad.

**Aanvulling (zelfde dag) — knop "Definitief maken"**: een factuur die je print of post bereikt het mailmoment nooit en zou dus eeuwig je klantenkaart blijven volgen. Daarom staat er nu, bij een factuur die de deur uit is (`status!=='concept'`) maar nog geen kopie heeft, een knop **Definitief maken** in het adresblok, met de reden erbij ("Print of post je deze factuur?"). Concepten krijgen hem niet — die ben je nog aan het bouwen.

Daarbij hoort een nieuw veld `f.gegevensVastOp`, gezet door `factuurBevriesGegevens`. Zonder dat zou de editor "Vastgelegd bij het mailen" zeggen over een factuur die je zelf hebt vastgelegd. De regel kent nu drie uitkomsten, in deze volgorde: gemaild → *"Vastgelegd bij het mailen op ‹datum›"*; eigen stempel → *"Definitief gemaakt op ‹datum›"*; kopie zonder stempel (facturen van vóór dit veld) → het neutrale *"Vastgelegd"*. Het stempel wordt meegenomen in alle opruimpaden: mail-rollback, terug-naar-concept en dupliceren.

**Bestanden**: `index.html` — `factuurBevriesGegevens`/`factuurSnapshotVerschil`/`factuurSnapshotBijwerken` (nieuw), `FAC_SNAPSHOT_LABELS`, `facSnapshotVerschilBlok`, `facSnapshotBijwerkenActie`, `factuurMarkeerVerstuurd`, `factuurTerugNaarConcept`, `facMailVerstuurActie`, `facEditorRender`, `facAdresHerkomstRegel`, `facGegevensVastleggenActie`, veld `gegevensVastOp`

**Niet doen**: het bevriezen terugzetten naar `factuurMarkeerVerstuurd`. Bestaande facturen uit Drive hébben al een kopie van vóór deze wijziging; die blijft geldig en krijgt gewoon de bijwerkknop. Er is dus geen migratie nodig, maar ook geen weg terug zonder die facturen te raken.

## 2026-08-19 · Sjabloon per factuur instelbaar

**Probleem**: `facSjabloonVoor` kende al een overervingspad — factuur → klant → bedrijf → standaard — maar geen van die drie niveaus was ergens in te stellen. In de praktijk kreeg elke factuur dus de standaard, en kon je na aanmaken niet meer van sjabloon wisselen.

**Beslissing**: een keuzelijst **Sjabloon** in de editor, naast het factuurnummer (één rij van twee). Werkt op concepten én verstuurde facturen.
- Eerste optie is "Volgt de standaard — <naam>" (waarde `''` → `sjabloonId:null`). Kies je een sjabloon, dan staat de factuur er vast op.
- De hint eronder zegt welk van de twee geldt: *"Verander je de standaard later, dan verandert deze factuur mee"* versus *"Vast op X; een andere standaard raakt deze factuur niet."* Dat onderscheid is de kern — herontwerp je je sjabloon, dan verandert de PDF van elke factuur die nog meebeweegt, ook van verstuurde.
- Staat het voorbeeld open, dan bouwt het bij een wissel opnieuw op; daar kijk je juist naar als je hiermee speelt.
- De chain zit nu in `facSjabloonHerkomst(f)` (geeft `{id,bron,naam}`); `facSjabloonVoor` leest daaruit, zodat de editor kan tonen *waar* de keuze vandaan komt zonder de volgorde te herhalen. De labels voor bron 'klant' en 'bedrijf' zijn al geschreven, al is daar nog geen invoer voor.

**Ook opgelost**: de mobiele regel `#facEditorBody .fac-ed-grid:first-of-type` selecteerde niets zodra het blok "Factureren vanuit" ervoor stond — dus zodra je een tweede bedrijf had, bleven Klant en Referentie op een telefoon naast elkaar staan op 151px. Nu een klasse `.fac-ed-stapel` op de rijen die moeten stapelen, in plaats van een selector die van positie afhangt.

**Bestanden**: `index.html` — `facSjabloonHerkomst` (nieuw), `facSjabloonVoor`, `facEditorRender` (rij nummer + sjabloon), `facEdVeld` (tak `sjabloonId`), CSS `.fac-ed-stapel`

**Niet doen**: automatisch vastzetten bij versturen. Dat is verdedigbaar (een verstuurde factuur zou niet meer van vorm moeten veranderen), maar het is een gedragswijziging die niet gevraagd is — en wie zijn sjabloon verbetert wil dat vaak juist wél terugzien in oude PDF's. De keuze ligt nu bij de gebruiker, per factuur.

## 2026-08-19 · Factuurnummer met de hand, voorbeeld voor het versturen, KVK van de klant

**Probleem**: drie dingen die pas opvallen als je de module echt gebruikt.
1. De nummerreeks telde netjes door, maar je kon er niet in grijpen. Begin je halverwege je boekjaar in deze app, dan is factuur 1 niet waar je wilt starten — de Holding moest bij 11 beginnen en stond op 1. De teller in Facturatie-instellingen kon dat wel, maar alleen vóór het aanmaken en niet zichtbaar vanuit de factuur zelf.
2. Wat er precies op de PDF komt zag je pas na downloaden. Voor een document dat de deur uit gaat is dat een omweg.
3. In de sjabloonbouwer kon je het btw-nummer van de klant aanzetten, maar niet zijn KVK-nummer. Het stond wel al in de klantgegevens en in de snapshot.

**Beslissing**:
- **Nummer bewerkbaar in de editor**, voor concepten én verstuurde facturen (die zijn hier al bewerkbaar). Wat je intypt krijgt `nummerVast`, dus versturen overschrijft het niet. De teller van dat bedrijf schuift mee (`n.volgend = volgnummer + 1`) zodat het instellingenscherm en de volgende factuur hetzelfde zeggen. **Alleen omhoog**: corrigeer je een typefout naar een lager nummer, dan mag de reeks niet terugzakken langs facturen die er al zijn. Onder het veld staat welk nummer hierna komt.
  - Geweigerd: leeg, en een duplicaat binnen hetzelfde bedrijf (F000011 en H000011 mogen wel naast elkaar — eigen reeks per administratie). Het veld springt dan terug.
  - Een nummer zonder cijfers ("PROFORMA") wordt bewaard, maar laat de teller met rust.
- **Voorbeeldknop** in de actiebalk van de editor, naast PDF. Opent een modal met de echte PDF in een iframe, uit dezelfde `facPdfDoc()` als de download en de sjabloon-preview — ze kunnen dus niet uit elkaar lopen. Staat ná de editor in de DOM zodat hij erbovenop komt; Escape sluit eerst het voorbeeld. Blob-URL wordt bij sluiten ingetrokken, **tenzij** je "Openen in nieuw tabblad" gebruikt — dan zou intrekken dat tabblad leegmaken. Die knop is er omdat een PDF in een iframe leeg blijft op iOS.
  - Ontbrekende urenspecificatie geeft hier een waarschuwing, waar je nog kunt ingrijpen, in plaats van pas op de laatste PDF-pagina.
- **KVK van de klant** als vinkje bij Klantgegevens in de sjabloonbouwer, standaard uit (net als land en btw). Wettelijk hoeft alleen je eigen KVK op de factuur; dat van de klant is gemak voor wie zijn debiteuren wil matchen.

**Waarom niet alleen de teller in de instellingen**: die bestond al en werkt, maar hij is onzichtbaar op het moment dat je de vraag hebt — met een factuur voor je. Het veld in de editor beantwoordt de vraag waar hij gesteld wordt; de instellingen blijven de plek om een reeks in te richten vóór je begint.

**Bestanden**: `index.html` — `facEdVeld` (tak `nummer`), `facEditorRender` (nummerveld + hint + Voorbeeld-knop), `openFacPreview`/`closeFacPreview`/`facPreviewNieuwTab`, modal `#facPreviewModal`, `facPdfAdres` (KVK-regel), sjabloonbouwer ONTVANGER-vinkjes, `facStandaardBlokken`

**Niet doen**: `nummerVast` weghalen als je van bedrijf wisselt op een concept — dan verdampt het nummer dat je zelf hebt ingetypt. Explicit ingevoerd wint van het voorstel uit de reeks.

## 2026-08-16 · Maandkalender onder het uren-maandoverzicht

**Probleem**: "Per maand" is een draaitabel maand × klant binnen het jaar. Die zegt hoevéél uur er in een maand zit, maar niet op welke dagen. De vraag die je stelt als je een maand naloopt — heb ik die dinsdag wel geschreven? — kon je er niet aan stellen.

**Beslissing**: onder de tabel een kalenderraster van één maand, zoals een agenda: zeven kolommen ma–zo, een rij per week, de datums in de cellen. Per dag het totaal en een gekleurd blokje per klant (max. 3, daarna "+N meer"). Rechts een weektotaal.
- Welke maand: de laatste maand met uren, of de maand die je in de tabel aanklikt (de maandnaam is een knop, de rij wordt gemarkeerd). Plus ‹ › om binnen het jaar te stappen. De keuze staat in `urenKalenderMaand` en valt terug zodra je naar een ander jaar gaat.
- Klik op een dag → Registraties, week van die dag. Daar staan de regels die je wilt zien of aanpassen.
- Dagen waarvan álle uren gefactureerd zijn krijgen een ✓ bij het totaal. Zonder dat zien april (helemaal gefactureerd) en augustus (open) er identiek uit, terwijl dat verschil juist is waar je naar zoekt.
- De kalender leest uit dezelfde gefilterde lijst als de tabel, dus een klantfilter geldt er ook.

**Waarom een eigen kaartklasse** (`.uren-kal-card`, niet `.uren-sheet-card`): die laatste is `display:none` onder 768px, want een spreadsheet is desktop-werk. Een kalender wil je op een telefoon juist wél zien. Daar klapt hij dicht: korte dagnamen, geen weekkolom, chips vervangen door stippen, datum en dagtotaal blijven. Zeven kolommen van 49px passen op 375px; "Donderdag" paste daar niet in en liep over de rand van zijn cel — vandaar beide schrijfwijzen in de kop, met de CSS als keuze.

**Bestanden**: `index.html` — `urenWekenVanMaand` (nieuw; `urenMonthWeeks` rekent vanaf vandaag en kan geen losse maand aanwijzen), `urenRenderMaandKalender`, `urenKalenderMaand`/`urenKalenderMaandVan`/`urenKalenderMaandZet`/`urenKalenderDag`, `urenRenderMaandView`, CSS `.uren-kal*`

**Niet doen**: `MONTH_LABELS_NL[m].slice(0,3)` als afkorting — 'Maart' wordt dan 'maa'. Gebruik `toLocaleDateString('nl-NL',{month:'short'})`, dat geeft 'mrt'.

## 2026-08-16 · Facturen per bedrijf: één administratie tegelijk

**Probleem**: er wordt vanuit twee B.V.'s gefactureerd (Analytics en Holding). De gegevens waren al gescheiden — `settings.bedrijven[]` met een eigen nummerreeks per bedrijf, `bedrijfId` op de factuur — maar het overzicht niet. Alle facturen stonden door elkaar, zonder te zien waar ze vandaan kwamen, en de KPI's, debiteuren en btw telden beide administraties bij elkaar op.

**Beslissing**:
- Eén schakelaar in de topbalk van Facturen: een bedrijf, of "Alle bedrijven". De keuze staat in `factuurState.settings.bedrijfScope`, dus hij gaat mee naar Drive en is op elke computer hetzelfde. Verwijst hij naar een verdwenen bedrijf, dan valt hij terug op alles.
- De scope geldt voor de facturenlijst, de KPI's, debiteuren, btw, verzonden mails, de Excel-export en het bedrijf waar een nieuwe factuur vanuit gaat. **Alleen binnen Facturen** — klanten, uren, notities, checklist en agenda blijven gedeeld; die zijn van Frank en niet van een B.V. Vandaar dat de scope in `factuurState.settings` zit en niet in `rawState.settings`.
- Kolom "Vanuit" in de lijst, alleen zichtbaar bij "Alle bedrijven": sta je ín een administratie, dan zegt die kolom bij elke regel hetzelfde.
- **Btw-aangifte vraagt eerst om een bedrijf** (`facBtwVraagtBedrijf()`). Bij "Alle bedrijven" verschijnen er geen cijfers maar een keuze.
- Verhuis je in de editor een factuur naar een ander bedrijf terwijl je in één administratie zit, dan gaat de lijst mee — anders verdwijnt de factuur achter het venster dat je openhebt.
- Nieuwe factuur: de scope wint van `klant.bedrijfId`, die wint van `standaardBedrijf`. Klant.bedrijfId werd al gelezen maar was nergens in te stellen; staat nu in het klantvenster.

**Waarom**: twee B.V.'s zijn twee administraties, geen twee labels. Elke reeks is doorlopend, elk btw-nummer doet een eigen aangifte. Een opgeteld btw-bedrag over twee administraties hoort op geen enkel aangifteformulier thuis, dus dat getal komt niet in beeld — het tonen nodigt uit om het over te nemen. Een schakelaar in plaats van een filterchip omdat het geen filter is maar de plek waar je werkt (zoals Rompslomp het doet); daarom volgt ook wat je aanmaakt de scope.

**Wat gedeeld blijft**: betaaltermijn, standaard btw-tarief, kilometervergoeding, voettekst, btw-stelsel, sjablonen en de mailteksten. Die staan in het instellingenvenster nu onder de kop "Geldt voor alle bedrijven"; het blok erboven onder "Gegevens van &lt;bedrijf&gt;".

**Bestanden**: `index.html` — `factuurSettings` (hydratie `bedrijfScope`), `facBedrijfScope`/`facBedrijfScopeZet`/`facBedrijfFacturen`/`facBedrijfKort`/`facBedrijfNaam`/`facToonBedrijfKolom`, `facToggleBedrijf`, `facRenderBedrijfKnop`, `facZichtbaar`, `facRenderKpis`, `facRenderLijst`, `facRenderKaarten`, `facRenderDebiteuren`, `factuurBtwOverzicht` (param `bedrijfId`), `facBtwVraagtBedrijf`, `facRenderBtw`, `facMailsVanJaar`, `facRenderKlanten`, `factuurNieuw`, `facEdVeld`, `openFacInstellingen`, `openKlantModal`, `facExportBoekhouding`

**Niet doen**: de scope in `rawState.settings` zetten of hem laten doorwerken in Uren/Notities/Checklist — klanten en uren zijn gedeeld, en een urenregistratie hangt aan een klant, niet aan een B.V. En: btw-cijfers tonen bij "Alle bedrijven".

## 2026-08-13 · Uren toonde een lege lijst in plaats van het pincodeslot

**Probleem**: op een telefoon leek de urenadministratie leeg terwijl dezelfde uren op de laptop gewoon stonden — zelfde account, zelfde Drive-bestand. Dat leest als dataverlies en is het niet.

**Oorzaak**: facturen én uren zitten samen in één versleuteld blok (`pinPakGeheimen()` levert `{facturen, uren, klanten}`). De sleutel wordt per apparaat bewaard en verloopt na een maand. Staat er geen sleutel, dan eindigt de ontsleutel-stap in `hydrateerState()` op `if(!bewaard) return;` — stil, en `urenState` blijft leeg. `pinControleerToegang()` werd alleen aangeroepen in `renderFacturenModule()`, niet in `renderUrenModule()`. Facturen vroeg dus netjes om de code; Uren rende door en toonde nul regels.

**Beslissing**: `renderUrenModule()` roept `pinControleerToegang()` aan als eerste stap — vóór `urenMigrateEntries()` en `urenApplyRecurring()`, die anders over een lege state liepen.

**Waarom**: één versleuteld blok hoort één poort te hebben. Twee modules die uit dezelfde ciphertext lezen en maar één die om de sleutel vraagt, betekent dat de andere de vergrendelde toestand als "leeg" presenteert — en dat is precies de melding die je niet wilt zien over je administratie.

**Bestanden**: `index.html` (`renderUrenModule`, comment bij `pinControleerToegang`)

**Niet doen**: een module die uit `rawState.geheim` leest zonder `pinControleerToegang()` als eerste regel. Komt er een derde bij, dan hoort die poort daar ook.

**Wat níét misging**: wegschrijven. `geheimenKlaar()` staat op `false` zolang het slot dicht is, dus de lege state kon Drive niet overschrijven — nagemeten in de preview.

## 2026-08-13 · Mobiele pop-upschermen — brede tabellen worden blokjes

**Probleem**: de factuur-editor zette de regels als tabel van zes kolommen naast elkaar (ruim 450px in een blad van 342px). Je moest opzij schuiven om bij het bedrag te komen, en dat gold ook voor het sjabloonvenster (vaste kolom van 392px naast de preview). Verder vielen voetknoppen net buiten de rand, en schreeuwde de grijze hulptekst in invoervelden even hard als je eigen invoer.

**Beslissing**:
- Brede tabellen worden op mobiel een blokje per rij: `thead` verdwijnt, elke `tr` wordt een raster van zes kolommen. De kolomkop reist mee als `data-lab` en komt via `td::before` terug bij het veld zelf.
- Indeling per factuurregel: omschrijving over de volle breedte, dan aantal/eenheid/stuksprijs, dan btw/bedrag/✕. Drie smalle velden op één regel scheelt een hele rij (254px → 206px).
- `.modal-footer` en zijn twee kinderen krijgen `flex-wrap: wrap` — generiek, want dit trof meerdere vensters.
- Grid-kolommen in modals gebruiken `minmax(0,1fr)` in plaats van `1fr`.
- Tabstrips passen weer op één regel doordat de filterknop op mobiel alleen het trechtertje toont (`.uren-btn-lab` verborgen, `aria-label` op de knop).
- Uren-periodelabel krijgt een korte schrijfwijze op smalle schermen; het label is zelf de weg terug naar vandaag.

**Waarom**: `1fr` krimpt niet onder de eigen minimumbreedte van een `select` of datumveld, dus één lange klantnaam duwde het hele blad breder. En de 16px op invoervelden moest blijven staan — iOS zoomt in bij focus op alles daaronder — maar iOS kijkt niet naar de maat van de `::placeholder`, dus daar kon de hulptekst wél kleiner (13,5px).

**Bestanden**: `index.html` (`.fac-ed-*` rond 1414, mobiele media-query rond 4250 en 4790, `facEditorRender`, `urenRenderFilters`, `facRenderFilters`, `urenRenderPeriodLabel`, `urenToggleMenu`)

**Niet doen**: horizontaal scrollen als oplossing voor een te brede tabel op mobiel — Frank wil niet opzij schuiven. En een knop weghalen zonder hem elders terug te zetten: "Vandaag" verdween uit de balk maar staat nu in het ⋯-menu én op het label.

**Nagemeten**: op 393px geen horizontale overloop in 23 modals en 6 modules; desktop (1280px) ongewijzigd — daar is de factuurregel weer een echte tabelrij.

## 2026-08-13 · Mobiele weergave — modules gescheiden, bediening ingeklapt

**Probleem**: op telefoonbreedte stonden Uren en Facturen onder *elke* module doorheen; op het dashboard zag je stukken van de urenbalk en de factuurtabs. Daarnaast kostte de bediening zoveel hoogte dat de eerste inhoudsregel pas ver onder de vouw begon (Uren 394px, Checklist ~770px), en was de ↻-knop voor Drive alleen via de zijbalk bereikbaar terwijl "niet verbonden" regelmatig langskomt.

**Beslissing**:
- `#mod-uren` / `#mod-facturen` mogen geen `display` meer zetten in de mobiele media-query. Zichtbaarheid hoort uitsluitend bij `.module.active`.
- Dashboard-kaarten zijn op mobiel uitklapbaar (`[data-dash-card]` + `.dash-card-open`), bovenste open; de kop draagt titel, aantal en pijl.
- Terugkerend patroon voor hoogte: wat je zelden gebruikt gaat achter een `:focus-within` (nieuwe taak) of naar het ⚙-menu (nieuwe klant, wekelijkse review); wat blijft staan krijgt één tikmaat van 36px.
- `viewport-fit=cover` in de meta-viewport, zodat de bestaande `env(safe-area-inset-*)`-regels op iOS werkelijk iets doen.
- Verbinden met Drive staat als vaste knop rechtsboven in `.mobile-topbar`; `setSync()` spiegelt de status naar een stip, rood bij een fout.

**Waarom**: een ID-selector (1-0-0) wint van `.module.active` (0-2-0) — dat is geen randgeval maar de regel, dus `display` op een module-ID is per definitie fout. En zonder `viewport-fit=cover` geeft iOS altijd 0 terug voor de safe-area, waardoor die CSS er wel stond maar niets deed.

**Bestanden**: `index.html` (meta-viewport, `.mobile-topbar`, `.mobile-bottom-nav`, mobiele media-query vanaf ~4236, `setSync`, `renderDashboard`, `renderNotesTree`)

**Niet doen**: `display` zetten op `#mod-<naam>` binnen een media-query — scope het aan `.module.active` of laat het weg. En inputs onder 16px zetten op mobiel: dan zoomt iOS bij focus in. Wil je hulptekst kleiner, gebruik `::placeholder`.

## 2026-08-01 · Uren-module herbouwd — registratieregels i.p.v. matrix

**Probleem**: de oude Uren-module was een matrix (klant × dag) waarin per klant per dag precies één getal paste. Een omschrijving zat verstopt achter een ✎-popup, en er was geen manier om een reeks uren in één keer op "gefactureerd" te zetten. De module stond bovendien niet meer in de navigatie (`switchModule` redirectte `uren` → `dashboard`), dus was hij feitelijk onbereikbaar.

**Beslissing**: volledig herbouwd rond één regel per registratie — `{id,date,clientId,hours,description,status,createdAt,updatedAt}` — met vier weergaven: Registraties (spreadsheet), Per klant, Per week, Per maand. Concreet:
- **Meerdere regels per klant per dag** toegestaan. `urenGetEntry(clientId,date)` is vervallen; alles loopt via `urenEntriesBetween()` + filters.
- **`invoiced:bool` → `status:'open'|'concept'|'invoiced'`**, met idempotente migratie in `urenMigrateEntries()` (draait bij elke load én render).
- **Bulk-status**: checkbox per regel + per dag, selectiebalk met acties. Plus "Factureer <n> u" per klant in het klant-overzicht — Frank factureert per klant per maand, dus dat moest één klik zijn en niet regel-voor-regel. Alles loopt via `urenSetStatus()` zodat undo overal identiek werkt.
- **Duur-invoer**: `urenParseHours()` accepteert `3,5` · `3.5` · `3:30` · `3u30` · `90m` · `45min`. Daarnaast − / + steppers van 15 min (in de tabel én in het invoerblad), optel-chips (+15m/+30m/+1u/+2u/+4u), en ↑/↓ in het urenveld (Shift = 1 uur).
- **Export**: `urenBuildExport(mode)` levert één platte tabel die zowel `urenExportXlsx()` (getallen als getal, niet als tekst) als `urenExportPdf()` voedt.
- **PIN-lock verwijderd** (`LS_UREN_PIN`, lock- en set-pin-schermen). Op verzoek van Frank: de app is single-user en de Gist is al privé.
- **Geen streefuren/normen** in de KPI-strip. Bewust: de module telt wat er staat, hij beoordeelt niet.

**Waarom PDF via `window.print()`** en niet via jsPDF: geen extra CDN-dependency, en de printdialoog geeft "Opslaan als PDF" op elk platform. De opmaak zit in `@media print` met `#urenPrintArea` als enige zichtbare element — meteen bruikbaar als factuurbijlage.

**Waarom een periode-anker**: bij het wisselen van weergave springt de periode mee via `urenAnchorDate()` (vandaag als die in beeld is, anders het midden). Zonder dat sloeg week 31 (27 jul–2 aug) om naar augustus terwijl je naar juli keek.

**Ook opgelost**: datums werden berekend met `toISOString().slice(0,10)`, wat in NL-zomertijd de dag ervóór opleverde. Vervangen door `urenIso()` op lokale tijd.

**Bestanden**: `herling_analytics_home.html` — CSS `.uren-*` blok volledig vervangen (incl. dode `.uren-grid/.uren-hdr/.uren-cell` uit de theme-overlay), `#mod-uren` HTML, `#urenEntryModal`, `#urenPrintArea`, sidebar- en mobiele nav-item, `switchModule`, `updateNavBadges`, `renderAll` (validMods), 3 hydratie-paden in `loadGist`/backup-restore. Look-and-feel-mockup: `docs/uren-mockup.html`.

**Niet doen**: `urenApplyRecurring()` laten aanvullen op basis van template-id in plaats van "bestaat er al een regel van die klant op die dag" — met meerdere regels per dag zou dat bestaande handmatige invoer verdubbelen. Ook niet: de draft-regel onderaan de tabel zetten; hij staat bovenaan omdat de lijst aflopend op datum sorteert.

## 2026-05-11 · Smart Quick-Add — subtaken via AI

**Probleem**: complexere taken ("rapport: intro, analyse, conclusie") werden als één regel toegevoegd. Gebruiker moest daarna handmatig subtaken inkloppen.
**Beslissing**: AI extraheert nu subtasks-array per task wanneer de input expliciet meerdere stappen noemt. In preview tonen als ingesprongen lijst onder de hoofdtaak — elk subitem inline bewerkbaar, individueel removebaar, plus "+ Subtaak"-knop voor handmatig aanvullen. Bij apply naar `checklistState.items` worden de strings geconverteerd naar de bestaande subtask-shape `{id,text,done:false}`.
**Waarom terughoudend in prompt**: "voorbeelden WEL/GEEN subtaken" expliciet in system-prompt + harde cap van 10 subtaken per task in normalisatie. AI is anders té eager en plakt overal subtaken aan vast — irritant. Trigger-woorden ":", "met", "incl.", komma-opsomming.
**Bestanden**: `herling_analytics_home.html` — `_buildQuickAddSystemPrompt` (subtasks-regels), `parseQuickAddAI` (normalisatie + cap), `_renderQuickAddPreview` (subtasks-block), `_onQuickAddPreviewEdit/_onQuickAddPreviewClick` (sub-field/sub-remove/sub-add delegation), `applyQuickAddAI` (string → `{id,text,done}` conversie) · CSS `.qa-subtasks`, `.qa-subtask-row`, `.qa-edit-subtask`, `.qa-subtask-add`
**Niet doen**: subtasks-cap (10) verhogen zonder reden — over de 10 wordt het cognitief te zwaar voor een quick-add. AI verleiden tot altijd-subtaken — leidt tot triviale opsplitsingen ("mail sturen" → "open Outlook" / "schrijf" / "klik verzenden"). De prompt is bewust voorbeeld-driven.

## 2026-05-11 · AI features — UX-optimalisaties (8 verbeteringen)

**Probleem**: na eerste gebruik bleken meerdere frictiepunten: AI maakte soms 1 detail fout (geen edit-mogelijkheid → opnieuw parsen), spinner van 3 sec voelde traag, geen vorige-week reviews, dubbele clicks → dubbele API-calls, geen retry-knop bij errors, geen quota-zichtbaarheid, Escape-toets deed niets, geen regenerate.
**Beslissing**: alle 8 in één pakket:
1. **Editable preview** in Quick-Add — alle velden inline bewerkbaar (text inputs + chip-selects). Event-delegation in `_attachQuickAddPreviewListeners` muteert `_quickAddAIResult` direct. Remove-knop spliced item eruit en re-rendert.
2. **Vorige-week navigatie** in review — `_weeklyReviewOffset` state + `changeWeeklyReviewWeek(delta)`. Volgende-knop disabled bij `offset>=0` (geen toekomst). Bij lege week 0: auto-detect vorige week en toon klikbare link.
3. **Streaming** review — nieuwe `_streamGemini()` async iterator (SSE via `?alt=sse`). Throttled re-render via marked.parse op max 10 fps. Blinkende `▌` cursor via `.streaming::after` CSS.
4. **Escape-key** sluit beide modals — globale `keydown` listener controleert welk modal `.open` heeft.
5. **Concurrent-guard** — `_aiCalling={quickAdd,weeklyReview}` flags voorkomen dubbele simultane calls.
6. **Retry-knop** bij errors — `_aiSetError(el,msg,retryFnName)` injecteert "🔄 Opnieuw proberen" tenzij het een config-error is (`_aiShouldShowRetry` checkt op API-key fouten).
7. **Regenerate-knop** — `regenerateWeeklyReview()` gooit `_weeklyReviewMarkdown` weg en triggert `generateWeeklyReview()` opnieuw.
8. **Quota-badge** — per-dag teller in `LS_AI_USAGE`, auto-reset bij nieuwe dag. Badge `aiQuotaBadge{Quick,Review}` met kleurcodering (mid bij 1000+, high bij 1400+). Bumped in `callGemini` én `_streamGemini` na succesvolle response.
**Waarom**: deze 8 zijn de "voelbare" frictiepunten tijdens dagelijks gebruik. Eén pakket want ze delen utilities (`_aiSetError`, `_aiBumpUsage`, concurrent-guards) en het kost meer overhead om los te commiten.
**Bestanden**: `herling_analytics_home.html` — volledige AI INTEGRATIE rewrite (~700 regels) · CSS toevoegingen voor `.qa-edit-*`, `.wr-week-nav`, `.ai-quota-badge`, `.ai-retry-btn`, `.streaming::after` · modal-HTML updates voor week-nav en quota-badge spans.
**Niet doen**: throttle van streaming verlagen naar elke chunk — marked.parse op grote markdown lijsten wordt dan zichtbaar laggy. Concurrent-guard verwijderen — dubbele API-calls zijn geld weg en geven race conditions in preview-render.

## 2026-05-11 · AI Wekelijkse Review — auto-gegenereerd vanuit checklist

**Probleem**: gebruiker wil een snel weekoverzicht zonder zelf data te hoeven samenstellen.
**Beslissing**: knop `📊 Wekelijkse review` in dash-topbar. Verzamelt automatisch alle `done` items met `doneAt >= maandag 00:00`, groepeert per klant + prio, stuurt naar Gemini Flash met vaste markdown-template. Output toonbaar in modal + opslagbaar als notitie onder folder `Reviews`.
**Waarom auto-collect (geen user input)**: review is per definitie data-driven; alle relevante input zit al in `checklistState`. User hoeft alleen "genereer" te klikken.
**Waarom `doneAt` toegevoegd**: zonder timestamp kon "deze week voltooid" niet betrouwbaar gefilterd worden. Nu set in `toggleChecklistDone` + de twee plekken waar auto-complete via subtaak-set gebeurt.
**Architectuur**: directe fetch naar Gemini (text-mode, geen JSON schema) want we willen markdown terug. Niet via `callGemini()` omdat die responseMimeType=json hardcodet. Render via `marked.parse()` (al geladen voor Notes). "Reviews" folder wordt lazy aangemaakt bij eerste opslag.
**Bestanden**: `herling_analytics_home.html` — `weeklyReviewModal` HTML · `_collectWeeklyReviewData`, `_buildWeeklyReviewPrompt`, `generateWeeklyReview`, `saveWeeklyReviewAsNote` · `toggleChecklistDone` + 2 subtaak-auto-done plekken nu met `doneAt`
**Niet doen**: temperature te laag zetten (0.5 nu — geeft het iets minder droog dan 0.2). `_buildWeeklyReviewPrompt` mag groter worden mits we de klanten-aggregatie compact houden — 50 items × ~80 tokens = ~4k input, ruim binnen Flash-limieten.

## 2026-05-11 · AI Smart Quick-Add via Google Gemini Flash

**Probleem**: bestaande quick-add vereiste `@klant !datum` token-syntax. Niet natuurlijk voor "morgen 10u Boskalis call + concept-doc voor vrijdag" — leverde taken+events tegelijk op.
**Beslissing**: nieuwe "✨ Slim toevoegen" sidebar-knop. Modal met natuurlijke-taal input → Gemini Flash API → preview-kaarten → confirm → schrijft tasks naar `checklistState.items` + events naar `rawState.agenda.events`.
**Waarom Gemini Flash (niet Claude API)**: gratis tier 1500 req/dag dekt dagelijks gebruik. Anthropic API heeft prepaid billing nodig — Frank's Claude Max plan dekt API niet. Gemini Flash kwaliteit voor NL parsing-taken is voldoende.
**Architectuur**: generieke `callGemini({system,user,schema})` helper — herbruikbaar voor wekelijkse review (volgende feature) + toekomstige AI-uitbreidingen. JSON-mode response met defensieve normalisatie. API-key in `LS_GEMINI_KEY` localStorage.
**Bestanden**: `herling_analytics_home.html` AI INTEGRATIE blok (einde script) · sidebar `nav-item-ai` · `quickAddAIModal`
**Niet doen**: API-key in repo committen. Gemini Flash quota's omhoog forceren — als Frank het echt opmaakt is het tijd voor paid tier of Claude API.

## 2026-05-11 · Checklist hero — bulk in/uitklap-knop voor subtaken

**Probleem**: subtaken individueel uit/inklappen wordt traag bij veel taken. Geen overview-actie aanwezig.
**Beslissing**: één dynamische knop in `cl2-hero-actions` (naast "Verwijder afgerond" en "Archief"). Label en chevron-rotatie reflecteren de huidige aggregate state: "Uitklappen subtaken ▼" als de meeste dicht zijn, "Inklappen subtaken ▲" als de meeste open zijn.
**Waarom**: bestaande hero-actie-groep is dé natuurlijke plek voor bulk-acties — gebruiker kent de patronen daar al. Geen aparte toolbar nodig.
**Bestanden**: `herling_analytics_home.html` `_clSubtaskAggregate`, `toggleAllSubtasks`, `renderChecklistHero`
**Niet doen**: tonen in archive-view (zou raar zijn) of als geen items subtaken hebben (overbodig). Beide guards al ingebouwd.

## 2026-05-11 · Checklist quick-add — deadline-veld toegevoegd

**Probleem**: de inline "Nieuwe taak toevoegen" balk had alleen prio + klant. Voor een deadline moest je het detail-modaal openen — onhandig bij snelle braindump.
**Beslissing**: native `<input type="date">` (132px) tussen klant-select en Toevoegen-knop. Geen custom popover.
**Waarom**: native picker is keyboard-/mobile-vriendelijk en kost geen extra code. `data-set="0|1"` attribuut geeft empty state een muted color zodat het optioneel voelt.
**Bestanden**: `herling_analytics_home.html` `.cl2-newitem-date` CSS · `renderChecklistNewItem` · `clAddInlineItem`
**Niet doen**: deze ook gebruiken voor andere quick-add rows zonder het ontwerp na te lopen — 3 selects + button is op de rand van wat in één row past op tablet-breedtes.

## 2026-05-10 · Agenda instant-render zonder spinner

**Probleem**: bij openen van agenda-module altijd zichtbare spinner, ook als localStorage-cache vol stond. Gebruiker dacht dat handmatige refresh nodig was.
**Beslissing**: stale-while-revalidate op view-niveau in `fetchAndRenderView()` — synchroon lezen uit cache + meteen renderen, daarna async fetch op de achtergrond. Spinner alleen bij koude start (geen cache aanwezig).
**Waarom**: PWA opent vaak; spinner-flash + dubbele render (na background-refresh) wekten indruk dat agenda kapot was.
**Bestanden**: `herling_analytics_home.html` `fetchAndRenderView()` ~r10425
**Niet doen**: spinner ongeconditioneerd terugzetten — eerste-keer UX is bewust ontworpen.

## 2026-05-04 · Agenda — duplicate events bij Outlook recurring met overrides

**Probleem**: Outlook recurring events met afwijkende instances werden dubbel getoond.
**Beslissing**: UID/RECURRENCE-ID/EXDATE handling toegevoegd in `parseICS` + `expandEvents`. Override-instances vervangen de gegenereerde occurrence.
**Bestanden**: `herling_analytics_home.html` parseICS/expandEvents · zie `docs/agenda.md`
**Niet doen**: RECURRENCE-ID negeren — dat veroorzaakt direct duplicates terug.

## 2026-05-04 · iCal 4-proxy chain + 5-maands event-cache

**Probleem**: Boskalis-feed deed 25s over de cold load; sommige proxies vielen om bij grote feeds.
**Beslissing**: 4-proxy chain (corsproxy.io → allorigins/raw → allorigins/get → codetabs.com) met parallel race + per-feed proxy-cache. Plus 5-maands event-cache met stale-while-revalidate.
**Resultaat**: 25s → 0ms na cold load.
**Bestanden**: `herling_analytics_home.html` `fetchICalText`, `_refreshSourceEvents`
**Niet doen**: terugvallen naar enkele proxy of synchrone chain — dat hangt op één trage proxy.

## 2026-05-03 · Externe tools popover in sidebar

**Beslissing**: 10 links in 4 categorieën (Administratie / Uren / Dev / Design) in sidebar-popover.
**Waarom**: snel naar vaak-gebruikte externe tools zonder extra modules in de app te bouwen.
**Bestanden**: `herling_analytics_home.html` sidebar render

## 2026-05-03 · Design polish — KPI's, card-headers, module accents

**Beslissing**: KPI-getallen 36px tabular-nums, card-headers 18px Plus Jakarta Sans, module accent ribbons (6 kleuren), staggered card entrance, SVG grain overlay.
**Waarom**: de app moest professioneler ogen — minder "AI-default", meer eigen identiteit.
**Bestanden**: CSS in `<style>` blok van `herling_analytics_home.html`

## 2026-05-03 · Dashboard — asymmetrische kaart-hoogtes

**Beslissing**: Checklist + Agenda kaarten 440px (2× hoger), Todo + Notes 220px.
**Waarom**: Checklist/Agenda hebben meer items om te tonen; gelijke hoogtes verspilden ruimte.
**Bestanden**: CSS `.dash-card` varianten

## 2026-05-03 · MSAL + Google OAuth volledig verwijderd

**Probleem**: Frank heeft geen Entra-rechten op zijn werk-account → MSAL useless. Google OAuth onderhouden voor één gebruiker = overkill.
**Beslissing**: ~400 regels OAuth weg. Outlook agenda's via gepubliceerde iCal-link (instructies in cal-sources modal). Geen `accounts[]` meer in state.
**Niet doen**: OAuth terugbrengen zonder eerst te checken of Entra-rechten beschikbaar zijn.
**Commit**: `4f88c0c`

## 2026-04-30 · Quality-guard infrastructuur

**Beslissing**: `validate.mjs` (syntax + onclick refs) + `test.html` (16 smoke tests) + `.githooks/pre-push` + Claude Code hooks.
**Waarom**: 30 april ging er code stuk door regressies die lokaal niet werden gezien.
**Bestanden**: `validate.mjs`, `test.html`, `.githooks/pre-push`, `.claude/hooks/`
**Niet doen**: hooks omzeilen met `--no-verify` zonder expliciete user-bevestiging.

## 2026-04-30 · Conflict-detectie weg uit saveGist

**Probleem**: false-positive conflicts door GitHub eventual consistency op single-user setup.
**Beslissing**: PATCH zonder conflict-check + localStorage als instant backup vóór elke save.
**Waarom**: Frank werkt nooit op meerdere machines tegelijk → conflict-checks waren puur ruis.
**Bestanden**: `saveGist()`
**Niet doen**: conflict-check terugzetten zonder eerst multi-user scenario te valideren.

## 2026-04-30 · Force-push protectie via pre-push hook

**Beslissing**: `.githooks/pre-push` blokkeert non-fast-forward pushes tenzij `ALLOW_FORCE_PUSH=1`.
**Waarom**: 30 april heeft een force-push remote commits weggevaagd. Niet nog eens.
**Niet doen**: hook uitschakelen of obfuscaten.

## 2026-04-30 · Checklist filters + UX verbeteringen

**Beslissing**: filters voor prio/klant/periode in `clFilters`. Inline subtaak-edit. Auto-close van item als alle subtaken klaar zijn.
**Bestanden**: `renderClFilterBar`, `commitSubtaskInput`

## 2026-08-01 · Facturatie-module bovenop de urenregistratie

**Probleem**: facturen werden buiten de app gemaakt (Rompslomp), terwijl de uren al in de app staan. Dubbel werk en risico op dubbel factureren.
**Beslissing**: nieuwe module `#facturen` met `factuurState={invoices,settings}` in de Gist. Uren → factuur via klant + periode, één regel per tarief (aantal × uurtarief), zoals de bestaande facturen van Herling Analytics.
**Waarom snapshots**: een verstuurde factuur bevriest klant- én afzendergegevens (`f.klant`, `f.afzender`). Zonder snapshot zou een adreswijziging van vandaag een factuur van vorig jaar met terugwerkende kracht veranderen — onacceptabel voor een administratie met 7 jaar bewaarplicht.
**Waarom uren pas koppelen bij versturen** (niet bij opstellen): een concept dat je weggooit mag geen urenregistraties op "gefactureerd" laten staan. `factuurUrenKoppelen`/`-Loskoppelen` zetten `entry.status` en `entry.factuurId`.
**Waarom geen PDF in de Gist**: de Gist is tekstopslag en `saveGist()` schrijft de héle state weg bij elke mutatie. Base64-PDF's (+35%) zouden bij ~100 facturen megabytes per toetsaanslag rondslepen. De factuurdata is de bron; de PDF wordt on-demand opnieuw gegenereerd en is daardoor altijd reproduceerbaar.
**Nummering**: `factuurVolgendNummer(peek,negeerId)`. `negeerId` is essentieel — zonder telt de factuur zijn eigen nummer mee als "in gebruik" en schuift het nummer uit het concept bij versturen een plek op.
**Btw**: afronden per regel (Belastingdienst), niet pas op het eindtotaal — anders loopt het een cent uit de pas. 21/9/0 + verlegd.
**Nieuwe dependency**: jsPDF via CDN. Nodig omdat de app het bestand zelf in handen moet hebben om te kunnen mailen/archiveren. De uren-export blijft bewust via `window.print()`.
**Bestanden**: `herling_analytics_home.html` — `factuurState`, `factuur*`-helpers, `fac*`-view-laag, `facPdfDoc`, CSS `.fac-*`, modals `facWizardModal`/`facEditorModal`/`klantModal`/`facInstellingenModal`
**Niet doen**: PDF-bestanden in de Gist opslaan. Uren koppelen bij het aanmaken van een concept. `factuurVolgendNummer` aanroepen zonder `negeerId` vanuit `factuurMarkeerVerstuurd`.
**Open**: Gmail-verzending (OAuth) — vereist een Google Cloud project van Frank; bij een privé-account verlopen tokens elke 7 dagen (testing-modus).

## 2026-08-01 · Factuursjabloon als blokken, niet als canvas

**Vraag**: een Figma-achtige drag-and-drop builder met vrije x/y-positionering en HTML+PDF-export.
**Beslissing**: blokkenmodel met verticale stapel. Een sjabloon is `{id,naam,settings,blocks[]}`; blokken zijn LOGO / ZENDER / ONTVANGER / META / RICH_TEXT / REGELS / FOOTER, herordenbaar door slepen, elk met eigen zichtbaarheid, kolom, uitlijning, marges en veld-/kolomkeuzes.
**Waarom geen vrije positionering**: de regeltabel groeit met het aantal factuurregels. Absoluut geplaatste blokken eronder vallen dan over de tabel heen. Geen enkel serieus pakket (Moneybird, Exact, e-Boekhouden) doet vrije positionering — allemaal stacking met zones. Het compromis is `kolom:'links'|'rechts'|'vol'`: een links-blok gevolgd door een rechts-blok vormt één strook, genoeg voor de klassieke kop.
**Waarom geen HTML-renderpad**: jsPDF tekent op coördinaten en rendert geen HTML/CSS. De twee uitwegen zijn allebei slecht — html2canvas maakt van de factuur een afbeelding (tekst niet selecteerbaar, wazig printen, megabytes), en twee losse renderers gaan onvermijdelijk uit elkaar lopen. Nu is `facPdfDoc()` de enige waarheid en toont de preview exact dat document.
**Niet gebouwd**: page-break-editor (vereist de layoutberekening dubbel), WYSIWYG rich text (jsPDF kan geen HTML; wel *vet*, _cursief_ en opsommingen).
**Migratie**: instellingen van de vorige sjabloon-editor (`settings.sjabloon`) worden automatisch omgezet naar blokken via `facMigreerSjabloon()`.
**Bestanden**: `herling_analytics_home.html` — `FAC_BLOKTYPEN`, `facStandaardBlokken`, `facSjablonen`, `facSjabloonVoor`, `facPdfDoc` + `facPdfBlok`-familie, editor `facSj*`, CSS `.fac-blok*`
**Niet doen**: alsnog absolute posities toevoegen zonder op te lossen wat er gebeurt bij 25 factuurregels. Een tweede (HTML-)renderer naast jsPDF.

## 2026-08-01 · Factureren vanuit meerdere bedrijven

**Beslissing**: `settings.bedrijf` → `settings.bedrijven[]`, elk met een **eigen nummerreeks**.
**Waarom eigen reeks**: een doorlopende factuurnummering hoort bij één administratie. Twee bedrijven uit één reeks laten tellen geeft gaten in beide — de Belastingdienst ziet dat als een onvolledige reeks. `factuurVolgendNummer(peek,negeerId,bedrijfId)` kijkt alleen naar facturen van hetzelfde bedrijf.
**Bestanden**: `factuurSettings` (migratie), `factuurBedrijf`, `factuurBedrijfIdVan`, `factuurAfzenderSnapshot(bedrijfId)`, instellingenmodal
**Niet doen**: één gedeelde teller voor alle bedrijven.

## 2026-08-05 · Opslag naar Google Drive (fase 1 afgerond, fase 2 open)

**Probleem**: data stond in een "secret" GitHub Gist. Dat is niet privé maar *onvindbaar* — iedereen met de URL leest hem zonder in te loggen. Daarnaast stond de PAT leesbaar in localStorage, met XSS als route ernaartoe.
**Beslissing**: overstap naar Google Drive `appDataFolder` — een verborgen map per gebruiker die alleen deze app kan benaderen. Geen URL, geen losse token; Google dwingt de toegang af op basis van het ingelogde account. Daarmee wordt de Google-login pas een echte beveiligingslaag in plaats van een drempel.
**Waarom niet Supabase**: dat wint pas als je relationele queries wilt. Voor opslag en toegang is Drive genoeg, tegen een fractie van het werk en zonder extra dienst.
**Fase 1 (gereed, `DRIVE_ACTIEF=true`)**: schrijven naar Drive én Gist; bij het laden worden beide opgehaald en wint de nieuwste (`driveProbeerLaden` + `verwerkDriveVersie`). Nooit een moment met één kopie.
**Twee stille fouten die dit opleverde** — beide gevonden door gerichte vragen van Frank, niet door tests:
1. De verversknop zei nog "van GitHub" terwijl de app beide bronnen ophaalt.
2. Drive kreeg de *uitgeklede* notities (`sanitizeNotesStateForGist`). Die strip bestaat alleen vanwege GitHub's 1 MB-limiet; Drive kent die niet. Na fase 2 waren geplakte afbeeldingen dus voorgoed weg. Drive krijgt nu de volledige state.

### Fase 2 — nog te doen
Voorwaarden vooraf: enkele dagen zonder waarschuwingen, `driveStatus()` beweegt mee, getest op een tweede apparaat, en het bestand in Drive is gegroeid voorbij de 401 KB van de eerste kopie.

Stappen:
1. `loadGist()` → Drive-only; Gist-tak en `fetchGistContent` eruit.
2. `saveGist()` → Drive-only; `gistState`/`sanitizeNotesStateForGist` vervalt (die bestond voor de 1 MB-grens).
3. `refreshGist()` → alleen Drive herladen.
4. Setup-scherm: token-invoer weg. De Google-login is de toegangspoort; toon hooguit een Drive-toestemmingsknop.
5. "GitHub-token wijzigen" uit het instellingen-menu.
6. Opruimen: `LS_TOKEN_KEY`, `LS_GIST_KEY`, `ghToken`, `gistId`, `gistRequest`, `sanitizeToken`, Gist-diagnose.
7. Teksten nalopen op resterende verwijzingen naar GitHub.

**Niet doen**: de Gist zelf verwijderen — laat hem staan als bevroren archief; kost niets en is de laatste terugvaloptie. Fase 2 uitvoeren zonder verse back-up. De stappen half afmaken: zonder werkende opslag is er na het weghalen van de Gist geen vangnet meer.
**Bestanden**: `index.html` — `driveLees`/`driveSchrijf`/`driveVraagToken`, `driveProbeerLaden`, `verwerkDriveVersie`, `loadGist`, `saveGist`

## 2026-08-09 · Btw-overzicht per kwartaal — factuurstelsel als standaard

**Probleem**: vier keer per jaar de aangifte omzetbelasting invullen betekende puzzelen in de Excel-export. De cijfers waren er wel, maar niet in de vorm van het aangifteformulier.

**Beslissing**: vijfde tab "Btw" in de facturenmodule, met kwartaalkiezer (Q1–Q4 + heel jaar) en een expliciete keuze tussen **factuurstelsel** (standaard) en **kasstelsel**. De rubriektabel volgt het aangifteformulier: 1a (21%), 1b (9%), 1e (0% en btw verlegd), 1c (overige tarieven). Daaronder de onderbouwing: welke facturen erin zitten, klikbaar naar de factuur zelf.

**Waarom**:
- *Factuurstelsel als standaard, niet als stille aanname.* Voor een B.V. is het factuurstelsel de norm — je draagt af in het tijdvak van de factuurdatum, ook als de klant nog niet betaald heeft. Maar deze keuze bepaalt welke bedragen naar de Belastingdienst gaan, dus hij staat als knop op het scherm in plaats van verstopt in de code. De stand wordt bewaard in `factuurState.settings.btwStelsel`.
- *Kasstelsel rekent per betaling, niet per factuur.* Bij een deelbetaling gaat het bedrag naar rato over de btw-staffel. Anders zou de btw van een heel tarief in het verkeerde kwartaal terechtkomen.
- *Concepten tellen niet mee.* Een concept is nog geen factuur; alleen `status !== 'concept'` telt.
- *Het overzicht zegt zelf wat het niet is.* De voorbelasting (rubriek 5b, de btw op eigen inkopen) zit niet in deze app — er is geen inkoopadministratie. Er staat daarom letterlijk op het scherm dat dit niet het over te maken bedrag is. Een overzicht dat eruitziet als een complete aangifte terwijl het de helft mist, is gevaarlijker dan geen overzicht.

**Bestanden**: `index.html` — `factuurBtwOverzicht`, `facBtwPeriode`, `facBtwRubriek`, `facBtwStelsel(Zet)`, `facBtwKiezer`, `facRenderBtw`, CSS `.fac-btw-*`

**Niet doen**: het totaal presenteren als "te betalen btw" zonder de waarschuwing over rubriek 5b. Het stelsel stil omzetten of laten afleiden uit de data — dat is een fiscale keuze, geen instelling die de app mag raden.

**Meegenomen**: het meervoud van "factuur" is "facturen", niet "factuuren". Stond op elf plekken fout.

## 2026-08-09 · Facturen mailen via Gmail — eigen token, pas bij het eerste verzoek

**Probleem**: een factuur ging als PDF naar de download-map en moest daarna met de hand in een mail. Dat is precies de stap waar een factuur blijft liggen.

**Beslissing**: knop "✉ Mailen" op elke definitieve factuur. Er opent een venster met ontvanger, cc, onderwerp en bericht — allemaal nog te wijzigen — en de PDF als bijlage. Versturen gaat via `POST /gmail/v1/users/me/messages/send` met een zelf opgebouwd MIME-bericht.

**Waarom**:
- *Gmail krijgt een eigen toegangstoken, los van Drive.* Wie de app alleen opent hoeft dan geen toestemming te geven om namens hem te mailen; die vraag komt pas bij de eerste verzending. Het scheelt ook dat een geweigerde mailtoestemming de opslag niet raakt. De prijs is een tweede `initTokenClient` — bewust, want de opslaglaag was net gemigreerd en die wilde ik niet aanraken.
- *`gemaildOp` wordt pas gezet als Gmail bevestigt.* Anders staat er "verstuurd" bij een mail die nooit is aangekomen. Bij een fout blijft het venster open met de ingevulde tekst, zodat je het opnieuw kunt proberen zonder alles over te typen.
- *Afzender is het ingelogde account, niet het bedrijfsadres.* Gmail weigert een `From` die geen alias van het account is. Staat er een afwijkend bedrijfsadres in de instellingen, dan gaat dat mee als `Reply-To`.
- *Bij een tussenpersoon gaat de mail naar de factuurpartij.* Die staat al in de momentopname `f.klant`, die bij het versturen van de factuur is vastgelegd.
- *Onderwerp en tekst zijn een sjabloon met plaatshouders* (`{nummer}`, `{bedrag}`, `{vervaldatum}`, `{iban}`, …), te bewaren via een vinkje. Zonder dat typ je elke maand hetzelfde.

**Nog te doen door Frank**: in de Cloud Console de scope `https://www.googleapis.com/auth/gmail.send` aan het OAuth-toestemmingsscherm toevoegen. Zonder dat volgt een 403 "insufficient authentication scopes" — de foutmelding in de app wijst daar zelf op.

**Bestanden**: `index.html` — `mailVraagToken`, `mailB64`/`mailKop`/`mailBreek`/`mailBouwBericht`/`mailRaw`, `mailApiVerstuur`, `facMailSjabloon`/`facMailVul`/`facMailOntvanger`, `facPdfBase64`, `openFacMail`/`facMailVerstuurActie`, modaal `#facMailModal`, CSS `.fac-mail-*`

**Niet doen**: automatisch mailen bij "Versturen". Het definitief maken van een factuur en het versturen van de mail zijn twee besluiten; ze samenvoegen betekent dat een verkeerd adres of een verkeerde bijlage niet meer te onderscheppen is. Ook niet: `gemaildOp` alvast zetten en bij een fout terugdraaien.

## Open werk na 2026-08-05

> **Afgerond op 2026-08-09**: btw-overzicht en Gmail-verzending (zie de entries hierboven), en het opruimen van de Gist-resten — punt 4 t/m 7 van de opslagmigratie. Weg zijn: het setup-scherm met de GitHub-token, `loadToken`/`sanitizeToken`/`saveToken`/`showTokenSettings`/`testGitHubToken`, `gistRequest`, `gistDiagnose`, de achtergrond-ververser die elke vijf minuten de Gist opvroeg, het conflictvenster, `verwerkDriveVersie` (de bronvergelijking uit fase 1), `driveKopieerVanuitGist` en `sanitizeNotesStateForGist`. Die laatste stripte grote afbeeldingen vanwege de 1 MB-grens van GitHub; Drive kent die grens niet. Er stond nog een aanroep op het verdwenen setup-scherm in de opstartcode — die zou bij elke start een fout hebben gegeven.
>
> De Gist zelf blijft staan als bevroren archief, zoals afgesproken. De functienamen `loadGist`/`saveGist`/`refreshGist` zijn bewust niet hernoemd: ze komen op tientallen plekken voor en hernoemen levert alleen risico op.
>
> De onderstaande beschrijvingen zijn de oorspronkelijke opzet; ze blijven staan omdat dit een append-only log is.

### Facturen mailen via Gmail *(gebouwd — hieronder staat de oorspronkelijke opzet)*
Voorwaarden liggen klaar: Workspace-account (dus OAuth-app op *Internal*, geen 7-dagen tokenlimiet), client-ID `815519330750-...`, en `facPdfDoc()` levert al een echt PDF-bestand.

Stappen:
1. Scope `https://www.googleapis.com/auth/gmail.send` toevoegen in Cloud Console én aan `driveVraagToken` (of een tweede tokenclient — scopes mogen gecombineerd).
2. MIME-bericht opbouwen: multipart/mixed, de PDF base64 als bijlage, afzender `app@herling-analytics.nl`.
3. `POST /gmail/v1/users/me/messages/send` met `raw` = base64url van het MIME-bericht.
4. Verzendknop op de factuur, met bevestigingsdialoog vooraf (ontvanger, bedrag, bijlage) — Frank koos direct versturen, maar een factuur die weg is kun je alleen nog crediteren.
5. Na verzenden: `f.verzondenOp` vastleggen en tonen in de factuurlijst.

Let op: het e-mailadres van de klant staat in `klant.email`; bij factureren via een tussenpersoon moet dat het adres van de **factuurpartij** zijn (`factuurPartijVan`).

### Btw-overzicht per kwartaal *(gebouwd — hieronder staat de oorspronkelijke opzet)*
Doel: vier keer per jaar de aangifte kunnen invullen zonder uit de Excel-export te puzzelen.

Aanpak: vijfde tab in de facturen-module ("Btw"), kwartaalkiezer (Q1–Q4 + jaar). Per kwartaal de verstuurde en betaalde facturen optellen, gegroepeerd per btw-tarief — `factuurTotalen()` levert de staffel al per factuur. Tonen: omzet excl. per tarief, af te dragen btw per tarief, totaal. Btw verlegd apart vermelden (telt niet mee in af te dragen).

Aandachtspunt: bepaal expliciet of je op factuurdatum of op betaaldatum aangifte doet. Nederland kent beide (factuurstelsel vs kasstelsel); voor een B.V. is het factuurstelsel de norm — dus `f.datum`, niet `f.betaaldOp`. Dit is een keuze die met Frank afgestemd moet worden voordat de cijfers ergens op gebaseerd worden.

## 2026-08-09 · Verversen viel terug op de lokale kopie — twee oorzaken

**Probleem**: na een pagina-verversing meldde de app "Drive onbereikbaar — lokale kopie geladen" en stond er een lege administratie op het scherm. Klikken op ↻ (opnieuw laden) werkte wél.

**Oorzaak 1 — het toestemmingsvenster werd geblokkeerd.** Google vernieuwt het Drive-toegangstoken via een popup. Bij het laden van de pagina gaat daar geen klik aan vooraf, dus de browser blokkeert hem; bij een klik op ↻ wel, en dan lukt het. Precies het verschil dat je zag.

**Oorzaak 2 — de terugval laadde niets.** In `loadGist` stond `if(loadLocalBackup()){ hydrateerState(); … }`. De kopie werd opgehaald en op waarheid getest, maar nooit aan `rawState` toegekend, waarna `hydrateerState()` de ongewijzigde (lege) `rawState` opbouwde. Vandaar het lege scherm. Dit zat er sinds fase 2 in en gold voor beide terugvalpaden.

**Beslissing**:
1. Het toegangstoken wordt bewaard in `sessionStorage` (`herling_drive_token`), met het account erbij. Een verversing hergebruikt het en heeft dus geen venster nodig. Niet in `localStorage`: zo verdwijnt het als het tabblad dichtgaat. Het token is een uur geldig en geeft alleen toegang tot de verborgen app-map. Bij een 401 en bij uitloggen wordt het gewist, en een token van een ander account wordt genegeerd.
2. `driveProbeerLaden` slikt de fout niet meer in. "Er staat nog niets in Drive" en "ik kon Drive niet bereiken" zijn verschillende situaties en werden hiervoor allebei als het eerste behandeld.
3. `rawState` wordt nu wél toegekend in beide terugvalpaden.
4. **Zolang Drive deze sessie niet is gelezen, schrijft de app er niets naartoe** (`driveGelezen`). Anders kan een terugval-versie — of erger, een lege — de goede administratie in Drive overschrijven. Lokaal bewaren gaat door, dus er gaat niets verloren.
5. De melding zegt wat er aan de hand is en wat je moet doen ("klik op ↻"), in plaats van "Drive onbereikbaar", wat je de verkeerde kant op stuurt.

**Waarom punt 4 los van punt 1**: het venster kan om meer redenen mislukken dan alleen een verversing — verlopen sessie, geweigerde toestemming, geen netwerk. De opslag moet in al die gevallen veilig zijn, niet alleen in het geval dat nu is opgelost.

**Bestanden**: `index.html` — `driveTokenUitSessie`/`driveTokenBewaar`/`driveTokenVergeet`, `driveVraagToken`, `driveApi`, `driveProbeerLaden`, `loadGist`, `saveGist`, `logUit`

**Niet doen**: het token in `localStorage` zetten om ook nieuwe tabbladen te dekken — dan blijft een geldige sleutel op schijf staan nadat je de app hebt gesloten. En: de schrijfblokkade weghalen omdat "het nu toch werkt".

## 2026-08-09 · Mailvenster achter de editor, en de standaardtekst

**Probleem**: het mailvenster opende ónder de factuureditor waar je het vandaan klikte. Het leek alsof de knop niets deed. Verder sloot de standaardtekst niet aan bij hoe Frank zijn facturen verstuurt.

**Beslissing**:
1. `#facMailModal` krijgt `z-index:260`. Alle `.modal-bg`'s delen 200, dus zonder dat beslist de volgorde in de HTML wie bovenop ligt. Dit geldt voor elk venster dat vanuit een ander venster opent — kom je er nog een tegen, geef die dezelfde behandeling.
2. Nieuwe standaardtekst: datum, aanhef, "Hierbij de factuur met factuurnummer {nummer}: {betreft}", verwijzing naar de bijlage, ondertekening met `{afzender}` (de naam uit het Google-account) en `{bedrijf}`.
3. **`facMailSjabloon()` schrijft niets meer in de instellingen.** Hij zette de standaard bij het openen van het venster in `settings.mail`, waarna die bij de eerstvolgende opslag werd vastgelegd — je zat dus aan een standaard vast die je nooit gekozen had, en een betere standaard in de code bereikte je niet meer. Nu telt alleen wat je met het vinkje bewaart. Een opgeslagen exemplaar van de oude standaardtekst wordt herkend en opgeruimd.
4. `driveVraagToken`/`mailVraagToken` wachten tot 8 seconden op de Google-bibliotheek in plaats van meteen op te geven. Die staat met `async defer` in de pagina en kan bij een verversing later klaar zijn dan `boot()` — dat kwam op het scherm aan als "Drive onbereikbaar", terwijl er alleen nog niets geladen was. Dit is een derde oorzaak van hetzelfde klachtbeeld, naast de twee van vandaag.

**Bestanden**: `index.html` — CSS `#facMailModal`, `FAC_MAIL_STANDAARD`, `FAC_MAIL_STANDAARD_OUD`, `facMailSjabloon`, `facMailSjabloonBewaar`, `facMailVul`, `googleGereed`, `driveVraagToken`, `mailVraagToken`

**Niet doen**: standaardwaarden in de instellingen schrijven op het moment dat je ze leest. Dan is niet meer te zien of iets een keuze was of een bijwerking.

## 2026-08-09 · Verzonden berichten als logboek, en de mailtekst instelbaar

**Probleem**: er was geen overzicht van wat er gemaild was, en de standaardtekst was alleen aan te passen op het moment dat je een factuur verstuurde — precies het moment waarop je daar geen zin in hebt.

**Beslissing**:
1. Tab "Verzonden" in de facturenmodule, met een **logboek** `factuurState.mails[]` — `{id, factuurId, nummer, datum, aan, cc, onderwerp}` — en niet een veld op de factuur. Een factuur kan meer dan eens de deur uit gaan: een correctie, een herinnering. `f.gemaildOp` blijft bestaan als "laatst gemaild"-markering voor de knop in de editor.
2. Facturen die al gemaild waren voordat het logboek bestond krijgen bij het laden alsnog een regel, gemarkeerd met een `*` en een uitleg eronder. Datum en ontvanger komen uit de factuur; het onderwerp is achteraf samengesteld en dat staat er ook. Zonder die aanvulling begint het overzicht met een gat dat eruitziet als "nooit verstuurd".
3. Venster "Standaardtekst mail" in het facturen-menu, naast Factuursjabloon. Met klikbare plaatshouders die op de cursorpositie invoegen, en een voorbeeld dat meeloopt op je **meest recente echte factuur** — dan zie je meteen of `{betreft}` leest zoals je wilt. Is er nog geen factuur, dan een verzonnen exemplaar, en dat staat erbij.
4. "Terug naar standaard" vult alleen de velden; opslaan blijft een aparte handeling.

**Bestanden**: `index.html` — `facMailsVanJaar`, `factuurMailsAanvullen`, `facRenderMails`, `FAC_MAIL_PLAATSHOUDERS`, `facMailVoorbeeldFactuur`, `openFacMailInstel`/`facMailInstelPlaatshouder`/`facMailInstelVoorbeeld`/`facMailInstelOpslaan`/`facMailInstelStandaard`, modaal `#facMailInstelModal`, CSS `.fac-mail-plh*`, `.fac-mail-voorbeeld`, `.fac-mail-aan`

**Niet doen**: het logboek afleiden uit `f.gemaildOp` in plaats van het bij te houden — dan verdwijnt elke eerdere verzending zodra je opnieuw mailt. En: de afgeleide regels tonen alsof ze volwaardig zijn; het onderwerp daarvan is een gok.

## 2026-08-09 · Verstuurde factuur heette nog "Concept"

**Probleem**: de kop van de factuureditor zei "Concept F000001 — nummer wordt definitief bij versturen" terwijl de statuspil ernaast "Verstuurd" toonde.

**Oorzaak**: de kop keek naar `bewerkbaar`. Toen besloten werd dat een verstuurde factuur bewerkbaar blijft, werd die variabele een constante `true` — en de kop bleef eraan hangen. Een vlag die van betekenis verandert neemt zijn gebruikers mee; hier bleef er één achter.

**Beslissing**: de kop kijkt naar `definitief` (`status !== 'concept'`). De ondertitel toont voor een verstuurde factuur de verzenddatum, en als hij gemaild is ook die datum.

**Bestanden**: `index.html` — `facEditorRender`

## 2026-08-10 · Urenspecificatie kon stilzwijgend wegblijven

**Probleem**: het vinkje "Urenspecificatie als bijlage meesturen" leek bij het mailen niets te doen.

**Onderzoek**: het mailpad zelf is in orde. Een factuur met gekoppelde uren levert een PDF van twee pagina's, en die bijlage overleeft het MIME-bericht byte voor byte — teruggedecodeerd zoals Gmail dat doet zitten er twee pagina-objecten in en staat het woord "Urenspecificatie" erin. Wat wél misgaat: `facPdfSpecificatie` stopt zonder een woord als de gekoppelde urenregistraties niet meer in `urenState.entries` staan. Een factuur bewaart alleen ids. De teller onder de factuurregel telde die **ids** en zei dus "3 urenregistraties gekoppeld" terwijl er niets meer achter zat.

**Beslissing**: `factuurSpecificatieStaat(f)` geeft één antwoord — `uit`, `geen-uren`, `ontbreekt` of `ok` — en dat antwoord is nu op drie plekken zichtbaar:
- onder het vinkje in de editor ("3 registraties op een extra pagina achter de factuur", of waaróm er niets meegaat);
- in het mailvenster als eigen regel bij de bijlage, met een getinte waarschuwing als er niets meegaat — dat is het laatste moment waarop je het nog kunt herstellen;
- als toast bij het downloaden van de PDF.

De teller onder de regel telt nu de registraties die er echt nog zijn, met "· n niet meer te vinden" erachter.

**Waarom niet automatisch herstellen**: welke urenregels bij een verstuurde factuur hoorden is niet af te leiden zodra de registraties weg zijn. Gokken op klant en periode zou een specificatie opleveren die niet klopt met het bedrag. Zeggen dat het niet lukt is hier beter dan iets verzinnen.

**Bestanden**: `index.html` — `factuurSpecificatieUren`, `factuurSpecificatieStaat`, `facSpecUitleg`, `facMailSpecRegel`, `facPdfSpecificatie`, `facPdfDownload`, `facEditorRender`

**Niet doen**: een tekenfunctie zelf laten waarschuwen. `facPdfSpecificatie` geeft alleen niets terug; de melding hoort bij wie de PDF opvraagt.

## 2026-08-10 · Uren die op één apparaat bleven staan

**Probleem**: uren die op de ene pc waren geschreven, waren op de andere niet te zien.

**Oorzaken** — drie gaten in de opslagketen, die elkaar versterkten:
1. **De 1,5 seconde bedenktijd.** Een wijziging ging meteen naar `localStorage` en pas na 1500 ms naar Drive. Sloot je het tabblad daarvóór, dan stond het werk alleen op dat apparaat. `beforeunload` en `visibilitychange` schreven alleen de lokale kopie weg, nooit naar Drive.
2. **Een mislukte schrijfactie bleef liggen.** Er was geen herkansing; de melding had een knop, maar als je die niet aanklikte gebeurde er niets tot je toevallig weer iets wijzigde.
3. **Bij de volgende start won Drive altijd.** `loadGist` verving de state door wat er in Drive stond. Werk dat Drive nooit had gekregen verdween daarmee zonder een woord — juist het werk uit punt 1 en 2.

**Beslissing**:
- Twee tijdstempels in `localStorage` (`herling_analytics_sync`): wanneer er lokaal iets veranderde, en tot wanneer Drive bij is. Het tweede is het moment waarop de payload werd samengesteld, niet het moment van bevestigen — wat je tijdens een lopende schrijfactie wijzigt telt dus nog als ongesynct.
- Bij het laden: staat er lokaal werk dat Drive nooit heeft gekregen én is dat nieuwer dan de versie in Drive, dan volgt een expliciete vraag met beide tijdstippen. Kies je lokaal, dan wordt het meteen alsnog weggeschreven.
- Mislukte schrijfacties proberen zichzelf opnieuw: 5 s, 15 s, 60 s, 3 min. Een nieuwe wijziging vervangt de wachtende herkansing.
- Bij het verbergen van het tabblad wordt niet meer op de bedenktijd gewacht maar meteen geschreven.

**Waarom een `confirm()` en geen automatische keuze**: welke van twee versies de juiste is, weet de app niet. Samenvoegen kan niet zonder te raden welke urenregel bij welke sessie hoorde. De vraag komt alleen in het geval dat er echt iets te verliezen valt, en dat hoort zeldzaam te zijn.

**Bekende grens**: staat er lokaal ongesynct werk terwijl Drive intussen *nieuwer* is (een andere pc schreef later), dan wint Drive zonder vraag. Samenvoegen zou hier nodig zijn en dat kan deze app niet.

**Bestanden**: `index.html` — `syncStand`/`syncMarkeerLokaal`/`syncMarkeerDrive`/`syncOngesynct`, `loadLocalBackupMeta`, `saveLocalBackup`, `loadGist`, `saveGist`, `scheduleSave`, de `visibilitychange`-handler

**Niet doen**: de vraag bij het laden vervangen door "lokaal wint altijd" — dan overschrijft een oud tabblad het werk van je andere pc.

## 2026-08-10 · Klant erft de gegevens van zijn factuurpartij

**Probleem**: klanten die via een tussenpersoon gefactureerd worden (POM, Staedion, Gemeente Buren → LabsData) stonden met "⚠ Adresgegevens ontbreken" in het overzicht. Die gegevens hoeven daar ook niet te staan — de rekening gaat naar de tussenpersoon — maar de app deed alsof er iets miste.

**Beslissing**: `factuurKlantVol(klant)` vult lege velden aan met die van de factuurpartij: adres, postcode, plaats, land, btw-nummer, kvk, e-mail, contactpersoon, telefoon, betaaltermijn, uurtarief en btw-tarief. **De naam niet** — die blijft staan waaronder jij de klant kent, ook op de factuurregel. Alleen lege velden erven; een eigen tarief of adres bij de klant wint altijd.

Gebruikt in `factuurKlantCompleet`, `factuurKlantSnapshot` (dus ook op de factuur en in de PDF), bij het opstellen van factuurregels (uurtarief) en bij `factuurNieuw` (betaaltermijn, bedrijf). Op de klantkaart staat het geërfde adres met "van LabsData B.V." eronder, zodat zichtbaar blijft dat het niet van de klant zelf komt.

**Waarom niet kopiëren bij het opslaan van de klant**: dan is de koppeling weg en loopt de klant achter zodra de tussenpersoon verhuist. Erven bij het lezen houdt één plek de waarheid.

**Bestanden**: `index.html` — `KLANT_ERFT`, `factuurKlantVol`, `factuurKlantCompleet`, `factuurKlantSnapshot`, `factuurRegelsVanUren`, `factuurNieuw`, `facRenderKlanten`, CSS `.fac-geerfd`

## Open werk na 2026-08-10

### Kilometervergoeding (nog te bouwen)
Frank rijdt voor sommige klanten en wil die kilometers kunnen doorbelasten, in dezelfde stroom als de uren.

**Ontwerp — km worden géén urenregels.** Verleidelijk is een veld `soort:'uur'|'km'` op de bestaande registratie, maar dan moet elke optelling in de app leren dat sommige regels geen uren zijn: de KPI-strip, Per klant, Per week, Per maand, de Excel-export, de factuurregels en de urenspecificatie in de PDF. Eén gemiste plek en er staan kilometers bij de uren opgeteld. Daarom een eigen lijst:

```js
urenState.kilometers = [{id, date, clientId, km, description, status:'open'|'concept'|'invoiced', factuurId, createdAt, updatedAt}]
```

Bestaande optellingen raken die lijst niet aan, dus ze kunnen ook niet stilletjes fout gaan.

**Tarief**: `klant.kmTarief`, met `settings.kmTarief` als standaard (2026: € 0,23 belastingvrij). Erft van de factuurpartij via `KLANT_ERFT` — zet `kmTarief` in die lijst.

**Invoer**: eigen tab "Kilometers" naast Registraties in de urenmodule, met dezelfde tabelopzet (datum, klant, aantal km, omschrijving) en dezelfde draft-regel-afhandeling — inclusief `urenEnsurePeriodContains` en committen op focusout/Enter, want daar zijn de valkuilen al bekend.

**Facturatie**: `factuurRegelsVanUren` krijgt een tegenhanger die per klant de niet-gefactureerde km in de periode optelt tot één regel: `omschrijving:'Kilometervergoeding', aantal:<km>, eenheid:'km', stuksprijs:<kmTarief>`. Koppelen via een tweede veld op de factuurregel (`kmIds`) naast `urenIds`, zodat `factuurUrenKoppelen`/`factuurSyncUren`/`factuurSpecificatieUren` gescheiden blijven. Let op de bestaande valkuil: `factuurSpecificatieStaat` moet ook voor km kunnen zeggen dat er niets meegaat.

**Btw**: hetzelfde tarief als de uren van die klant — een doorbelaste kilometer is onderdeel van de dienst, niet een aparte post met eigen tarief.

**Waarom niet in deze sessie gebouwd**: de contextruimte was op. Half af zou hier betekenen dat kilometers ergens als uren meetellen, en dat is in een administratie erger dan de functie missen.

## 2026-08-10 · Kilometervergoeding als factuurregel (vervangt het ontwerp hierboven)

**Wijziging op de vorige entry.** Daar stond een eigen registratielijst `urenState.kilometers` met een tab in de urenmodule. Frank koos voor iets kleiners: *"Je mag het ook beschikbaar maken als losse regel die we kunnen toevoegen bij het bouwen van de factuur."* Dat is gebouwd; de aparte registratiemodule niet.

**Beslissing**: knop **+ Kilometers** in de factuureditor, naast "Uren ophalen" en "+ Regel". Die zet een regel neer met omschrijving "Kilometervergoeding", eenheid `km`, aantal 0 en het juiste tarief; het aantal vul je zelf in.

Het tarief komt in deze volgorde: `klant.kilometerTarief` → het tarief van de factuurpartij (via `KLANT_ERFT`, dus dezelfde erving als adres en uurtarief) → `settings.kilometerTarief`, standaard € 0,23 (onbelast in 2026). Leeg laten bij een klant betekent "gebruik de standaard" — daarom wordt het veld als `null` bewaard en niet als 0.

Het btw-tarief van de regel volgt dat van de klant, niet een eigen tarief: een doorbelaste kilometer is onderdeel van de dienst.

**Waarom dit veiliger is dan het vorige ontwerp**: kilometers raken de urenregistratie niet aan. Er is geen enkele optelling in de app die hoeft te leren dat sommige regels geen uren zijn — de zorg die het vorige ontwerp met een aparte lijst probeerde te ondervangen, bestaat hier niet.

**Wat je hiermee niet hebt**: kilometers per dag bijhouden zoals je uren bijhoudt. Je vult per factuur één totaal in. Wil je dat later wel, dan is de vorige entry nog steeds het ontwerp om op verder te bouwen.

**Bestanden**: `index.html` — `factuurKmTarief`, `facKmToevoegen`, `KLANT_ERFT`, `factuurSettings` (`kilometerTarief`), klantvenster (`kmKmTarief`), facturatie-instellingen (`fiKmTarief`)

## 2026-08-10 · Bedragen weg van het dashboard, en Uren/Facturen onder Administratie

**Probleem**: Frank opent deze app op zijn laptop terwijl hij bij klanten zit. Het dashboard was het eerste scherm na inloggen en toonde daar een KPI-tegel "Openstaand" met het totaalbedrag plus een kaart "Openstaande facturen" met nummers, klantnamen en bedragen. Wie meekijkt ziet meteen wat hij nog te vorderen heeft, en bij welke andere klant.

**Beslissing**: beide weg van het dashboard. De KPI-strip gaat van vier naar drie tegels (open taken, vervallende taken, afspraken vandaag) — allemaal getallen zonder geldwaarde. De inhoud verdwijnt niet: de facturenmodule heeft onder **Debiteuren** al hetzelfde en meer (ouderdomsklassen, per klant, per factuur). Die module open je bewust.

**Waarom niet verbergen achter een knop of de pincode**: dan staat het er nog steeds en is één misklik genoeg. Een dashboard is per definitie wat je laat zien zodra je inlogt; financiële cijfers horen daar niet thuis. De pincode beschermt de opslag, niet de blik over je schouder.

**Wat er nog wel staat**: de nav-badges. Naast Uren staat het aantal nog niet gefactureerde uren ("5u"), naast Facturen het aantal facturen dat over de vervaldatum is ("2"). Geen bedragen, wel een signaal. Bewust laten staan, maar het is een keuze om te herzien als dat te veel zegt.

**Daarnaast**: Uren en Facturen staan niet meer onder "Navigatie" maar onder een eigen kop **Administratie**, samen met Externe tools. Dat scheelt een sectie in de zijbalk en zet de administratieve modules bij elkaar.

**Bestanden**: `index.html` — `#dashKpiOpenstaand` en `#dashFacturenCard` verwijderd, `dashFacturenStats`/`renderDashFacturen` verwijderd, `.dash-kpis` naar 3 kolommen, zijbalk-secties in `.sidebar-scroll`

**Niet doen**: de facturenkaart terugzetten op het dashboard "omdat hij handig is". Handig was hij ook.

## 2026-08-11 · Factuur verwijderen deed niets zichtbaars (en de validator kon dat niet zien)

**Probleem**: een factuur verwijderen leek niet te werken. De factuur bleef in de lijst staan, er kwam geen toast, en pas na een herlaad (plus "annuleren" in de editor) was hij echt weg. De verwijdering zélf werkte wel — die stond al in Drive.

**Oorzaak**: `factuurVerwijder()` riep `factuurRenderAll()` aan. Die functie bestaat niet; de facturenmodule heet `facRenderAll()`. De aanroep gooide een `ReferenceError` en dát is het echte probleem: de functie stopte daar. Alles ná die regel liep niet meer — geen hertekening, en ook de `appToast()` met "Ongedaan maken" niet. Dezelfde typefout stond in de undo-callback, dus terugdraaien was net zo stil kapot. De fout was alleen in de console te zien.

Waarom het "half" leek te werken: `scheduleSave()` stond er nog vóór, dus de state klopte al. Alleen het scherm liep achter — vandaar dat een herlaad het "oploste".

**Beslissing**: beide aanroepen omgezet naar `facRenderAll()`.

**De tweede helft: `validate.mjs` controleerde dit niet.** Die keek alleen of functies in `onclick=""`-handlers bestonden. Een typefout in gewone JS kwam er ongehinderd doorheen — precies het geval hier. De validator kijkt nu naar álle aanroepen in de inline scripts en faalt (blokkerend, niet als waarschuwing) op een naam die nergens gebonden is.

Om dat zonder vals alarm te doen worden strings en commentaar eerst weggehaald, maar **wél** de code binnen `${...}` in template literals — daar staan echte aanroepen in. Nesting telt: een string ín een interpolatie wordt weer gestript, anders leest de checker `rgba(` uit een inline `style=""` als functieaanroep. Bindingen worden ruim verzameld (parameters, destructuring, `let a,b,c`, object-methodes, arrow-parameters): een gemiste binding is vals alarm, en vals alarm in een pre-push hook leert je de hook negeren.

**Waarom blokkerend en geen waarschuwing**: de bestaande onclick-check is een waarschuwing, en waarschuwingen scroll je voorbij. Deze fout is stil in productie en kost een herlaad om te ontdekken — die hoort de push tegen te houden.

**Ook nagelopen**: alle 785 top-level functies langs de vraag "muteert state, maar tekent niets bij". De 26 treffers bleken allemaal terecht — lage helpers waarvan de aanroeper wél hertekent (`factuurNieuw` ← `facWizardMaak`), of gerichte DOM-updates (`refreshTagCell`), of een module-wissel die zelf rendert (`urenInvoiceClient`). `factuurRenderAll` was de enige echte. Verder was er geen ongedefinieerde aanroep in het hele bestand.

**Bestanden**: `index.html` — `factuurVerwijder()`; `validate.mjs` — `stripLiterals()` + bindingen-check

**Niet doen**: de nieuwe check terugzetten naar een waarschuwing als hij ooit vals alarm geeft. Vul dan de bindingen-verzameling of `BROWSER_GLOBALS` aan — de check is alleen iets waard zolang hij tegenhoudt.

## 2026-08-12 · Drive-sync: naadloos maken zonder verlies

**Probleem**: Frank kreeg regelmatig "niet verbonden met Drive — klik op ↻", zag soms de vraag of hij de lokale of de cloud-versie wilde, en raakte bij "lokaal" wijzigingen kwijt. De data werd wél steeds weggeschreven — lokaal. Vijf losse oorzaken die elkaar versterkten.

**1. Een leeg versleuteld blok kon Drive overschrijven.** Dit was het echte dataverlies. Met een pincode komen facturen, uren en de gevoelige klantvelden versleuteld uit Drive; tussen laden en ontsleutelen zijn `factuurState` en `urenState` leeg, terwijl `pinSleutel` uit een eerdere sessie nog gevuld kan zijn. Viel er een save in dat gat, dan versleutelde `pinPakGeheimen()` die lege state en schreef die over de administratie heen. `refreshGist()` wiste bovendien wel `saveTimer` maar niet `saveRetryTimer` — dus de melding "klik op ↻" stuurde je regelrecht dat gat in: herkansing ingepland, jij ververst, herkansing vuurt over verse gegevens.

*Beslissing*: één vlag `geheimenGeladen`, en `geheimenKlaar()` als enige poort. Staat die uit, dan schrijft `saveGist` niet naar Drive en laat `saveLocalBackup` de geheime delen van de vorige kopie staan in plaats van ze met leeg te overschrijven (`houdGeheimeDelenUitVorige`). Plus `refreshGist` wist nu ook de herkansing. De regel erachter: *nooit een onvolledige state wegschrijven alsof het de hele waarheid is.*

**2. Het token verliep na een uur en werd pas op het laatste moment vernieuwd.** Een save die 1,5 seconde ná je laatste toetsaanslag vuurt heeft geen klik-context, en zonder klik blokkeert de browser het venster waarmee Google stil vernieuwt. Een schrijfactie doet bovendien twee API-calls die bij een verlopen token allebei tegelijk een token aanvroegen.

*Beslissing*: één gedeelde promise per lopende aanvraag (`driveTokenBezig`), en vernieuwen op ~50 minuten terwijl het tabblad zichtbaar is — ruim vóór het nodig is, zodat een mislukking nog tien minuten speling heeft. Terugkomen op een lang weggeweest tabblad haalt meteen een vers token.

**3. Eén hapering zette alle schrijfacties stil.** `loadGist` zette bij elke fout `driveGelezen=false`, en `saveGist` weigert dan te schrijven. Dat is terecht zolang Drive nog nóóit gelezen is — je zou goede data met een terugval kunnen overschrijven — maar niet daarna: is de state eenmaal van Drive afkomstig, dan is wegschrijven veilig. Die reset is weg.

**4. De conflictvraag vergeleek twee verschillende klokken.** `lokaal.savedAt` (`Date.now()` van de laptop) tegen `d.tijd` (`modifiedTime` van Google). Loopt je klok voor, dan is "lokaal is nieuwer" structureel waar en krijg je de vraag bij elke start.

*Beslissing*: bij elke geslaagde schrijfactie onthouden wélke `modifiedTime` Drive teruggaf, en bij het laden alleen kijken of die string nog gelijk is. Staat Drive stil sinds ónze laatste schrijfactie, dan is er geen conflict — dan wint lokaal stilletjes, zonder vraag. Alleen als een ander apparaat schreef komt de vraag nog.

**5. De vraag zelf was onomkeerbaar.** Beide antwoorden gooiden een kant weg. Nu gaat de niet-gekozen versie eerst naar een herstelkopie in localStorage, met `herstelDownload()` in de console om hem als bestand op te halen.

**Daarnaast: twee saves konden elkaar inhalen.** Er was geen in-flight guard, dus een oudere payload kon als laatste aankomen terwijl beide "opgeslagen" meldden. Nu loopt er hooguit één; een verzoek dat ondertussen binnenkomt wordt na afloop één keer ingehaald (samenvoegen, geen wachtrij).

**Ook: de lokale kopie is niet langer leesbaar.** Met een pincode aan stonden facturen en uren onversleuteld in localStorage. De kopie wordt nu net zo gestript als die in Drive, met hetzelfde versleutelde blok ernaast — `saveGist` maakt dat toch al, dus geen extra rekenwerk in het directe pad. Bijgewerkt zodra de ciphertext klaar is en niet pas ná een geslaagde Drive-save, anders zou juist het vangnet voor "Drive onbereikbaar" achterlopen. **Eerlijk over de grens**: onthoudt dit apparaat je pincode, dan staat de sleutel in dezelfde localStorage. Dit helpt pas echt als je "onthoud dit apparaat" uit laat.

**Waarom geen per-module timestamps en echte merge**: dat is de structurele oplossing voor twee apparaten die tegelijk schrijven. Frank werkt nooit gelijktijdig, dus dat koopt veel complexiteit voor een probleem dat er niet is. Deze zes ingrepen maken het bestaande model (heel bestand, last-write-wins) betrouwbaar in plaats van het te vervangen.

**Bestanden**: `index.html` — `geheimenGeladen`/`geheimenKlaar`/`houdGeheimeDelenUitVorige`, `saveGist`+`saveGistIntern`, `saveLocalBackup(markeer)`, `syncMarkeerDrive(stempel,driveTijd)`, `syncOnthoudDriveTijd`, `bewaarHerstelkopie`/`herstelDownload`, `driveNieuwToken`/`driveVraagToken`/`drivePlanTokenVerversing`, `refreshGist`, `loadGist`

**Niet doen**: `driveGelezen=false` terugzetten in de catch van `loadGist` "voor de zekerheid" — dat was precies wat Drive uren liet achterlopen terwijl de app "opgeslagen" bleef zeggen. En de poort `geheimenKlaar()` niet omzeilen om "toch even" te kunnen opslaan terwijl er nog ontsleuteld wordt.

## 2026-08-12 · Verversen haalt altijd uit de cloud, lokaal blijft een knop

**Wijziging op de entry hierboven, dezelfde dag.** Daar loste ik de conflictvraag op door hem zeldzamer te maken. Frank kreeg hem alsnog, en het punt was niet de frequentie: *"Ik wil in principe altijd dat die de informatie uit de cloud haalt als ik de data ververs. Ik vind het op deze manier niet prettig werken wanneer ik de pagina ververs."*

Terecht. Een `confirm()` bij het laden houdt de app tegen voordat je iets ziet, en dwingt je een beslissing te nemen op het moment dat je alleen maar wilde verversen. Dat is de verkeerde volgorde: eerst laden, dan pas eventueel iets vragen.

**Beslissing**: Drive is bij het laden altijd de bron. Geen vraag vooraf, ook niet als er lokaal onverzonden werk staat. Dat werk gaat naar de herstelkopie en er verschijnt een melding met een knop **"↺ Werk van dit apparaat gebruiken"** die het alsnog terugzet — en die stap bewaart op zijn beurt de Drive-versie, dus ook dat is terug te draaien. De keuze blijft dus bestaan, alleen niet meer als blokkade.

Daarmee verviel ook de bevestigingsvraag in `refreshGist` ("wijzigingen gaan verloren, doorgaan?"). Er gaat niets meer verloren, dus valt er niets te bevestigen. De ↻-knop is nu meteen raak.

**Wat hiermee verandert ten opzichte van vanochtend**: de regel "Drive staat stil sinds onze schrijfactie, dus lokaal wint stilletjes" is weg. Werd een save onderbroken, dan krijg je nu de Drive-versie te zien met een knop ernaast, in plaats van dat je werk automatisch terugkomt. Eén klik meer, in ruil voor één voorspelbare regel in plaats van twee gevallen die je uit elkaar moet houden. Bewuste ruil, op verzoek.

**Twee fouten die hierbij aan het licht kwamen:**

De tekst zei "In Drive staat een nieuwere versie", maar de voorwaarde was *"Drive is veranderd sinds onze laatste schrijfactie"* — en dat is iets anders dan nieuwer. In Franks geval was de Drive-versie van 15:03 en het lokale werk van 15:08, dus de melding noemde de oudere versie "nieuwer". De nieuwe melding noemt beide tijdstippen en zegt het expliciet als het lokale werk nieuwer is.

En de herstelkopie zette met een pincode aan alles leesbaar op schijf: in het geheugen zijn de geheimen ontsleuteld, dus een kale kopie lekte precies wat de versleuteling moest beschermen. `bewaarHerstelkopie` stript nu zelf, maar alleen als er een versleuteld blok is om te bewaren — anders zou je de data weggooien zonder iets om hem mee terug te halen.

**Bestanden**: `index.html` — `loadGist` (conflicttak vervangen door herstelkopie + melding), `meldLokaalTerugzetbaar`, `herstelLokaalTerug`, `bewaarHerstelkopie`, `refreshGist`, `appToast` (`actieLabel`)

**Niet doen**: de blokkerende vraag terugzetten "omdat de gebruiker het dan zeker weet". Dat was precies de klacht. Wil je iets veiliger maken, maak dan de terugzet-knop beter vindbaar — niet het laden trager.

## 2026-08-12 · Facturatie klaarmaken voor echte klanten: datums en nummerreeks

**Aanleiding**: Frank gaat de facturatiemodule daadwerkelijk gebruiken om facturen naar klanten te sturen. Een doorloop van de uren- en facturatiemodule met die bril op leverde twee fouten op die élke verstuurde factuur zouden raken, plus twee die pas bij bepaalde instellingen opspelen.

**1. De vervaldatum stond structureel één dag te vroeg op de factuur.** `factuurVervaldatum` maakte `new Date(datum+'T00:00:00')` — lokale middernacht — en las dat terug met `toISOString().slice(0,10)`. In Nederland is lokale middernacht 22:00 of 23:00 UTC de dág ervoor, dus er ging overal een dag vanaf. `2026-08-12 + 30` gaf `2026-09-10` in plaats van `2026-09-11`.

Het werkte door in de mailtekst (`{vervaldatum}`), in `factuurDagenTeLaat` en in het debiteurenoverzicht. Dezelfde omweg zat op nog acht plekken in de facturen- en urenmodule, waaronder `facNieuwStart`: daar werd de eerste van de maand de laatste dag van de vórige maand, zodat de wizard een dag te veel uren ophaalde.

*Beslissing*: overal `dateStr()` gebruiken — die stond er al voor de agenda en leest de lokale kalenderdag zonder omweg via UTC. Een factuurdatum is een kalenderdag, geen tijdstip; die hoort niet door een tijdzone te reizen.

**2. Een prefix met cijfers vernielde de nummerreeks.** Het volgnummer werd uit een bestaand factuurnummer gehaald met `replace(/\D/g,'')`, wat álle niet-cijfers strípt — dus de prefix telde mee. Met prefix `2026-` werd na `2026-000001` het volgende nummer `2026-2026000002`.

Met de standaardprefix `F` valt dat niet op, waardoor je het pas merkt als je hem aanpast — en een jaartal in het factuurnummer is nou juist het meest voor de hand liggende dat je instelt. Op een document met een wettelijk doorlopende reeks is dat geen schoonheidsfoutje.

*Beslissing*: `factuurVolgnummerUit(nummer,prefix)` haalt eerst de prefix eraf en pakt dan alleen de aaneengesloten cijfers aan het eind. Staat er een oud nummer met een andere prefix tussen, dan valt het terug op diezelfde staart en blijft de uitkomst bruikbaar.

**3. De jaarreeks keek naar het jaar van vandaag, niet naar de factuurdatum.** Met "per jaar opnieuw nummeren" aan belandde een factuur die je op 2 januari maakt maar op 31 december dateert, in de verkeerde reeks. `factuurVolgendNummer` krijgt nu de factuurdatum mee; alle aanroepen die bij een echte factuur horen geven hem door. De voorbeelden in het instellingenscherm niet — die tonen bewust wat er *vandaag* uit zou komen.

**4. Bij verlegde btw werd het btw-nummer van de klant niet gegarandeerd afgedrukt.** Dat hing af van het vinkje "btw" in de sjabloonbouwer. Bij verlegging is het btw-nummer van de afnemer wettelijk verplicht; stond het vinkje uit, dan ging er een onvolledige factuur de deur uit zonder dat iets het zei. Nu wordt het afgedwongen zodra `f.btwVerlegd` aanstaat, ongeacht het sjabloon.

**Bestanden**: `index.html` — `factuurVandaag`, `factuurVervaldatum`, `factuurDagenTeLaat`, `factuurVolgnummerUit`, `factuurVolgendNummer` (+ vier aanroepen), `facNieuwStart`, `facPdfBlokAdres`

**Wat hiermee nog níet is opgelost** (besproken, bewust uitgesteld): er is geen creditfactuur, terwijl de verwijderdialoog zelf zegt dat crediteren juister is; een verstuurde factuur blijft volledig bewerkbaar; uren die op een verstuurde factuur staan kun je zonder waarschuwing verwijderen, waarna de specificatie niet meer klopt met wat de klant kreeg; en er zijn geen betalingsherinneringen. Van die vier is de creditfactuur de belangrijkste zodra er echt facturen de deur uit gaan.

**Niet doen**: `toISOString().slice(0,10)` opnieuw gebruiken voor een kalenderdatum. Voor tijdstippen is het prima, voor datums schuift het een dag.

## 2026-08-14 · Trek omlaag om te verversen op mobiel

**Probleem**: Frank gebruikt de app op de iPhone als bladwijzer-app (vanaf het beginscherm, `display: standalone`). Daar is geen adresbalk en dus geen verversknop, en het ververs-gebaar dat je in Safari kent werkt niet. Dat laatste is geen instelling die aan of uit kan staan: iOS toont dat gebaar alleen als de *pagina zelf* aan de bovenkant doorschiet. Hier staat `body` op `overflow:hidden` en scrolt `.module` — iOS ziet aan de bovenkant van het venster nooit een overscroll en heeft dus niets om op te reageren. Gevolg: na een nieuwe versie zag Frank de oude, zonder makkelijke weg terug.

**Beslissing**: het gebaar zelf inbouwen. Een sleep omlaag vanaf de bovenkant laat een pilletje onder de topbalk vandaan zakken; voorbij ~70px betekent loslaten: herstarten. Het gebaar start alleen als élke scrollbare voorouder van het aangeraakte element al bovenaan staat, en niet als er een modaal, de zijlade of het toetsenbord openstaat.

**Verversen is hier een échte herstart van de pagina**, niet alleen de gegevens ophalen. Dat is precies wat de ↻ in de topbalk níet doet, en het onderscheid is bewust: de knop haalt Drive op, het gebaar haalt de app op. Voor die herstart wordt eerst een openstaande save weggeschreven (met een tijdslot van 6s, zodat een haperende verbinding de herstart niet gijzelt) en daarna de service-worker-cache geleegd. Zonder die laatste stap is de herstart zinloos: `sw.js` serveert `index.html` uit de cache, dus je krijgt dezelfde oude versie terug — exact de klacht waarmee dit begon.

**Waarom een sleep-gebaar en niet nog een knop**: er staat al een ↻ in de topbalk. Een tweede knop ernaast met een net iets andere betekenis is niet uit te leggen. Het sleep-gebaar is bovendien wat iedereen op een telefoon al probeert.

**Bestanden**: `index.html` — `.ptr-pil` CSS in de mobiele media-query, `#ptrPil` in de topbalk-sectie, de IIFE "Trek omlaag om te verversen" vlak vóór `toggleSidebarMobile`; `.module` kreeg `overscroll-behavior-y: contain`. `sw.js` — `CACHE_NAME` naar `herling-v7`.

**Niet doen**: het gebaar op `document` hangen in plaats van op `.main-area` — een niet-passieve `touchmove` over de hele pagina kost scroll-vloeiendheid. En het gebaar niet laten neerkomen op `refreshGist()`: dan doet het hetzelfde als de knop en blijft het probleem (de oude versie) staan.

## 2026-08-14 · Statusbalk-marge bovenin op mobiel, en één titel per module

**Probleem**: het hamburgertje linksboven was op de iPhone niet aan te tikken. De oorzaak: `viewport-fit=cover` plus `apple-mobile-web-app-status-bar-style: black-translucent` laten de pagina dóórlopen tot achter de statusbalk, maar `.mobile-topbar` stond op `top: 0` zonder marge. De balk van 52px lag daarmee volledig onder de klok en de Dynamic Island — precies het gebied waar iOS je tik zelf afvangt. Onderin was `env(safe-area-inset-bottom)` overal netjes toegepast (tabbalk, modalen, FAB); bovenin nergens.

**Beslissing**: `.mobile-topbar` krijgt `padding-top: env(safe-area-inset-top)` en groeit even hard mee in hoogte, zodat de achtergrondkleur wél tot achter de statusbalk doorloopt maar de inhoud eronderuit komt. Hetzelfde voor de zijlade (`.sidebar`, boven én onder — die schuift over het hele scherm) en voor het ververs-pilletje, dat onder de topbalk vandaan hoort te zakken.

**En meteen: één titel per module.** Het dashboard was de enige module met een eigen kop in de inhoud (`.dash-topbar .module-title`); alle andere leunen op `#mobileTopbarTitle`. Zolang die topbalk onzichtbaar onder de klok lag, oogde dat als "alleen het dashboard heeft een titel". Nu de balk zichtbaar is, stond er twee keer 'Dashboard' onder elkaar. De kop in de inhoud is daarom verborgen op mobiel — de datum eronder blijft, die staat nergens anders. `MOBILE_MODULE_TITLES` miste `todo`, waardoor die module een lege titelbalk kreeg; nu 'Projecten'.

**Waarom niet de topbalk gewoon lager zetten met een vaste 47px**: die maat verschilt per toestel (en per stand). `env()` is precies waarvoor dit bestaat, en de rest van de app gebruikte het onderin al.

**Bestanden**: `index.html` — `.mobile-topbar`, `.sidebar` (mobiel), `.ptr-pil`, `.dash-topbar .module-title`/`.module-sub` (mobiel), `MOBILE_MODULE_TITLES`

**Niet doen**: `padding-top` op de topbalk zetten zonder de hoogte mee te laten groeien — met `box-sizing: border-box` wordt de inhoud dan platgedrukt in plaats van omlaag geduwd.

## 2026-08-14 · Facturen per week/maand/jaar, en de btw-weergave op een telefoon

**Aanleiding**: drie klachten van Frank over de facturenmodule op de iPhone.

**1. Je kon alleen per jaar kijken.** De module kende alleen `facJaar`; Uren had wél een breedte-schakelaar. Nu is er `facScope` (week/maand/jaar) met `facAnker`, de dag waar je naar kijkt. `facJaar` blijft bestaan en loopt mee met het anker — bewust, want btw-aangifte, de verzonden mails en de kwartaalkiezer werken per jaar en hadden anders allemaal een periode moeten leren kennen die ze niet nodig hebben. `facActieveScope()` geeft alleen in de facturenlijst de gekozen breedte terug; op de andere tabbladen valt hij terug op het jaar, zodat een week-knop daar niets belooft wat niet gebeurt.

De keuze staat **in de filter-popover**, niet als knoppenrij in de topbalk. Op 393px is daar geen regel meer over, en het is een instelling die je één keer zet. Het periodelabel is nu ook de weg terug naar nu (`facNavHuidig`), dezelfde afspraak als bij Uren — daardoor kan de losse knop op mobiel weg.

Meegenomen omdat het anders stil fout gaat: de Excel-export voor de boekhouding gebruikt `facZichtbaar()` en volgt dus de periode. Melding, tabnaam en bestandsnaam noemen nu die periode, in plaats van "Alle facturen van 2026" boven een bestand met alleen augustus erin.

**2. De filterknop viel half weg.** Daar stond `⚟` (U+269F) als tekst. Dat teken zit in lang niet elk lettertype; op iOS viel het terug op een vervanger die boven de regel uitstak en onderaan werd afgeknipt. Vervangen door `FILTER_ICOON`, een inline `<svg>` die met de knop meeschaalt. Uren gebruikte hetzelfde teken en is meegegaan.

**3. Het btw-tabblad klopte niet op mobiel.** Twee dingen tegelijk. De kwartaalkiezer (zeven knoppen) werd in de filtersleuf naast vijf tabs geduwd op een regel die niet mag afbreken — niets had daar nog zijn eigen breedte. Hij staat nu op een eigen regel onder de tabs, als twee rasters: vijf tijdvakken boven, twee stelsels eronder. Daarnaast zitten beide btw-tabellen in een `.uren-sheet-card`, en die is op mobiel verborgen (afspraak van 2026-08-13) — maar ze hadden nooit een kaart-tegenhanger gekregen. Tussen de kop en de waarschuwing stond dus letterlijk niets. `facBtwRubriekKaarten()` en `facBtwRegelKaarten()` vullen dat gat.

**Ook gerepareerd**: `.fac-msom` (de totaalbalk onder de kaartenlijst) stond op `display:flex` zonder mobiele grens en was dus óók op desktop zichtbaar, onder een tabel die in zijn `tfoot` al dezelfde totalen toont.

**Bestanden**: `index.html` — `facScope`/`facAnker`, `facActieveScope`, `facPeriode`, `facAnkerZet`, `facNav`, `facScopeZet`, `facZichtbaar`, `facRenderAll`, `facRenderKpis`, `facRenderLijst`, `facRenderFilters`, `facToggleFilters`, `facBtwKiezer`, `facRenderBtw`, `facBtwRubriekKaarten`, `facBtwRegelKaarten`, `facExportBoekhouding`, `FILTER_ICOON`, `urenRenderFilters`; CSS `.fac-btw-groep`, `.fac-mrub`, `.fac-mkop`, `.fac-mlab`, `.fac-msom`, `.uren-scope-pop`, `.viewbar-btw`

**Niet doen**: `facJaar` weggooien ten gunste van de periode. Btw-aangifte gaat per kwartaal binnen een jaar en de mails per jaar; die hebben een jaartal nodig, geen willekeurig venster. En de periodekeuze niet alsnog in de topbalk zetten: daar past hij op een telefoon niet zonder een tweede regel, en die is er in augustus juist uitgehaald.

## 2026-08-14 · Invoervelden en popovers op hun eigen maat

**Probleem**: Frank meldde het drie keer achter elkaar, op drie schermen: de filter-popover in Facturen, de datumvelden in de factuurwizard, en vrijwel elk veld in de factuureditor stonden te groot in beeld. Het bleken twee losse oorzaken die op hetzelfde neerkwamen.

**1. Een variabele die buiten haar bereik werd gebruikt.** `--uren-ui` (12,5px, de maat voor alles wat je aanklikt in Uren en Facturen) stond alleen op `#mod-uren` en `#mod-facturen`. Menu's en popovers worden aan `document.body` gehangen — nodig, anders knippen ze af tegen een `overflow:hidden` in de module — en vielen daarmee buiten dat bereik. Een `font-size` die naar een onbekende variabele verwijst is ongeldig en valt terug op de ouder: de body, 15px op een telefoon. De knoppen in de filter-popover stonden zo een kwart groter dan dezelfde knoppen tien pixels ernaast.

*Beslissing*: `--uren-ui` staat nu ook op `:root`, en elke `var(--uren-ui)` heeft een terugvalwaarde. Twee sloten op dezelfde deur, want dit soort fout is onzichtbaar tot iemand het opmerkt. `#mod-facturen` ging op mobiel van 13px naar 12,5px: de twee modules delen hun chrome en horen dus dezelfde maat te hebben.

**2. De 16px-regel voor invoervelden.** `input, select, textarea { font-size: 16px !important }` op mobiel bestaat om één reden: Safari zoomt in zodra je een veld aanraakt dat kleiner is, en dan verspringt het hele scherm. Terecht — in een browsertab. Maar Frank gebruikt de app vanaf zijn beginscherm, en daar ligt de schaal vast en is er geen zoom om in te schieten. De maat kostte daar alleen leesbaarheid: een keuzelijst schreeuwde harder dan de kop erboven.

*Beslissing*: de regel blijft staan, met een `@media (display-mode: standalone)` eronder die velden in de geïnstalleerde app op 13,5px zet met een hoogte van 38px. In een browsertab verandert er niets. Werkt de mediaquery onverhoopt niet, dan is de uitkomst het gedrag van vandaag — niet iets kapots. Aankruisvakjes en keuzerondjes zijn uitgesloten: die hebben geen tekst in het veld en hun maat komt ergens anders vandaan.

**Bestanden**: `index.html` — `:root{--uren-ui}`, alle `var(--uren-ui,12.5px)`, `#mod-facturen` (mobiel), `input/select/textarea` in de mobiele media-query + het `display-mode: standalone`-blok, `.uren-filterpop` (mobiel)

**Niet doen**: de 16px onvoorwaardelijk verlagen. Dat is precies de wissel die de zoom-sprong in Safari terugbrengt, en die is erger dan een veld dat een halve punt te groot staat. En `--uren-ui` niet weer alleen op de module zetten: popovers leven buiten de module.

## 2026-08-14 · Correctie: de veldmaat hangt aan navigator.standalone, niet aan display-mode

**Vervangt punt 2 van de entry hierboven.** Die koppelde de kleinere invoervelden aan `@media (display-mode: standalone)`. Dat werkte niet, en de redenering erachter was ook te smal.

**Wat er misging**: de mediaquery is alleen waar in de app vanaf het beginscherm. Frank keek naar een smal getrokken bureaubladvenster — onder de 768px-grens, dus mét de mobiele opmaak, maar niet standalone. Daar veranderde er dus niets. En terecht niet: de query beschrijft "is dit een geïnstalleerde app", terwijl de vraag is "kan de pagina hier inzoomen als ik een veld aanraak".

**De juiste vraag**: dat gebeurt op precies één plek — Safari op iOS, in een gewoon tabblad. Niet in de app vanaf het beginscherm, niet op een bureaublad, ook niet in een smal venster. `navigator.standalone` onderscheidt dat exact: `false` in een Safari-tabblad op iOS, `true` in de app, en `undefined` overal daarbuiten. Een scriptje in de `<head>` zet bij `=== false` de klasse `ios-tab` op `<html>`.

**Beslissing**: 13,5px is nu de standaard voor invoervelden op mobiele breedte, en `.ios-tab` zet ze terug op 16px. Dat is de omgekeerde volgorde van eerst: de uitzondering staat waar de uitzondering is, in plaats van dat de uitzondering de regel is. De klasse staat in de `<head>` en niet bij de rest van de JS, zodat hij er is voordat er iets getekend wordt.

Meegenomen: `.toolbar .search-input`, `.cl2-filter-search` en `.dash-quickadd input` hadden hun eigen `font-size: 16px !important` met hogere specificiteit en bleven daardoor buiten elke wijziging staan. Die volgen nu hetzelfde patroon.

**Bestanden**: `index.html` — scriptje in de `<head>`, de invoerveld-regels en `.ios-tab`-tegenhangers in de mobiele media-query, de drie zoekvelden; `sw.js` — `CACHE_NAME` naar `herling-v8`

**Niet doen**: `display-mode` gebruiken om iets over invoergedrag te zeggen. Het beschrijft hoe de app *gestart* is, niet of de pagina kan zoomen. En de uitzondering niet terugdraaien naar "groot als standaard": dan komt dezelfde klacht terug op elk scherm dat toevallig smal is.

## 2026-08-16 · Pincode-versleuteling afgeschaft, alleen het uitpakpad blijft

**Probleem**: Frank kreeg op dezelfde pc telkens opnieuw de vraag om zijn pincode. Dat is geen bug in de code maar het ontwerp: de afgeleide sleutel werd per apparaat bewaard met een vervaldatum van 30 dagen (`PIN_ONTHOUD_DAGEN`), en verviel bovendien bij elke opgeruimde localStorage of mislukte ontsleuteling. Een slot dat je elke maand opnieuw moet openen terwijl er niets veranderd is.

**Waarom het er stond, en waarom dat niet meer geldt**: de versleuteling komt uit de Gist-tijd. Een "secret" Gist is niet privé maar onvindbaar — iedereen met de URL leest hem zonder in te loggen, en dan is een blok ruis echte winst. Sinds de overstap naar Drive `appDataFolder` (fase 2, 2026-08-05) is dat argument weg: die map is per account, er is geen URL en geen losse token, en Google dwingt af dat alleen deze app erbij komt. De pincode was daar bovenop vooral een deur die uit zichzelf weer op slot sprong.

**Beslissing**: het versleutelen is helemaal weg — er wordt nooit meer iets versleuteld weggeschreven, en de menu-ingang "Beveiligen met pincode" bestaat niet meer. Wat blijft is uitsluitend het uitpakpad, want er kan nog een `rawState.geheim` in Drive staan en daar zitten de facturen en uren in. Dat blok wordt één keer opengemaakt:

- onthoudt dit apparaat de sleutel nog, dan gaat het vanzelf en merk je er niets van;
- zo niet, dan vraagt de modaal er één keer om zodra je Facturen of Uren opent.

In beide gevallen loopt daarna `pinVersleutelingWeg()`: vlag eraf, blok weg, apparaatsleutel weg, en de administratie plat naar Drive. Daarna is er niets meer dat om een pincode kán vragen.

Twee dingen bewust wél laten staan:

1. **De poort `geheimenKlaar()`.** Die was er voor de versleuteling, maar de reden erachter overleeft de versleuteling: zolang het oude blok dicht is staan `factuurState` en `urenState` leeg in het geheugen, en die leegte wegschrijven wist je administratie in Drive. `saveGistIntern()` stopt daarop, `saveLocalBackup()` houdt de geheime delen uit de vorige kopie aan.
2. **De vervaldatum-controle in `pinLeesBewaardeSleutel()` is juist wél geschrapt.** Die controle was precies de oorzaak van de klacht. Voor één keer uitpakken maakt de leeftijd van de sleutel niet uit, en na afloop wordt hij weggegooid.

**Bestanden**: `index.html` — weg: `pinVersleutel`, `pinPakGeheimen`, `pinStripGeheimen`, `pinBewaarSleutel`, `pinVergeetApparaat`, `pinDagenResterend`, `pinIngeschakeld`, `pinB64`, `pinModus`, `laatsteGeheimBlob`, `pinSleutel`, `PIN_ONTHOUD_DAGEN`, het "Beveiliging"-blok in `toggleAppInstellingen`, `_versleuteldInGist` in `downloadBackup`; nieuw: `pinVersleutelingWeg`, `pinSleutelVergeten`; herschreven: `openPinModal` (één modus), `pinBevestig`, het `rawState.geheim`-blok in `hydrateerState`, de poort in `saveGistIntern`

**Niet doen**: het uitpakpad weggooien "want de pincode is toch afgeschaft". Zolang er ergens nog een Drive-bestand met `rawState.geheim` kan liggen, is dat pad het enige wat de facturen en uren daaruit terughaalt — zonder is die administratie onleesbaar. Pas als vaststaat dat elk apparaat een keer heeft uitgepakt (`settings.versleuteld` nergens meer aanwezig) kan de rest weg. En de poort `geheimenKlaar()` niet meenemen in die opruiming: die hoort bij de leegte, niet bij de versleuteling.

## 2026-09-01 · Checklist: nieuwe taken bovenaan, en sortering als eigen keuze

**Probleem**: een nieuwe taak kreeg `sortOrder = aantal taken in zijn prioriteitsgroep` en belandde dus onderaan die groep — precies onder de taken die er al het langst stonden. Wat je net bedacht hebt zie je pas na scrollen. De sorteerkeuze zelf bestond wel (`Prioriteit ↓` / `Deadline ↑`) maar was armoedig: twee opties, en "Deadline" gooide de prioriteitsgroepen overboord omdat sorteren en groeperen in dezelfde schakelaar zaten.

**Beslissing**: die twee dingen uit elkaar getrokken.

- `checklistState.sortBy` is voortaan de sorteersleutel *binnen* een groep: `newest` (standaard), `oldest`, `deadline`, `manual`, `alpha`. De comparators staan bij elkaar in `CL_SORT_MODI`, met sleutels die één op één de `<option>`-waarden van `#clSortSelect` zijn.
- `checklistState.groupByPriority` (standaard aan) bepaalt of er in Hoog → Middel → Laag gegroepeerd wordt. Staat hij uit, dan één platte lijst. Daarmee is "puur op deadline, prioriteit negerend" nog steeds te krijgen — het is nu alleen een aparte knop in plaats van een verstopt neveneffect.
- Een `<select>` en geen popover-menu: op de iPhone geeft dat de systeempicker, en er is geen extra CSS of outside-click-afhandeling voor nodig.

**Nieuwe taken bovenaan** gebeurt op twee manieren tegelijk, want er zijn twee volgordes. In elke tijdsmodus telt `createdAt`; in `manual` telt `sortOrder`, en daar geeft `clNieuweSortOrder()` een nieuwe taak `min(groep) - 1`. Ook wie handmatig sorteert ziet zijn nieuwe taak dus bovenaan — onderaan belanden was de klacht, niet de modus.

**Waarom `createdAt` erbij moest**: drie van de vijf plekken die een taak aanmaakten zetten het veld niet (`clAddInlineItem`, `dashQuickAdd`, `dashClAdd`). Zonder aanmaakmoment is "nieuwste bovenaan" betekenisloos. Bestaande taken krijgen er bij het laden één toegewezen (`migreerChecklistVolgorde`), aflopend vanaf het oudste échte `createdAt` in de lijst en in de volgorde waarin ze nú op het scherm staan. Dat is bewust andersom dan je zou verwachten: zo houdt de bestaande lijst onder de nieuwe standaard exact zijn huidige volgorde, en komt alleen wat je vanaf nu aanmaakt er bovenop. Een backfill die de lijst omkeert zou technisch net zo verdedigbaar zijn en in de praktijk voelen als dataverlies.

**Slepen blijft aan `manual` hangen**: in elke andere modus zou de sleepvolgorde bij de eerstvolgende render overschreven worden. `dragstart` blokkeert daar met een toast die zegt waarom, en de greep `⋮⋮` staat vaag. Bewust géén automatische omschakeling naar `manual` bij het slepen: dan verandert de sortering van de hele lijst door een handeling die over één kaart lijkt te gaan.

**Meegenomen**: `#clSortSelect` las zijn waarde nooit terug uit de state, dus na een herlaad stond er altijd de eerste optie, ook als er op deadline gesorteerd werd. `renderClSortControls()` zet select én knop nu gelijk aan de state. Het dashboard-widget volgt dezelfde comparator, zodat beide schermen dezelfde volgorde tonen.

**Bestanden**: `index.html` — nieuw: `CL_SORT_MODI`, `clAangemaaktOp`, `clSortModus`, `clSortCmp`, `clGroepeertOpPrioriteit`, `clNieuweSortOrder`, `migreerChecklistVolgorde`, `renderClSortControls`, `toggleClGroupByPriority`; gewijzigd: de topbalk van `#mod-checklist`, `hydrateerState`, `renderChecklistModule`, `renderPriorityGroups`, `wireChecklistBodyEvents`, `clItemHtml`, `setChecklistSort`, `renderDashChecklist`, en de vijf plekken die een taak aanmaken

**Niet doen**: `sortOrder` weggooien "want er is nu `createdAt`". Het is de enige drager van de handmatige volgorde. En de migratie niet nog eens over de lijst laten lopen met een andere basis: taken die al een `createdAt` hebben moeten met rust gelaten worden, anders schuift de volgorde bij elke start.

## 2026-09-01 · Periode op de factuur: afleiden blijft, maar is nu te overschrijven

**Probleem**: onder Betreft staat "Periode 1 t/m 30 augustus 2026" terwijl augustus 31 dagen heeft. De regel wordt afgeleid uit de gekoppelde urenregistraties — `van` is de vroegst geboekte dag, `tot` de laatst geboekte. Op 31 augustus stond niets geboekt, dus eindigde de periode op de 30e. Er was geen veld en geen scherm om dat te corrigeren: de tekst werd alleen tijdens het tekenen van de PDF opgebouwd.

**Waarom het afleiden op zichzelf goed was**: het commentaar bij de functie zei het al — liever afleiden dan de gebruiker hetzelfde twee keer laten invullen. Dat klopt voor een factuur over een losse klus. Het klopt niet voor een maandfactuur, en dat is het normale geval hier: de laatste dag van de maand is zelden ook de laatste dag waarop geboekt is (weekend, feestdag, vrije dag). De afleiding is dan niet fout maar wel structureel misleidend, en juist bij het bedrag-dragende document wil je dat kunnen rechtzetten.

**Beslissing**: `f.periode` als vrij tekstveld in de editor, direct onder Betreft — waar het op de factuur ook staat. Leeg = de bestaande afleiding, dus alle bestaande facturen veranderen niet. De afgeleide tekst staat als placeholder in het veld, zodat je ziet wat erop komt zonder de PDF te openen. Daarnaast een knop **Hele maand** die het veld vult met de kalendermaand van de gekoppelde uren (`factuurPeriodeMaand`), want dat is hier het gewenste antwoord in negen van de tien gevallen.

Bewust een tekstveld en geen datumbereik met twee `<input type="date">`: het is een regel op een document, geen gegeven waar iets mee gerekend wordt. Met een bereik kun je "Periode augustus 2026" of "Week 31 t/m 35" niet meer schrijven, en zou de knop Hele maand een vlag moeten worden die de tekst blijft herberekenen.

**Meegenomen**: de derde sjabloonvariant (links uitgelijnd, zonder kop boven Betreft) tekende de periodetekst helemaal niet — daar zou je invoer zonder zichtbare reden verdwijnen zodra je van sjabloon wisselt. En `factuurDupliceer` gooit `periode` weg, om dezelfde reden als het maildossier en `nummerVast`: de kopie krijgt `urenIds=[]`, dus de periode van de bron zou als enige regel blijven staan terwijl er niets meer aan hangt.

**Bestanden**: `index.html` — `factuurPeriodeTekst` gesplitst in `factuurPeriodeFormat` / `factuurPeriodeAfgeleid` / `factuurPeriodeMaand` / `factuurPeriodeTekst`, nieuw veld in `facEditorRender`, nieuw `facEdPeriodeMaand` + registratie in `FAC_CLICK_ACTIONS`, periodetekst toegevoegd aan de derde tak van `facPdfMeta`, `delete f.periode` in `factuurDupliceer`; `sw.js` — `CACHE_NAME` naar `herling-v11`

**Niet doen**: de afleiding vervangen door "altijd de hele maand". Een factuur over een halve maand of over één klus zou dan een periode claimen die niet klopt, en dat is erger dan een dag te vroeg eindigen. De hele maand is een keuze die je maakt, geen aanname die de app voor je doet.

## 2026-09-02 · Checklist: taken vastpinnen boven de prioriteitsgroepen

**Probleem**: er is één taak die deze week steeds boven aan de lijst moet staan, ongeacht wat de sortering ervan vindt. Dat kon alleen door de prioriteit op Hoog te zetten — waarmee je de prioriteit misbruikt als plaatsingsmiddel en de betekenis van "Hoog" uitholt. In `manual` kon je hem naar boven slepen, maar alleen naar de top van zijn eigen prioriteitsgroep, en die volgorde overleeft het wisselen van sorteermodus niet.

**Beslissing**: een `pinned`-vlag per taak, met een punaiseknop in de rij. Vastgepinde taken staan in één blok bovenaan — *boven* de prioriteitsgroepen, niet erbinnen. Een vastgepinde lage prio komt dus boven een hoge uit; dat is precies de bedoeling, anders zegt "altijd bovenaan" niets.

**Binnen het blok verandert er niets aan de volgorde**: `clSortCmp()` zet er alleen `clVastCmp` vóór, en die valt weg zodra beide taken even vastgepind zijn. Wat daarna telt is gewoon de gekozen modus uit `CL_SORT_MODI`. Het pinnetje bepaalt dus *waar* een taak staat, niet *hoe* er gesorteerd wordt — en `sortOrder` wordt bij het pinnen bewust niet aangeraakt, zodat losmaken de oude plek teruggeeft.

**Het blok kent zelf geen prioriteitsverdeling.** Zou het die wel hebben, dan zou een vastgepinde lage prio alsnog onder een vastgepinde hoge belanden en is de knop weer een prioriteitsknop. Daarom staat in `renderDashChecklist()` ook `!a.pinned` bij de prioriteitsstap: zonder die check sorteerde het dashboard binnen de vastgepinde taken tóch op prioriteit en weken de twee schermen van elkaar af.

**Slepen kruist de grens niet**: `clZelfdePinGroep()` laat `dragover` geen `preventDefault` doen tussen een vastgepinde en een gewone taak, dus de browser weigert de drop zichtbaar. Anders zou je een kaart ergens neerleggen waar hij niet blijft liggen — het pinnetje bepaalt de plek, niet de sleepvolgorde. Hernummeren gebeurt per zichtbaar blok: alle vastgepinde taken samen, de rest per prioriteit.

**Zichtbaar zonder kopje**: in de platte volgorde (Prio-groepen uit) zijn er geen groepskoppen, dus de kaart draagt het zelf — mintrand plus een oplichtende, gevulde punaise. In de gegroepeerde weergave staat er bovendien een kopje "Vastgepind" met een telling, in dezelfde vorm als de prioriteitskoppen.

**Bestanden**: `index.html` — nieuw: `clVastCmp`, `clPinSvg`, `toggleClItemPin`, `clZelfdePinGroep`, CSS `.cl2-group-pin` / `#clBody .cl-item.pinned` / `.cl2-iconbtn.pinned`; gewijzigd: `clSortCmp`, `clNieuweSortOrder` (tweede parameter `pinned`), `renderPriorityGroups`, `wireChecklistBodyEvents`, `clItemHtml`, `spawnRecurringNext`, `renderDashChecklist`, `APP_ACTIONS`. `test.html` — drie tests (32/32)

**Niet doen**: het pinnetje laten vervallen bij afronden of archiveren. Een afgeronde taak die je weer openzet, of een gearchiveerde die je herstelt, hoort terug te komen zoals je hem achterliet. Ook geen aparte "pin-volgorde" invoeren: de vraag was om één taak bovenaan, niet om een tweede sorteersysteem ernaast.

## 2026-09-07 · Klant kiezen in een formulier is een uitklaplijst

**Probleem.** Het urenvenster gaf elke klant een eigen chip. Met vier klanten
waren dat al vier regels — de helft van het venster ging op aan één keuze, en
"Opslaan" viel onder de vouw. Elke klant erbij maakt het venster hoger.

**Beslissing.** Eén gedeeld onderdeel `.klantkies`: een gekleurd stipje plus een
`<select>`, in dezelfde doos als het invoerveld ernaast. In gebruik in het
urenvenster; de facturen-editor deed dit al met een kale `<select>`.
Vuistregel: **kiezen uit een lijst die met de administratie meegroeit is een
uitklaplijst, geen rij chips.** Chips blijven waar het aantal vaststaat — de
statuskeuze (drie) en de snelknoppen bij Uren.

**Waarom.** Een venster hoort niet mee te groeien met het aantal klanten. Het
stipje houdt de kleurherkenning vast die de chips gaven, en de doos is die van
`.uren-fld .inp`, zodat het veld niet uit de toon valt.

**Bestanden.** `index.html` — `.klantkies`/`-dot`/`-sel`/`-leeg` (vervangt
`#mod-notes .notes-klant-kies` + `.nkk-*`), `.uren-klantpick` weg,
`urenRenderEntryClients()` herschreven. Dode notitie-kiezer opgeruimd:
`renderNoteKlantKies()`, `#noteKlantKies` en de twee aanroepen zijn weg — die
stond sinds 2026-09-07 op `display:none` in beide lagen (de klant van een
notitie zit in het ⋯-menu). `docs/stijlgids.md` §6.

**Niet doen.** De chips terugzetten "omdat het sneller klikt". Bij vier klanten
misschien; bij vijftien is het een muur.

## 2026-09-07 · Factuurkaart krijgt de vorm van de urenkaart

**Probleem.** Een factuur op een telefoon was vijf tot zeven regels boven
elkaar: nummer + datum, vervalregel, klant, betreft (twee regels), status +
bedrag, en "gemaild op". Twee facturen vulden het scherm.

**Beslissing.** Dezelfde twee kolommen als `.uren-mcard`: links waar het over
gaat (klant, `nummer · datum`, betreft op één regel), rechts het bedrag met
excl. en de statuspil eronder. De losse vervalregel en de "gemaild"-regel zijn
één regel geworden (`facTijdRegel()`): *Gemaild 28/08/2026 · nog 20 dagen*.
Klantnaam van 14px naar `--fs-klein`, betreft van 12,5px naar `--fs-micro` en
één regel in plaats van twee — dezelfde trappen als de urenkaart.

Geldt voor alle drie de plekken die `.fac-mcard` gebruiken: de facturenlijst,
Debiteuren (de knoppenrij pakt als derde kind de volle breedte) en de
btw-regelkaarten (grondslag als hoofdgetal, btw als bijregel eronder, in plaats
van twee gelabelde voetregels).

**Waarom.** Vijf facturen in beeld in plaats van twee en een halve; kaarthoogte
van ~150px naar ~80px. En het is dezelfde kaart als in Uren, dus er valt niets
apart te onthouden.

**Bestanden.** `index.html` — `.fac-mcard` (`.links`/`.rechts`/`.meta`/`.tijd`,
`.kop`/`.voet`/`.nr`/`.dat`/`.mbedragen`/`.fac-mlab`/`.fac-mverval` weg),
`facRenderKaarten()`, `facRenderDebiteuren()`, `facBtwRegelKaarten()`,
nieuwe `facTijdRegel()`. `facVerstuurdRegel()` blijft — die staat op desktop
onder de statuspil in de tabel. `docs/stijlgids.md` §4.

**Niet doen.** De tabel op desktop meeveranderen: die heeft de ruimte wél en
toont dezelfde gegevens in kolommen.

## 2026-09-07 · Cijfers staan overal in de huisstijl-tekst

**Probleem.** Getallen stonden in twee lettertypes door elkaar. Facturen zette
`--font-mono` lokaal op de huisstijl-tekst (2026-08-19, om de kolombreedte);
alle andere modules gebruikten JetBrains Mono. Naast elkaar — de KPI-strip van
Uren tegenover die van Facturen, dezelfde kaart, hetzelfde getal — lees je dat
als twee verschillende schermen. Frank: *"Kan je ook het lettertype van alle
cijfers overal hetzelfde maken? Doe maar de stijl van de facturen pagina."*

**Beslissing.** Nieuw token `--font-cijfer: var(--font-body)`. Alle 62 plekken
die `var(--font-mono)` gebruikten voor een getal, datum, teller of bedrag zijn
omgezet. `--font-mono` blijft bestaan maar alleen nog voor wat écht code is:
een codeblok in een notitie (`.note-editor code`, `.wr-content code`), een
toets in de sneltoetsenlijst (`.gs-kbd`, `.shortcut-row kbd`) en het
pincodeveld (losse tekens met 8px ertussen). De lokale override van Facturen is
weg — die deed nu hetzelfde als de regel eronder.

Uitlijnen doet `font-variant-numeric: tabular-nums`, niet het lettertype; waar
getallen in een kolom onder elkaar staan is dat toegevoegd waar het nog miste.

**Waarom.** Eén token in plaats van 62 losse regels betekent dat wat er later
bij komt vanzelf meedoet. En de huisstijl-tekst is smaller: dat was in 2026-08-19
al de reden om het in Facturen te doen.

**Bewijs.** Op zes modules en zes vensters, op 375 én 1400px, staat geen enkel
zichtbaar element meer in JetBrains Mono (gemeten met `getComputedStyle`).

**Bestanden.** `index.html` — token in `:root`, 62 omzettingen, vijf
code-plekken teruggezet, `#mod-facturen{--font-mono:…}`-blok weg.
`docs/stijlgids.md` §1.

**Niet doen.** JetBrains Mono uit de Google-Fonts-link halen: de codeblokken in
Notities gebruiken hem nog.

## 2026-09-07 · Vier vensters hadden geen uitgang op een telefoon

**Probleem.** `zetModalSluitknoppen()` hing het kruisje op aan een
annuleerknop in een `.modal-footer`. Vier vensters hebben die niet — het
klantoverzicht, de wekelijkse review, Slim toevoegen en de zoekbalk — en gaan
alleen dicht door náást het venster te tikken. Op een telefoon is een modaal
zo goed als schermvullend: daar valt niets naast te tikken.

**Beslissing.** Is er geen annuleerknop maar heeft de `.modal-bg` wél een eigen
`onclick`-afhandeling, dan komt het kruisje er alsnog en klikt het de
achtergrond aan (`bg.click()` zet `event.target` op de achtergrond zelf,
precies waar die afhandeling op wacht). Het venster blijft dus zijn eigen
sluitlogica houden. Het kruisje krijgt daarbij de klasse `via-achtergrond`:
komt de inhoud later zelf met een kruisje (het klantoverzicht vult zijn kop pas
bij het openen), dan wijkt het onze.

Meegenomen: `.modal-annuleer` verbergt nu ook buiten een `.modal-footer`, zodat
de handgemaakte voeten van Slim toevoegen en de wekelijkse review niet én een
kruisje én een sluitknop tonen. Alleen op mobiel; desktop houdt beide.

**Waarom.** Een venster zonder zichtbare uitgang is geen stijlkwestie.

**Bestanden.** `index.html` — `zetModalSluitknoppen()`, `.modal-annuleer`,
twee knoppen in de opmaak.

**Blijft staan.** De zoekbalk (Ctrl+K) sluit via een `addEventListener` in
plaats van een `onclick`-attribuut en is daar niet mee te vinden; hij is ook
alleen met een toetsenbord te openen.

## 2026-09-07 · Klantoverzicht krijgt een eigen knop, klantkaart wordt compacter

**Probleem.** Drie dingen op één plek.

1. Het klantoverzicht (`openClientDash`) zat alleen achter een ℹ in een regel
   van het klant-uitklapmenu. Die knoppen verschijnen op hover — op een
   telefoon dus nergens.
2. De drie snelknoppen ín dat venster stonden op mobiel elk op een eigen regel
   met de halve breedte aan wit ernaast: ze passen niet met z'n tweeën naast
   elkaar, dus `flex-wrap` zette ze los onder elkaar op hun eigen breedte.
3. De klantkaart op het tabblad Klanten had de knop "Gegevens" op een eigen
   regel onderaan, met dezelfde witruimte ernaast, en de naam liep over twee
   regels.

**Beslissing.**

1. `.client-filter-info` — een icoonknop naast de klantenbalk, in alle vier de
   topbalken die een klantfilter hebben. Aan zodra je op één klant filtert,
   `disabled` en op `opacity:.35` zolang het "Alle klanten" is: een overzicht
   van alle klanten tegelijk bestaat niet. Hij sluit aan bij de gedeelde
   icoonknop-regel, dus hij is even groot als de trechter en het ⋯.
2. `.cd-acties` wordt op mobiel een raster van twee kolommen met de hoofdknop
   over de volle breedte — dezelfde vorm als een modaalvoet (2026-09-06).
3. De klantkaart wordt op mobiel een raster: naam links (afgekapt), "Gegevens"
   rechts op dezelfde regel, de rest eronder over beide kolommen. "N facturen"
   is van de knoppenrij naar de meta-regel verhuisd — het is een gegeven, geen
   knop. Vier klanten in beeld in plaats van tweeënhalf.

**Waarom.** Een knop die de halve regel leeg laat leest als een fout. En een
functie die alleen met een muis te bereiken is, bestaat op een telefoon niet.

**Bestanden.** `index.html` — `renderOneClientFilter()`, `wireClientFilter()`,
`.client-filter`/`.client-filter-info`, `.cd-acties`, `.fac-klantkaart` +
mobiele laag, `facRenderKlanten()`. `docs/stijlgids.md` §2.

**Niet doen.** De ℹ uit het uitklapmenu halen — op een bureaublad is dat nog
steeds de snelste weg als je niet eerst wilt filteren.

## 2026-09-07 · Btw en Debiteuren tonen elk bedrag nog maar één keer

**Probleem.** Op het btw-tabblad stond hetzelfde btw-bedrag zes keer in beeld
en de omzet vijf keer: de tegelstrip, de rubriekentabel, de totaalrij daarvan,
en de facturentabel met zijn eigen totaal. De tegel "Btw 21%" zei er letterlijk
"rubriek 1a · over € 2.520,00" bij — precies de twee getallen uit de rij
eronder. Op Debiteuren waren "Openstaand" en "Te laat" de optelsom van de
ouderdomstegels direct eronder, en "Openstaand" stond bovendien in de
tabelvoet.

**Beslissing.**
- **Btw** heeft geen tegelstrip meer. De rubriekenkaarten zíjn de samenvatting
  — dat is wat je op het aangifteformulier overneemt.
- Is er maar **één rubriek**, dan vervalt ook de totaalregel eronder (die
  herhaalt dan diezelfde rubriek). De verwijzing "rubriek 5a" verhuist naar de
  btw-cel van de rij zelf, want dát is de informatie: welk vakje op het
  formulier. Bij twee of meer rubrieken komt de totaalregel gewoon terug.
- **Debiteuren** houdt van de strip alleen "Omzet" en "Betaald" over — die twee
  staan nergens anders op dat tabblad.
- `.uren-kpis` gaat van `repeat(4,1fr)` naar `repeat(auto-fit,minmax(160px,1fr))`,
  anders lieten die twee tegels de halve balk leeg. Bij vier tegels komt het op
  hetzelfde neer (pixel-identiek op 1400px gecontroleerd).

Het tabblad Facturen houdt zijn vier tegels: daar is de strip de enige
samenvatting.

**Waarom.** Vraag: is dit hetzelfde getal als dat hierboven, of net een ander?
Zodra je die vraag moet stellen, is de pagina langzamer geworden.

**Bestanden.** `index.html` — `facRenderKpis()`, `facRenderBtw()`,
`facBtwRubriekKaarten()`, `.uren-kpis`.

**Niet doen.** Ook de voetregel van de facturentabel weghalen: een tabel die
zijn eigen kolom optelt is geen herhaling, dat is de tabel afmaken.

## 2026-09-07 · Het klantfilter kiest alleen nog; beheren zit in het ⋯-menu

**Probleem.** Achter elke regel van het klantfilter stonden drie knopjes —
overzicht (ℹ), hernoemen (✎), verwijderen (✕) — die pas bij hover verschenen.
Op een telefoon bestaat hover niet: de eerste tik zette de hover-staat en pas
de tweede koos de klant. Frank: *"Dan moet de selectie ook een single click
worden ipv nu dat je dubbel moet klikken."*

**Beslissing.** Het filter filtert, meer niet. De drie knopjes zijn weg, dus
één tik kiest — op elk apparaat. Wat ze deden is verhuisd:

| Was | Is nu |
|---|---|
| ℹ overzicht | de ⓘ naast de balk (2026-09-07) |
| ✎ hernoemen | het veld "Weergavenaam" in Klantgegevens |
| ✕ verwijderen | de knop "Verwijderen" linksonder in Klantgegevens |

En elk ⋯-menu op een pagina met een klantfilter — Dashboard, Checklist,
Notities — krijgt **Klanten beheren**: dat springt naar Facturen → Klanten,
waar het beheer al zat. Eén adres, geen tweede beheerscherm.

**Waarom.** Een bedieningsknop die alleen met een muis tevoorschijn komt,
bestaat op een telefoon niet — en hij kostte daar bovendien de eerste tik.

**Bestanden.** `index.html` — `renderOneClientFilter()`, `wireClientFilter()`,
`.cf-actions`/`.cf-actbtn` weg, `openKlantenBeheer()`, `facKlantVerwijder()`,
voet van `#klantModal`, drie ⋯-menu's. Opgeruimd: `editClient()` en de tak
`renameTarget='client:'` waren hiermee onbereikbaar geworden, net als de al
langer ongebruikte `editClientStop`/`deleteClientStop`.

**Niet doen.** Een tweede scherm bouwen om klanten te beheren. Het tabblad
Klanten in Facturen is dat scherm al.

## 2026-09-07 · Debiteuren opent op de facturen, niet op de cijfers

**Probleem.** Zeven tegels boven een lijst van twee facturen. Op een telefoon
moest je twee schermen scrollen voordat je bij de eerste factuur was — terwijl
je Debiteuren opent om te zien wie er nog moet betalen en om "Betaald" aan te
tikken. Frank: *"Ik vind deze kpi blokken te veel. Kan jij een deel verbergen
onder een knop of desnoods alle onderdelen?"*

**Beslissing.** Alle zeven achter één uitklapregel, standaard dicht — dezelfde
vorm als de filterregel in de Checklist (2026-09-06): één regel die zegt wát
erachter zit, en die je opentikt. De regel toont het **aantal** te late
facturen, niet het bedrag: dat bedrag staat al in de voet van de tabel, en dan
zou de regel die de cijfers wegstopt er zelf één verdubbelen.

De strip Omzet/Betaald staat nu óók in dat blok in plaats van in de topbalk;
anders viel de helft van de cijfers buiten de schakelaar.

De keuze staat in `localStorage` (`herling_deb_cijfers`), niet in de
administratie: het is een kijkvoorkeur per apparaat, net als het thema.

**Bestanden.** `index.html` — `facCijfersOpen()`/`facToggleCijfers()`,
`facRenderDebiteuren()`, `facRenderKpis()`, `.fac-cijfers-kop`/`.fac-aging-2`.

**Niet doen.** De tegels weghalen. Ze kloppen en ze zijn nuttig — ze hoeven
alleen niet elke keer als eerste in beeld te staan.

## 2026-09-07 · Klantgroepen verbergen in Notities

**Probleem.** Elke klant krijgt een eigen groep in de notitieboom, ook een
klant waar al een jaar niets meer voor gebeurt. Die staan dan tussen de
lopende dossiers in.

**Beslissing.** `notesState.verborgenKlanten` — een lijst met klant-id's
waarvan de groep niet in de boom staat. Verbergen is een **weergave**, geen
verwijdering: de notities blijven, de klant blijft, en in het klantfilter
(dat van alle modules samen is) staat hij gewoon.

- **Verbergen** gebeurt in de groepskop zelf, naast de `+`: een oog met een
  streep erdoor. Daar zie je de klant, dus daar hoort de knop. Op mobiel staan
  die knoppen al op `opacity:1` (2026-09-05), dus één tik is genoeg.
- **Het overzicht** staat onderaan de boom: *"3 klanten verborgen"*, uitklapbaar
  naar een lijst met per klant een oog om hem terug te halen, plus "Alles weer
  tonen". Onderaan, want het gaat over wat je juist niet hoeft te zien — maar
  wél in beeld, anders is het weg zonder dat je weet dat het weg is.
- Verbergen geeft een toast met **ongedaan maken**, zoals elke verwijderactie.

**Waarom niet in het klantfilter.** Frank stelde dat voor. Maar dat filter
wordt door alle modules gedeeld, en de knopjes die daar in de regels stonden
kostten op een telefoon de eerste tik — daarom zijn ze er eerder vandaag juist
uitgehaald. Ze terugzetten voor een oog zou dezelfde fout opnieuw maken.

**Bestanden.** `index.html` — `notesKlantVerborgen/Verbergen/Tonen()`,
`notesToonAlleKlanten()`, `toggleNotesVerborgen()`, `renderNotesTree()`,
`.note-verborgen*`, hydratiestap, `NOTES_OOG_DICHT/OPEN`. `CLAUDE.md`.

**Niet doen.** Er een globale "inactieve klant" van maken zonder het te vragen:
dat raakt ook de Checklist, Uren en Facturen, en dat is een andere beslissing.

## 2026-09-07 · Alles wat app-breed is staat onder Instellingen

**Probleem.** Frank kon de knop "Slim toevoegen" op zijn bureaublad niet
vinden — en terecht: hij bestond daar niet. De ingang zat alleen in het
⋯-menu van het Dashboard en dat van de Checklist, en die staan allebei op
`display:none` buiten de mobiele laag. Hetzelfde gold voor de **Gemini
API-key**, "Data opnieuw laden", "Back-up terugzetten" en "Notificaties": wél
in dat mobiele menu, niet onder Instellingen. Twee menu's met verschillende
inhoud voor dezelfde app, en het grootste ervan bestond alleen op een telefoon.

Frank: *"Ik zou verwachten dat alles onder de knop instellingen zou moeten
vallen."*

**Beslissing.** Eén plek voor wat over de hele app gaat: de knop
**Instellingen** in de zijbalk, op elk scherm. Die had twee items en heeft er
nu negen, in drie groepen — Gegevens (opnieuw laden, versiegeschiedenis,
back-up downloaden en terugzetten), AI (API-key, Slim toevoegen, Wekelijkse
review) en Notificaties. Bij de API-key staat meteen of er een is ingesteld
*op dit apparaat*, want hij zit in `localStorage` en niet in Drive.

Het ⋯-menu op het Dashboard houdt alleen wat over dát scherm gaat — nieuwe
klant, klanten beheren, wekelijkse review, slim toevoegen — plus een regel
"Instellingen…" die de zijbalk opent. Geen twee lijsten meer die uit elkaar
kunnen lopen.

Daarnaast staat **Slim toevoegen met AI** nu ook in de knop `+ Nieuw item`,
naast Checklist item en Notitie. Daar hoort het: het is een manier om items toe
te voegen, en dat is de plek waar je daarvoor kijkt.

**Bestanden.** `index.html` — `toggleAppInstellingen()` en zijn afhandeling,
`#dashMobileSettingsMenu`, de `+ Nieuw item`-opties en hun dispatcher.

**Niet doen.** De storage-items terugzetten in het mobiele ⋯-menu "omdat het
daar sneller is". Dat is precies hoe de twee lijsten uit elkaar zijn gelopen.

## 2026-09-07 · Gemini: 403 uitgelegd, 503 stil opgevangen

**Probleem.** Twee foutmeldingen die allebei als een muur voelden maar iets
heel verschillends betekenen.

- **403 "Your project has been denied access. Please contact support."** —
  Google's eigen tekst, onveranderd doorgegeven. Hij zegt niet wat je moet
  doen. In de praktijk twee oorzaken: een **spend cap van € 0** op dat project
  (die pauzeert de service), of een sleutel bij een **Workspace-account onder
  een organisatie**, waar de gratis laag vaak niet beschikbaar is. Dat laatste
  was het hier; een sleutel via een persoonlijk Google-account kwam er wél
  door. Let op de valkuil die daarbij opdook: AI Studio maakt een *nieuw*
  project aan, dat dezelfde naam kan krijgen als een bestaand project met een
  ander id — de cap die je denkt te hebben ingesteld staat dan ergens anders.
- **503** — het verzoek is geaccepteerd, Google heeft het alleen even te druk.
  Op de gratis laag van Flash komt dat regelmatig voor.

**Beslissing.** Bij een 403 noemt de melding nu die twee oorzaken en waar je ze
controleert. Een 503 wordt stil tot twee keer opnieuw geprobeerd (1,2s en
3,5s) voordat de melding verschijnt. Alléén bij 503: een 429 is een limiet en
die los je niet op door harder te vragen, en een 4xx wordt niet vanzelf beter.
De teller loopt alleen op bij een geslaagde call, dus herkansingen tellen niet
mee.

**Bestanden.** `index.html` — `_aiParseErrorResponse()`, `callGemini()`.

**Niet doen.** Hetzelfde in `_streamGemini()` proberen zonder na te denken: die
levert de tekst stukje bij beetje aan de wekelijkse review, en halverwege
opnieuw beginnen betekent dat je het begin twee keer ziet.

## 2026-09-07 · Oude facturen: handmatig én inscannen

**Probleem.** De administratie van dit jaar liep niet gelijk met de app: er
staan facturen van vóór ingebruikname buiten de app. Zolang die er niet in
staan kloppen het btw-overzicht, de omzet en de debiteuren niet.

**Beslissing.** Twee ingangen in het ⋯-menu van Facturen, met één formulier
eronder.

1. **Oude factuur toevoegen** — nummer, datum, klant, betreft, bedrag excl.
   btw, btw-tarief, verstuurd op, betaald op. Bewust géén factuureditor: daar
   horen sjabloon, regels, PDF en mailen bij, en niets daarvan geldt voor een
   factuur die al bestaat en al verstuurd is. Er komt één regel op met het
   bedrag; dat is genoeg voor alles wat de app ermee rekent.
2. **Factuur inscannen** — PDF of foto erin, Gemini leest nummer, datum,
   klant, betreft, bedrag en btw eruit en vult hetzelfde formulier vast in. Je
   ziet elk veld en drukt zelf op Opslaan; bovenaan staat uit welk bestand het
   komt en welke tenaamstelling er op de factuur stond.

Details die ertoe doen:
- **Het nummer wordt meteen vastgezet** (`nummerVast`), anders trekt de app er
  bij een volgende actie een nieuw nummer overheen uit haar eigen reeks.
- **Zonder betaaldatum komt hij als openstaand bij Debiteuren.** De app leidt
  "betaald" af uit de betalingen, niet uit de status, dus de betaaldatum maakt
  een echte betaalregel voor het volle bedrag.
- **Valt de datum in een afgesloten kwartaal**, dan waarschuwt het formulier
  dat het btw-overzicht van dat kwartaal met terugwerkende kracht verandert.
- `f.extern=true` markeert een vastgelegde factuur: er hangt geen
  uren-administratie aan.
- **"Opslaan en volgende"** houdt klant, btw en datum vast — bij een stapel van
  dezelfde klant scheelt dat het meeste typewerk.
- Het document zelf wordt **niet** bewaard. Dat zou als base64 in het
  Drive-bestand belanden dat bij elke wijziging in zijn geheel wordt
  weggeschreven; twintig PDF's maken dat 4 MB zwaar. De originelen staan al in
  de mail of in een map.

`callGemini()` kan nu een bestand meesturen als `inline_data`. Flash leest een
PDF rechtstreeks, dus er is geen PDF-bibliotheek bij gekomen.

**Bestanden.** `index.html` — `#facOudModal`, `#facScanInput`,
`factuurOudToevoegen()`, `facOudNieuw/Render/Sync/Bewaar/Opslaan(Volgende)()`,
`facOudKwartaalWaarschuwing()`, `facScanKies/Lees/BestandNaarBase64/VraagGemini()`,
`callGemini({bestand})`, twee menu-ingangen.

**Bewezen.** De hele scanketen is getest met een vervangen `callGemini` — base64
zonder data-URL-prefix, mime-type, normalisatie van het bedrag naar Nederlandse
notatie met twee decimalen, klantmatch op id, en het formulier dat erna klopt.
Het opslaan is getest met een echte invoer: de factuur landde in de lijst, met
betaalregel, en de omzet-KPI liep mee.

**Niet doen.** Het ingelezen resultaat automatisch opslaan. Eén verkeerd
overgenomen bedrag zit anders meteen in een btw-aangifte.

## 2026-09-07 · Facturentabel: nummer past, betreft kapt af met een tooltip

**Probleem.** Drie dingen in dezelfde tabel, zichtbaar zodra er echte data in
zat.

1. Een nummer als `SB-2026-0002` is breder dan de kolom van 96px. `.fac-nr`
   had `white-space:nowrap` zonder `overflow`, en dan kapt er niets af — de
   tekst liep dwars over de datum ernaast heen.
2. Betreft is de enige kolom zonder vaste breedte en slokt dus alles op wat
   een breed scherm overhoudt. Op 1920px werd dat 640px: één lange regel dwars
   door de tabel, en op de korte regels een gat tussen de klant en de bedragen.
3. Andersom op een smal scherm: de zeven vaste kolommen zijn samen ruim 800px,
   dus bij `min-width:820px` hield Betreft nog geen 100px over — "POM Ge…".

**Beslissing.**
- De **nummerkolom past zich aan de reeks aan**: `nrTekens*8.5+30`, ondergrens
  7 tekens, bovengrens 190px. Een vaste breedte gokt, en die gok is fout zodra
  er een andere nummerreeks bij komt (self-billing, een tweede administratie).
  Plus `overflow:hidden`/ellipsis als vangnet.
- De kaart houdt op met meegroeien boven **1400px**; de ruimte komt náást de
  tabel in plaats van erin.
- `min-width` van de tabel van 820 naar **1080px**, zodat Betreft minstens
  ~250px houdt en de kaart daaronder zijwaarts schuift (`overflow-x:auto`)
  in plaats van de tekst plat te drukken.
- **Eén regel met een ellipsis plus een `title`**, niet twee regels. Een tabel
  leest op gelijke rijhoogtes; deze heeft al twee kolommen met een bijregel
  (Vervalt, Status), en een derde kolom die soms één en soms twee regels hoog
  is maakt het ritme onrustig. De volledige tekst zie je door erop te wijzen —
  ook op de klantnaam en het nummer, die om dezelfde reden afkappen.

**Bestanden.** `index.html` — `.fac-nr`, `.fac-table`,
`#mod-facturen .uren-sheet-card`, de drie tabellen die `.fac-betreft`
gebruiken (facturen, debiteuren, btw).

**Niet doen.** Betreft over twee regels zetten zonder de rijhoogte vast te
zetten: dan wordt elke rij een andere hoogte en oogt de tabel rommeliger dan
met een afgekapte regel.

## 2026-09-07 · Elke tegel zegt of het bedrag in- of exclusief btw is

**Probleem.** Frank vroeg of de berekening wel klopte: Omzet € 118.944,39,
Openstaand € 33.661,47, Betaald € 110.261,24. Die tellen niet op zoals je
verwacht — tot je weet dat **Omzet exclusief btw is en de andere twee
inclusief**. Alleen bij Omzet stond dat erbij.

Nagerekend: betaald + openstaand = € 143.922,71, en omzet × 1,21 =
€ 143.922,71. Klopt tot op de cent. Het was dus een leesprobleem, geen
rekenprobleem — maar wel eentje dat je aan je eigen cijfers laat twijfelen,
en dat is erger dan een lelijke tegel.

**Beslissing.** De bijregel van élke tegel met een bedrag begint met de basis:
`incl. btw · 3 facturen onbetaald`, `incl. btw · 20 facturen`. Ook de vijf
ouderdomstegels bij Debiteuren, want die staan straks naast een tegel "Omzet"
die excl. btw is. Omzet houdt `excl. btw · verstuurd en betaald`.

**Waarom niet alles gelijktrekken naar excl.** Openstaand en Te laat zijn wat
de klant nog moet overmaken; dat bedrag stáát inclusief btw op de factuur.
Daar excl. van maken zou een getal opleveren dat nergens terugkomt.

**Nog een keer, want de eerste poging was niet genoeg.** Met alleen "incl.
btw" erbij bleef de vraag staan: Betaald € 110.261,24 *inclusief* is minder
dan Omzet € 118.944,39 *exclusief*, en dat kan niet. Het kon wél, want het zijn
verschillende verzamelingen: Omzet dekt alle 23 verstuurde en betaalde
facturen, Betaald alleen de 20 die binnen zijn. Voluit:

| | excl. btw | incl. btw |
|---|---|---|
| 20 betaald | 91.125,00 | 110.261,24 |
| 3 openstaand | 27.819,39 | 33.661,47 |
| 23 totaal | **118.944,39** | 143.922,71 |

De strip toont dus drie cellen uit verschillende hoeken van die tabel. Daarom
staat nu ook het **aantal** in de bijregel: `23 facturen` bij Omzet en
`20 van 23 facturen` bij Betaald. Dan zie je dat het over minder facturen gaat
in plaats van te denken dat de btw de verkeerde kant op staat.

Bewust niet alles gelijkgetrokken: omzet hoort exclusief btw (dat is wat in je
resultatenrekening staat) en openstaand inclusief (dat is wat de klant
overmaakt). Ze horen niet op te tellen; ze horen alleen niet te suggereren van
wel.

**Bestanden.** `index.html` — `facRenderKpis()`, `facRenderDebiteuren()`.

## 2026-09-07 · Cijfers achter één balk op élk factuur-tabblad, en één kolombreedte

**Probleem.** Drie dingen die samenhangen.

1. De uitklapbalk stond alleen op Debiteuren. Op de andere tabbladen kwamen de
   cijfers nog steeds als eerste in beeld, terwijl je een tabblad opent om een
   factuur te zoeken en niet om naar een tegel te kijken.
2. De tegels stonden in de **topbalk** (`#facKpis`) en de tabel in de
   **inhoud** (`.uren-content`). Twee containers, en toen de tabel een
   `max-width` kreeg liep de balk erboven wél door tot de rand en de tabel
   niet. Frank markeerde precies dat gat: *"Het moet wel mooi uitgelijnd zijn
   als er zaken van dezelfde breedte onder elkaar staan."*
3. `SB-2026-0002` paste in geen van de vier factuurtabellen in de
   nummerkolom — elke tabel had zijn eigen vaste breedte (96, 104, 114, 118px).

**Beslissing.**
- `facCijferBalk()` bouwt de balk op één plek en `facRenderBody()` zet hem voor
  élke weergave. `facKpiTegels()` levert de tegels als HTML in plaats van ze in
  de topbalk te schrijven; Debiteuren heeft zijn eigen set
  (`facDebiteurenTegels`). De btw-weergave heeft geen tegels en dus ook geen
  balk. Wat de balk dicht toont is een **aantal**, nooit een bedrag — dat staat
  verderop toch al.
- De `max-width` staat op de **kolom** (`#mod-facturen .uren-content`), niet op
  losse kaarten. Alles in die kolom deelt daarmee dezelfde linker- én
  rechterrand: balk, tegels, tabel, knoppen.
- `facNummerBreedte(lijst)` berekent de nummerkolom uit de langste nummerreeks
  en wordt door alle vier de tabellen gebruikt.

**Wat er onderweg misging, als waarschuwing.** Bij het verplaatsen van de
tegels bleef `const som` achter in `facRenderDebiteuren` terwijl de tabel eronder
hem nog gebruikte: `ReferenceError`, `facRenderBody` brak af, en het scherm
bleef de vórige weergave tonen — het tabblad lichtte wél op. Dat ziet er niet
uit als een fout maar als "de tab doet niets". Alleen de console verried het.
Sindsdien wordt elke weergave op `Uncaught` gecontroleerd, niet alleen op het
oog. Tweede misser: de tegels kwamen zonder rasterwikkel terug en vielen op een
telefoon onder elkaar — zichtbaar op 375px, niet op 1700px.

**Bestanden.** `index.html` — `facRenderKpis/facKpiTegels/facKpiRaster/
facDebiteurenTegels/facCijferBalk/facCijferSamenvatting/facNummerBreedte`,
`facRenderBody`, `#mod-facturen .uren-content`, `.fac-cijfers-blok`, de
kolomkoppen van vier tabellen, en het kopje van een KPI-tegel dat op mobiel mag
afbreken.

**Niet doen.** De `max-width` op een kaart zetten in plaats van op de kolom.
Dan lijnt die kaart niet meer uit met zijn buren, en dat valt precies zo op als
hier gebeurde.

## 2026-09-07 · Elke cijferstrip is een uitklapbalk, uit één functie

**Beslissing.** Wat op Facturen stond geldt nu ook voor Uren: de tegels zitten
achter een balk die je opentikt, standaard dicht. Frank: *"Maak van elke KPI
balk maar een uitklapbaar onderdeel. Ik vind het wel strakker eruit zien."*

De balk wordt door beide modules uit dezelfde functie opgebouwd
(`cijferBalk(open,sam,laat,actieAttr,tegels)`) — anders lopen twee kopieën
binnen een maand uiteen, zoals eerder met het ⋯-icoon en de filterknop
gebeurde. Alleen de dispatcher verschilt (`data-uren-action` tegenover
`data-fac-action`), en die gaat als attribuut mee.

Wat de balk dicht toont is een **aantal**, nooit een bedrag of een totaal: dat
staat verderop op de pagina toch al. Uren toont *"2 registraties · 2 klanten ·
1 te factureren"*, Facturen *"23 facturen · 3 onbetaald"*.

Open of dicht staat per module in `localStorage` onder één sleutel
(`herling_cijfers`, een object met `uren` en `facturen`). Het is een
kijkvoorkeur van dit apparaat en geen administratie. De losse sleutel
`herling_deb_cijfers` is daarmee vervallen.

Meegenomen: de tegels van Uren stonden in de topbalk en de tabel in de inhoud —
twee containers die nooit gegarandeerd konden uitlijnen. Ze zitten nu allebei
in `.uren-content`.

**Bestanden.** `index.html` — `cijfersOpen/cijfersZet/cijferBalk`,
`urenCijfersOpen/urenToggleCijfers/urenKpiTegels/urenCijferBalk`,
`urenRenderKpis` (leegt alleen nog de oude plek), `urenRenderBody`,
`facCijferBalk` (gebruikt nu de gedeelde functie).

## 2026-09-07 · Nieuwe taak op een telefoon: één kolom, grote kalender

**Probleem.** Het venster hield op een telefoon de twee kolommen van het
bureaublad aan: 170px voor de keuzes, de rest voor de kalender. Wat daarvan
overbleef was een kalender van 150px met **dagvakjes van 15,4px** — ver onder
de 44px die je moet kunnen raken, en het lastigste onderdeel van het hele
venster. Tegelijk namen drie prioriteitsknoppen ónder elkaar bijna 170px in
beslag voor een keuze uit drie, en liep een lange klantnaam over drie regels
waardoor die ene knop drie keer zo hoog werd als de rest.

**Beslissing.** Op mobiel alles onder elkaar, met de ruimte anders verdeeld:

| | was | wordt |
|---|---|---|
| prioriteit | drie knoppen onder elkaar, ~170px | één rij van drie, 44px |
| deadline | 150px breed, vakjes 15,4px | volle breedte, vakjes **38,4px** |
| klant | één per regel, lange naam over 3 regels | twee naast elkaar, naam kapt af |
| herhaling-hint | vier regels | één regel |

Volgorde: omschrijving → prioriteit → deadline → klant → herhaling. De
linkerkolom lost op met `display:contents !important` (het element draagt een
inline `display:flex` en die wint van elke selector zonder `!important`),
zodat prioriteit en klant losse blokken worden die met `order` te verplaatsen
zijn.

**Gemeten.** Het venster is **747px hoog, vóór én na** — precies wat Frank
vroeg: dezelfde ruimte, strakker ingericht. De kalender is 2,5 keer zo groot.

**Bureaublad blijft zoals het was**; alleen de klantnaam kapt daar nu ook af
(de knoppen zijn daardoor even hoog) en de hint bij Herhaling is korter.

**Bestanden.** `index.html` — haken `.cl-taak-grid/-links/-prio/-klant/-cal/
-herhaal` en `.cl-pri-rij` in de opmaak, een mobiel blok dat ze herschikt,
`.nm` in `renderClClientBtns()`.

**Niet doen.** De dagvakjes kleiner maken om het venster korter te krijgen.
Dat vakje is precies waar je op moet tikken.

## 2026-09-07 · Klant kiezen in het taakvenster is ook een uitklaplijst

Doorgetrokken van 2026-09-07 (het urenvenster): wat uit een lijst komt die met
de administratie meegroeit hoort in een `.klantkies` — stipje plus `<select>`
— en niet in een rij knoppen. In het taakvenster kostte die rij vijf regels,
of een schuifbalkje van 130px zodra je meer dan drie klanten hebt.

Meegenomen: het klantveld stond op `flex:1` en rekte mee met de hoogte van de
kalender ernaast. Als rij knoppen viel dat niet op; met één regel bleef er
lucht onder staan.

**Bestanden.** `index.html` — `renderClClientBtns()`, `#clClientBtns` krijgt
`.klantkies`, de mobiele twee-koloms-regels en de dode dispatcher
`selectClClient` weg.

**Wat er misging.** Ik wilde ook het veld Herhaling naar de keuzekolom
verplaatsen om een gat op het bureaublad te sluiten, en knipte met een regex
één `</div>` te veel weg. `validate.mjs` gaf gröen — die telt tags over het
hele bestand, en er ging er één weg die elders werd ingehaald. Alleen het
teruglezen van de opmaak liet het zien. Teruggedraaid met `git checkout` en de
rest opnieuw toegepast; de div-balans is daarna vergeleken met de commit en is
identiek. Les: bij het verplaatsen van een blok in de opmaak niet op een regex
vertrouwen maar het resultaat teruglezen — en de balans vergelijken met HEAD,
niet alleen met nul.

## 2026-09-07 · Herhaling hoort in de keuzekolom

Het veld Herhaling was de derde cel van een raster van twee kolommen en
belandde daardoor in rij 2, ónder de kalender. Rij 1 is zo hoog als die
kalender, dus tussen Klant en Herhaling stond zo'n 160px niets. Dat viel niet
op zolang de klantenlijst een rij knoppen met een schuifbalkje was; met één
uitklaplijst bleef het over.

Herhaling staat nu als laatste kind ín `.cl-taak-links`. Op mobiel verandert er
niets: die kolom staat daar op `display:contents`, dus het blijft een los blok
met zijn eigen `order`.

**Deze keer met een gerichte bewerking**, niet met een regex — zie de vorige
entry voor waarom. Achteraf de opmaak teruggelezen en de div-balans vergeleken
met HEAD: 930 open, 928 gesloten in beide, dus identiek.

**Bestanden.** `index.html` — `#clItemModal`.

## 2026-09-07 · Zijbalk: strepen in plaats van kopjes

**Probleem.** De zijbalk had twee kopjes: "Navigatie" en "Administratie".
Het eerste vertelt boven een navigatiemenu dat het een navigatiemenu is. Het
tweede klopte niet helemaal: Externe tools stond eronder en dat is geen
administratie maar een link naar buiten. Frank: *"Navigatie en Administratie is
niet echt een goede verdeling."*

**Beslissing.** De woorden eruit, de groepering houden met een dunne streep:
Dashboard/Notities/Checklist — Uren/Facturen — Externe tools.

**Waarom niet één doorlopende lijst.** Het verschil tussen "een notitie
schrijven" en "een factuur versturen" is echt: bij de tweede groep moet het
kloppen. Een streep zegt dat zonder een woord te gebruiken dat voor een van de
items niet waar is. Elk alternatief woord liep daarop stuk — "Werk" boven
Dashboard klopt niet, want dat is juist het overzicht over allebei.

Bijkomend: bij een ingeklapte zijbalk werden die kopjes onzichtbaar
(`opacity:0`) maar hielden ze hun ruimte. Een streep werkt in beide standen.

**Bestanden.** `index.html` — `.sidebar-sec-lijn`, de twee
`.sidebar-sec-label`-regels uit de zijbalk. `.sidebar-sec-label` blijft in de
CSS staan: hij wordt elders nog gebruikt.
