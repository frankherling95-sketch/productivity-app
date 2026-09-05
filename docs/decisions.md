# Beslissingen-log

Append-only log van significante design-, architectuur- en UX-beslissingen.

**Hoe te gebruiken**:
- Nieuwste entries bovenaan
- **Nooit oude entries wijzigen** — append-only. Als een beslissing achterhaald raakt: voeg een nieuwe entry toe die de oude vervangt en verwijs ernaar.
- Kort houden: 5–10 regels per entry. Voor diepe duiken: link naar `docs/<module>.md` of een commit-hash.
- Format: `## YYYY-MM-DD · Korte titel`, daarna *Probleem / Beslissing / Waarom / Bestanden / Niet doen*.

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
