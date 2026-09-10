# Herling Analytics — Productivity App

Single-page productivity app voor Frank Herling. Single-file HTML SPA, gehost op GitHub Pages.
Toegang via Google-login (Workspace-domein `herling-analytics.nl`), data in Google Drive `appDataFolder`.

## Snel oriënteren

- **Repo**: `frankherling95-sketch/productivity-app` · branch `main`
- **Live URL**: https://app.herling-analytics.nl (eigen domein via GitHub Pages)
- **Auto-deploy**: elke push naar `main` → Pages-build (~30s)
- **Hoofd-bestand**: `index.html` (~580KB, ~12k regels) — alles inline, geen build step
- **Beslissingen-log**: zie [`docs/decisions.md`](docs/decisions.md) — waarom keuzes gemaakt zijn (lees vóór je iets ongedaan maakt)

## Wie is de gebruiker

- **Eén gebruiker, één omgeving tegelijk.** Frank werkt vanuit meerdere computers, maar nooit tegelijkertijd.
- **Taal: Nederlands** (UI én commit messages)
- **Achtergrond**: data analytics — comfortable met SQL, Python, data structuren

## Bestanden

```
.
├── index.html   ← DE app (alle wijzigingen hier)
├── herling_analytics_home.html, bi_checklist_kanban.html  ← redirect-stubs (oude URLs)
├── herling-icon.svg              ← logo + favicon
├── manifest.json, sw.js          ← PWA + Service Worker (zie ⚠️ hieronder)
├── CLAUDE.md                     ← dit bestand
├── docs/decisions.md             ← append-only beslissingen-log (ADR-stijl)
├── docs/stijlgids.md             ← welke maat hoort waar (lees dit vóór je iets vormgeeft)
├── docs/mobile.md                ← de mobiele schaal en de regels erachter
├── validate.mjs                  ← Node syntax/structure checker
├── parallel-check.mjs            ← bewaakt de moduleverdeling bij parallel werk
├── test.html                     ← browser smoke test
├── .githooks/pre-push            ← git hook (na `core.hooksPath` setup)
└── .claude/                      ← Claude Code config + hooks
    ├── ownership.json            ← wie bezit welk stuk index.html (bron voor parallel-check)
    ├── agents/                   ← één definitie per spoor (worktree-geïsoleerd)
    ├── commands/                 ← /parallel-fanout, /parallel-merge, /parallel-setup
    └── skills/vormgeven/      ← werkwijze bij vormgeefwerk (triggert vanzelf)
```

## Modules (hash routing)

| Hash | Module | Functie |
|------|--------|---------|
| `#dashboard` | Dashboard | Hero + KPI strip + kaartenraster (Notes/Checklist) |
| `#todo` | Kanban | Projecten met kolommen, kaarten met klant/tags/category, drag-drop |
| `#notes` | Notes | Boomstructuur (folders/pages) met rich-text editor (marked.js) |
| `#checklist` | Checklist | Taken met subtaken, filters (prio/klant/periode), vastpinnen, drag-drop, archief |
| `#uren` | Uren | Urenregistratie per regel, week/maand, Excel export |
| `#facturen` | Facturen | Facturen uit geschreven uren, sjabloonbouwer, debiteuren, btw-overzicht, mailen via Gmail, analyse |

Entry render functions: `renderDashboard()`, `renderTodoModule()`, `renderNotesModule()`, `renderChecklistModule()`, `renderUrenModule()`, `renderFacturenModule()`. `renderAll()` wordt aangeroepen na elke `loadGist()`.

## State & persistence

```js
rawState = {
  tasks:    kanbanState,     // {projects, activeProject, clients, tags, categoryGrouping}
  notes:    notesState,      // {tree, activeId, collapsed, clientGroupCollapsed, recentIds, sortBy, prullenbak, verborgenKlanten}
  checklist: checklistState, // {items, showArchived, sortBy, groupByPriority}
  uren:     urenState,       // {entries, templates}
  // agenda: verwijderd 2026-09-06; oude events blijven ongemoeid in Drive staan
  settings: { calSources, theme, ... }
}
```

**Item shapes** (snelle referentie):
- Kanban item: `{id, title, clientId, category, context, tags[], createdAt, updatedAt}`
- Checklist item: `{id, text, done, priority, deadline, clientId, subtasks[], archived, sortOrder, pinned}`
- Notes node (recursief): `{id, type:'page'|'folder', title, content, clientId, tags, children[]}`
- Klant: `{id, name, colorIdx}`

### Storage keys

| Constant | Doel |
|----------|------|
| `DRIVE_BESTAND` = `herling-analytics.json` | Bestand in Drive `appDataFolder` |
| `LS_LOGIN` = `herling_login` | Ingelogde gebruiker (e-mail + geldigheid) |
| `LS_BACKUP_KEY` = `herling_analytics_local_backup` | Volledige rawState backup |
| `LS_SYNC_KEY` = `herling_analytics_sync` | `gewijzigdOp`/`naarDriveOp` (lokale klok) + `driveTijd` (server-klok) |
| `LS_HERSTEL_KEY` = `herling_analytics_herstel` | Niet-gekozen versie na een conflict; zichtbaar in Instellingen → Versiegeschiedenis, of `herstelDownload()` |

### Save flow

De functienamen zijn historisch (`loadGist`/`saveGist`/`refreshGist`); ze praten met Google Drive, niet met GitHub.

1. State-mutatie → `scheduleSave()` → direct naar `localStorage` (vangnet) → 1500ms debounce → `saveGist()`
2. `saveGist()` is een wrapper met in-flight guard; het echte werk zit in `saveGistIntern()`. Er loopt er **hooguit één tegelijk** — een verzoek dat ondertussen binnenkomt wordt na afloop één keer ingehaald
3. Geschreven wordt het hele bestand, zonder merge (single-user). Wél wordt Drive's `modifiedTime` onthouden, zodat de volgende start weet of Drive sindsdien veranderd is
4. Bij een fout: de melding komt één keer, de wijziging staat lokaal en een herkansing loopt met backoff (5s/15s/60s/180s)
5. Bij een laadfout: terugvallen op de lokale back-up. `driveGelezen` wordt daarbij **niet** gereset — is Drive deze sessie al gelezen, dan blijft schrijven veilig
6. `beforeunload` en `visibilitychange` flushen pending saves
7. Ophalen gaat vanzelf: `autoSyncKijk()` controleert goedkoop (alleen metadata) of Drive is veranderd en roept dan pas `loadGist()` aan — zie "Recent gemaakte beslissingen"
8. Er wordt niets meer versleuteld weggeschreven — de pincode is afgeschaft (2026-08-16). Ligt er nog een oud `rawState.geheim` in Drive, dan wordt dat één keer uitgepakt (vanzelf met de bewaarde apparaatsleutel, anders met de code) en daarna definitief plat opgeslagen; zie `pinVersleutelingWeg()`

⚠️ **De poort `geheimenKlaar()`**: zolang dat oude blok nog dicht is, is `factuurState`/`urenState` leeg. Zolang de poort dicht is mag niets die state wegschrijven — anders wist een lege state de administratie in Drive. Zie de entries van 2026-08-12 en 2026-08-16 in `docs/decisions.md`.

### Migratie functies

Bij toevoegen van een nieuw state-veld: voeg een hydratie-stap toe in `hydrateerState()` (zoek `if(!checklistState.items)` als voorbeeld) — dat is het enige laadpad.

> Er staan er nu geen meer. `migrateOldKanban(loaded)` werd nergens aangeroepen en is verwijderd (2026-08-21); `migrateCalSettings()` verdween met de agenda-module (2026-09-06).

### State in `rawState` zetten

`verzamelModuleState()` kopieert de losse module-states terug in `rawState`; `huidigeStateSnapshot()` doet dat en geeft `rawState` terug. **Nieuwe module erbij? Zet hem in `verzamelModuleState()`** — wat daar niet in staat gaat niet naar Drive en niet in de back-up.

## UX-systemen

| Systeem | Doel |
|---------|------|
| `setSync(type, msg)` | Status-balk in sidebar (`idle\|saving\|saved\|error`) |
| `appToast(msg, opts)` | Floating toast met optionele undo-knop |
| `updateNavBadges()` | Tellingen naast de nav-items (Checklist, Uren, Facturen) |
| Undo systeem | Verwijderacties tonen toast met "Ongedaan maken" |

## Theme

- `auto` (default, volgt `prefers-color-scheme`), `light`, `dark`, `schedule`
- Manual: `:root[data-theme="..."]`
- Voorkeur in `rawState.settings.theme`

**Font tokens**: `--font-display` (koppen), `--font-body` (tekst),
`--font-cijfer` (álle getallen — is de body-letter; uitlijnen doet
`tabular-nums`), `--font-mono` (alleen echte code: codeblok, kbd, pincodeveld).

**Color tokens**: `--navy #0F1B3D`, `--navy-dark #0A1330`, `--teal #0D3D3A`, `--mint #00E5B0`, plus `--bg/--surface/--text/--border/--accent/--danger` etc. Volledige set in regels 798–893.

## Mobile

- **Breakpoint**: `@media (max-width: 768px)`
- Bottom tab-bar (`#mobileNav`), sidebar als drawer, full-width modals, compactere topbars

## CSS conventies

Class-prefix per module: `.cl-` checklist, `.dash-` dashboard, `.col-` kanban, `.note(s)-` notes, `.uren-` uren, `.modal-`, `.btn-`, `.toast-`, `.nav-`, `.mod-` (generiek). Geen utility-classes, geen `!important` tenzij echt nodig.

⚠️ **Ga je iets vormgeven — een knop, een menu, een kaart, een pil — gebruik dan
de skill [`vormgeven`](.claude/skills/vormgeven/SKILL.md).** Die bevat de hele
werkwijze: eerst [`docs/stijlgids.md`](docs/stijlgids.md) lezen (per soort
onderdeel de maat, het gewicht en het token, plus de bekende afwijkingen),
aansluiten bij de bestaande CSS-regel in plaats van een eigen blok schrijven,
op 375px én desktop meten met `getComputedStyle`, en voor/na laten zien.

De app bestaat voor een groot deel uit dezelfde soort knop met een andere
tekst. Een eigen blok in plaats van aansluiten is hoe het ⋯-icoon drie
verschillende maten kreeg en de filterknop twee.

## Dependencies (CDN)

| Library | Doel |
|---------|------|
| `xlsx` (unpkg) | Excel export (Uren module) |
| `marked` (jsdelivr) | Markdown rendering (Notes) |
| Google Fonts | `Archivo, Inter, Plus Jakarta Sans, JetBrains Mono` |

Bij CDN-falen: app crasht niet hard, alleen die feature werkt niet (Excel-export uit, Notes ruwe markdown).

## Hard conventies

- **Geen externe build step** — alles inline.
- **Vanilla JS** — geen frameworks (jQuery/React/Vue NIET).
- ⚠️ **Service Worker bestaat (`sw.js`)** — het document (`index.html`) gaat **netwerk eerst** met cache als offline-terugval; de rest is stale-while-revalidate. Bump `CACHE_NAME` bij een release. Na het uitrollen van een gewijzigde `sw.js` is er nog één extra reload nodig voordat de nieuwe worker het overneemt.
- **Geen analytics, geen cookies**. Alle data privé in Drive + localStorage.
- **Drag-and-drop**: HTML5 native (`draggable="true"`).
- **Token-format**: `ghp_`/`github_pat_`/`gho_` prefixes; `sanitizeToken()` strips zero-width chars.
- **Browser-support**: modern Chromium / Firefox / Safari, ES2020+.

## Workflow

```bash
# Voor elke wijziging:
git fetch origin main
git log HEAD..origin/main --oneline    # MOET LEEG ZIJN, anders pull eerst
grep -n "<symbol>" index.html   # check refs voor je iets wijzigt

# Edit index.html
node validate.mjs                       # MOET groen zijn

git add index.html
git commit -m "Korte Nederlandse beschrijving"
git push origin main                    # pre-push hook draait validate
```

Daarna: vraag Frank om **Ctrl+Shift+R** op de live site. Optioneel `test.html` draaien voor de smoke- en synctests (via een lokale server, niet via `file://`).

**Branches**: voorkeur is direct naar `main`, maar **PRs zijn toegestaan** voor grotere/risicovolle wijzigingen (`gh pr create` of via web UI).

## Module ownership

Voor parallel werk: meerdere agents tegelijk aan verschillende modules. Alles zit
in één bestand, dus de grens is een **naamgrens**, geen bestandsgrens. De
machineleesbare bron is [`.claude/ownership.json`](.claude/ownership.json); deze
tabel is de leesbare versie. Wijzig ze samen.

| Spoor | JS | CSS | Markup |
|-------|-----|-----|--------|
| `dashboard` | `dash*`, `renderDashboard` | `.dash-` | `#mod-dashboard` |
| `notes` | `note*`, `notes*`, `*Note*` | `.note`, `.notes-` | `#mod-notes` |
| `checklist` | `cl` + hoofdletter, `*Checklist*`, `*Subtask*` | `.cl-`, `.cl2-` | `#mod-checklist` |
| `uren` | `uren*`, `_uren*` | `.uren-` **minus de 42 gedeelde** | `#mod-uren` |
| `facturen` | `fac*`, `_fac*`, `factuur*` | `.fac-` | `#mod-facturen` |

`#mod-todo` (Kanban) heeft te weinig eigen code voor een eigen spoor en valt onder
de coördinator.

### Regels

- Elke agent schrijft uitsluitend binnen zijn eigen signalen. Lezen mag overal.
- Wijzigingen in gedeelde ankers worden **niet** doorgevoerd maar gerapporteerd
  als contractverzoek aan de coördinerende sessie.
- Een nieuw state-veld is een contractwijziging (`hydrateerState()` en
  `verzamelModuleState()` zijn gedeeld) — eerst aanvragen, niet zelf toevoegen.
- Geen nieuwe dependencies. Geen `git push` vanuit een spoor.
- `docs/decisions.md` en `sw.js` schrijft alleen de coördinator, ná de merge.
  Beide hebben één regel waar iedereen tegelijk wil zijn.

### ⚠️ De 42 gedeelde `.uren-*` regels

Facturen leent 42 van de 101 `.uren-*` CSS-regels — samen 150+ voorkomens in die
module (`uren-btn`, `uren-fld`, `uren-kpi`, `uren-tabs`, `uren-menu-item`, …).
**Wie er één wijzigt, wijzigt twee modules, en git laat geen conflict zien.** Ze
staan daarom op de gedeelde lijst en zijn voor beide sporen op slot. De 59
Uren-eigen regels (`.uren-kal-*`, `.uren-tpl-*`, `.uren-mpiv-*`, `.uren-row`, …)
mag het uren-spoor wel vrij vormgeven.

### Werkwijze

```bash
/parallel-fanout uren facturen     # start de sporen parallel in eigen worktrees
/parallel-merge uren facturen      # controleren, samenvoegen, bewijzen dat het heel is
/parallel-setup                    # de verdeling herijken als de code verschoven is
```

Controle met de hand:

```bash
node parallel-check.mjs kaart              # hoe is index.html nu verdeeld
node parallel-check.mjs scope <spoor>      # blijft dit spoor binnen zijn grenzen
node parallel-check.mjs overlap            # botsen de sporen onderling
node parallel-check.mjs merge              # na het samenvoegen
node parallel-check.mjs stijl              # berekende stijlen voor/na, 4 combinaties
```

Exit 0 = schoon · 1 = fout (buiten de scope geschreven) · 2 = alleen
contractverzoeken.

De vergelijking gaat altijd tegen het **splitspunt** van het spoor, niet tegen de
tip van `main`. Loopt een spoor achter, dan zou dat laatste al het werk van
anderen als wijziging van dít spoor tonen — in spiegelbeeld, dus als "buiten je
scope geschreven".

⚠️ **Agent-definities worden bij sessiestart ingelezen.** Maak of wijzig je
`.claude/agents/*.md`, dan kent de Agent-tool die naam pas in een nieuwe sessie.

## Common patterns

**Nieuwe modaal**: `<div class="modal-bg" id="<naam>Modal"><div class="modal">...</div></div>` + `openXModal()`/`closeXModal()` JS functies. CSS classes bestaan al.

**Actie aansluiten op een dispatcher**: ⚠️ de argumentvolgorde verschilt per
tabel. Zoek de echte aanroepregel op vóór je registreert — de vorm van een
naburige registratie overnemen is hoe op 2026-09-10 drie change-handlers stil
faalden.

| Tabel | Attribuut | Aanroep |
|---|---|---|
| `APP_ACTIONS` (klik) | `data-action` | `fn(el, e, arg1, arg2, arg3)` |
| `APP_CHANGE_ACTIONS` | `data-change` | `fn(el, e, arg1, arg2, arg3)` |
| `UREN_CLICK_ACTIONS` | `data-uren-action` | `fn(arg1, arg2, e, el)` |
| `UREN_CHANGE_ACTIONS` | `data-uren-change` | `fn(el, arg1, arg2)` |
| `FAC_CLICK_ACTIONS` | `data-fac-action` | `fn(arg1, arg2)` |
| `FAC_CHANGE_ACTIONS` | `data-fac-change` | `fn(el, arg1, arg2)` |

Test daarna via de **échte gebeurtenis** (een `change` op het element), niet
door de functie rechtstreeks aan te roepen — dat slaat juist de bedrading over
waar de fout zit.

**Nieuw state-veld**: voeg toe aan initiële state, dan hydratie-stap in `hydrateerState()`. `saveGist()` neemt rawState in zijn geheel mee.

**Nieuwe checklist filter**: voeg sleutel toe aan `clFilters`, render-knop in `renderClFilterBar()`, filter-logica in `renderChecklistModule()`.

**Nav-badge updaten**: `updateNavBadges()` aanroepen na state-mutatie + ID + telling toevoegen aan de functie zelf.

## Bekende valkuilen

| Probleem | Oplossing |
|----------|-----------|
| Subtaak verschijnt dubbel | Guard met `if(clAddingSubtaskFor!==itemId)return;` aan top van `commitSubtaskInput` |
| "Ik zie de oude versie" | Sinds v9 is het document netwerk-eerst, dus dit hoort niet meer voor te komen. Eén keer herladen na een `sw.js`-wijziging; blijft het hangen: DevTools → Application → Service Workers → Unregister + Clear site data |
| Force-push verwijdert remote commits | **Eerst altijd `git fetch && git log HEAD..origin/main`** |
| `.claude/worktrees/...` heeft een kopie | Negeren — staat in `.gitignore`, agent-isolatie |
| Maandweergave krap bij drukke dag | Klik op datum → daganzicht |

## Recent gemaakte beslissingen

Top-3 meest recent. Volledige log + *waarom* per beslissing: [`docs/decisions.md`](docs/decisions.md).

- **2026-09-10**: Zes dispatchers, vijf verschillende argumentvolgordes — `urenDispatchChange` geeft het element als eerste door en `urenDispatchClick` als laatste; drie change-handlers van de uren-import faalden daardoor stil. De tabel staat nu onder *Actie aansluiten op een dispatcher*, en `validate.mjs` toetst elke actienaam in de opmaak tegen zijn tabel. Die controle vond meteen `noteClearContent`: de knop "Inhoud legen" in de notitie-editor was nooit geregistreerd
- **2026-09-10**: Vijf facturen per verzoek bij het inscannen — de gratis laag telt verzoeken (5/min, 20/dag) en nauwelijks tokens (4.310 van 250.000 gebruikt). Zeven bestanden gaan nu in twee verzoeken. Terugkoppelen op de bestandsnaam en niet op de volgorde, want een overgeslagen document zou alles daarna bij de verkeerde factuur laten landen; wie niet terugkomt gaat één keer alleen. Ook: een 429 heet alleen nog een dagquotum als Google alléén dat noemt of langer dan een kwartier geduld vraagt — hij noemt in `details` vaak beide quota's, waardoor een minuutlimiet als "dagquotum op" verscheen
- **2026-09-09**: Eén meldingsblok met drie toestanden (`.fac-btw-let` + `.let-gelukt` / `.let-fout`) — een geslaagde scan stond in dezelfde amberkleur als de btw-waarschuwing eronder. Nu groen met een vinkje, mislukt rood met een uitroepteken, en de rode varianten niet meer als `border-left-color` in een style-attribuut. Het icoon staat in `1em` omdat het in een tekstregel staat; `--icoon` is de maat voor een raakvlak. Zie stijlgids §12
- **2026-09-09**: Analyse op een breed scherm — de grafiek vult zijn kaart (het plafond van 1100px op de tekenbreedte liet hem gecentreerd staan met lege randen), de tooltip staat naast de baan in plaats van erboven (hij dekte de kolom af waar je naar wees), de legenda staat er ook bij één reeks (anders zegt niets meer welke periode je ziet) en de maandlabels op mobiel worden vanaf achteren geteld zodat de laatste twee niet botsen. Tabvolgorde in Facturen volgt de gang van een factuur: Facturen · Debiteuren · Verzonden · Analyse · Klanten · Btw
- **2026-09-09**: Analyse — periode is een keuzelijst met boekjaren (zo ver terug als je administratie) in plaats van vier vaste knoppen, en de cijfertabel toont twee soorten groei naast elkaar: t.o.v. vorige maand en t.o.v. vorig jaar. Maanden die in beide periodes leeg zijn vallen weg, en een vergelijkingsperiode zonder omzet telt niet als vergelijking (geen grijze nulbalken, geen kolom met twaalf keer € 0,00). Op een telefoon is de tabel een lijst: zes kolommen passen daar niet en een zijwaarts schuivende tabel lees je niet
- **2026-09-09**: Doorklikken vanuit de analyse — elke kolom, elk punt op de cumulatieve lijn en elke klantbalk opent de facturen erachter, met hun regels en een klik naar de editor. De doorklik put uit dezelfde selectie als de grafiek (`rijen` uit `facAnData()`), zodat de lijst niet uit de pas kan lopen met de balk erboven. Het klikken op een klantbalk was een filter; filteren hoort in de filterrij, dus staat de klantkeuze nu ook op een bureaublad in de balk
- **2026-09-09**: De keuzes van de analyse zitten op een telefoon achter de trechterknop in de topbalk (zelfde plek en popover als elders); op een bureaublad blijft de brede balk onder de tabs. Beide staan in de DOM, de CSS kiest — zo hoeft een draaiend scherm niet op een hertekening te wachten
- **2026-09-08**: Analyse-tab in Facturen — omzet per maand tegen de vorige periode, cumulatief, en een ranglijst per klant, met een eigen periodekeuze (dit jaar / 12 maanden / vorig jaar / alles) die alles eronder aanstuurt. "Dit jaar" loopt t/m déze maand en vergelijkt met dezelfde maanden vorig jaar. Twee reeksen = nadruk, geen categorieën: huidige periode in kleur, vorige in grijs (`--gr-nu`/`--gr-vorig`, gevalideerd op kleurenblindheid). Doorbelaste facturen splits je uit naar eindklant via regels ("betreft bevat X → telt als Y") of het veld Eindklant op de factuur zelf, dat vóór de regels gaat
- **2026-09-08**: Eén mintknop in de voet van een factuur — op een verstuurde factuur is dat altijd "Betaling registreren" (Mailen is altijd secundair, betaald = geen mint). Het mint sprong eerder tussen die twee, afhankelijk van `gemaildOp`, en bij een factuur die je print komt dat moment nooit. De editor is meteen 1000px in plaats van 900: acht knoppen vragen 886px waar er 854 was, en de btw-kolom kapte af tot "21% (h"
- **2026-09-08**: Een vaste modelnaam is even breekbaar als een alias — na `gemini-flash-latest` (krapste gratis laag) sneuvelde ook `gemini-2.5-flash` ("no longer available to new users"). Nu een voorkeursvolgorde `GEMINI_TERUGVAL` met `gemini-3.5-flash` als standaard, en bij een 400/404 over een ingetrokken model stapt de app zelf over: `GET /v1beta/models` zegt wat déze sleutel mag, de keuze wordt onthouden en het verzoek gaat één keer opnieuw. Mee opgelost bij het inscannen: het denkdeel van een Gemini 3-model telde als antwoord (`thought:true`), "€ 1.234,56" werd NaN en dus een leeg bedrag, het mime-type was een gok, en een hangend verzoek gijzelde de stapel
- **2026-09-08**: Inleeslogboek bij de factuurscanner — `factuurState.scanLog` houdt per ingelezen bestand een SHA-256 van de **inhoud** bij, dus een hernoemde PDF wordt herkend vóórdat er een verzoek uitgaat. Dubbele komen wél in de stapel (je moet zien wat is overgeslagen) maar gaan niet naar Gemini; met een knop "toch inlezen". Gaat mee naar Drive, dus geldt op al je apparaten. Zichtbaar via Facturen → ⋯ → Inleeslogboek. Een logboekregel ís de bestaande `.uren-mcard`, geen nieuwe rijvorm
- **2026-09-08**: Snelheidsrem vóór het herhalen (`_geminiSlot()`) — het geduld van de vorige stap produceerde zélf 429's: vier pogingen per bestand × drie bestanden = twaalf verzoeken in een minuut. Er gaan er nu nooit meer dan `_geminiPerMin` in een voortschrijdende minuut uit; die rem stelt zichzelf bij (start 6, omlaag bij een 429, langzaam omhoog na successen) omdat de echte limiet per model verschilt. Ook: de badge telde alleen gelukte verzoeken, nu elke poging; en de 429-melding scheidt dagquotum van limiet-per-minuut. De scanwachtrij doet zes rondes over ruim een half uur, dus je kunt weglopen
- **2026-09-08**: 503 van Gemini geduldiger opgevangen — `_geminiFetch()` is nu de enige ingang (ook voor streaming, dat had géén herkansing) met vier pogingen die oplopen (2s/5s/12s) plus ruis, in plaats van 1,2s en 3,5s onder een melding die "probeer over een minuut opnieuw" zei. De scanwachtrij ademt tussen bestanden (700ms, 6s na drukte) en doet aan het eind één stille tweede ronde voor wat tijdelijk misging — behalve voor een fout die je al in beeld hebt gehad, want daar kan je eigen invoer in staan
- **2026-09-08**: Factuurscanner leest een stapel — `#facScanInput` staat op `multiple` en de bestanden gaan in `facScanRij`. Eén voor één gelezen (gratis laag = 15/min) door een lus die op de achtergrond doorloopt terwijl je de vorige nakijkt; kop telt mee, hoofdknop wordt "Opslaan en volgende", met "Overslaan" ernaast. Een te groot of mislukt bestand krijgt zijn eigen regel met "probeer opnieuw" en stopt de rest niet. Nakijken blijft bewust per factuur
- **2026-09-08**: Klantnamen gaan gemaskeerd naar Gemini — `aiMaskerder()` vervangt namen, contactpersonen, mailadressen, adressen en KVK/btw-nummers uit de klantenkaart door `{{KLANT_1}}`-tokens en zet ze lokaal weer terug. Aan bij "slim toevoegen" en de wekelijkse review (`maskeer:true`), uit bij de factuurscan: die stuurt een PDF en moet de namen juist kunnen lezen. Schakelaar in Instellingen. Geen slot — bedragen en omschrijvingen gaan onveranderd mee
- **2026-09-06**: Eén mobiele paginavorm — het ⋯-menu rechtsboven op de lijn van de moduletitel (44×44, `right:12px`) en een ronde + rechtsonder (56×56, `right:17px`) op élke module. Vastgezet met `position:fixed` op de knopwrapper, niet door in de DOM te verhuizen: de menu's hangen aan hun eigen dispatcher en volgen zo vanzelf. Zelfde ronde: modalkoppen over de volle breedte en leesbare statuspillen daarop
- **2026-09-06**: Nooit twee keer hetzelfde getal in beeld — de filtertelling alleen nog bíj een actief filter, "X openstaand" uit de checklist-hero (is totaal min afgerond, één regel hoger), de telling van de Checklist-kaart op het dashboard (was letterlijk `s.openClCount` uit de hero) en de regel "… excl." op een factuurkaart als die gelijk is aan incl. Een afgeleide waarde telt als hetzelfde getal
- **2026-09-07**: Tabstrip (Uren én Facturen) is op mobiel onderstreept in plaats van pillen — gelijke vakken (5×69px / 4×87,8px, 44px hoog) zonder de tekst te verkleinen, want de randen en tussenruimte die je weghaalt zíjn de ruimte die je tekortkwam. Met pillen was er één pixel speling. Desktop houdt de pillen
- **2026-09-07**: Factuureditor op mobiel — `#facEditorBody` had een eigen `overflow-y:auto` in een style-attribuut en ontsnapte daarmee aan de zijwaartse vergrendeling; nu `overflow-x:hidden` (de regeltabel staat daar als blokjes). Oorzaak zat in `input[type=date]`: eigen voorkeursbreedte, in Safari ruimer dan in Chrome — nu begrensd op 100%. Knoppenbalk in twee vaste kolommen met de hoofdknop vol onderaan
- **2026-09-07**: Notities heeft een prullenbak (`notesState.prullenbak`). Verwijderen ging linea recta weg met alleen de toast als vangnet; nu blijft het staan tot je het definitief weghaalt. Terugzetten probeert de oude groep (`ouderId`). Twee ingangen: het ⋯ op mobiel, een derde knop in de kop "Pagina's" op desktop. Bewust geen automatische opruiming
- **2026-09-07**: Notities heeft een ⋯-menu, met twee inhouden: in de lijst alles in-/uitklappen en sorteren (`notesState.sortBy`: handmatig / laatst gewijzigd / naam), in de editor de klant van de notitie. Het ⋯ staat bewust buiten de topbalk in de DOM, want die gaat in de editor uit — en display:none op een ouder haalt ook een vast gepositioneerd kind uit beeld
- **2026-09-07**: Het kruisje om te sluiten staat ín de kopbalk, nooit ervoor — die balk wordt getekend door `.modal h3:first-child`, dus een element ervoor haalt de hele band weg (dat ging op 2026-09-06 mis). Meegenomen: de band liep bij vijf modalen niet tot de rand omdat de negatieve marge vast op −20px stond en vijf koppen een inline `margin` droegen; `--modal-pad-x/-y` lost dat op. Alle 18 banden rand-tot-rand, kruisje op 9px, wit op de band in beide thema's
- **2026-09-06**: Eén KPI-kaart — `.uren-kpi` (Uren/Facturen) en `.fac-aging-cel` (Debiteuren) zijn hetzelfde blok en delen nu één set regels (169×65px, label `--fs-micro`/600/.06em, waarde `--fs-cijfer`). Cijfertrap mobiel 26→22px, bijregel weg op mobiel, en de strip boven Debiteuren vervalt — de ouderdomskaarten zíjn daar de samenvatting. Eerste factuur van y=627 naar y=426
- **2026-09-06**: Annuleren op mobiel is een ✕ rechtsboven in de modaal, niet een knop in de voet. `zetModalSluitknoppen()` zet dat bij het opstarten voor alle modalen op: het kruisje klikt de bestaande annuleerknop aan, dus alle afhandeling blijft ongemoeid. Blijft de voet leeg, dan gaat hij weg. Bestaande kruisjes in een modaalkop krijgen dezelfde svg en maat
- **2026-09-06**: Voetknoppen van een modaal op mobiel — de groepen lossen op in de voet (`display:contents`) en elke knop groeit mee, zodat het afbreken tússen knoppen valt: drie knoppen → twee op regel 1 en de hoofdknop vol op regel 2, twee → naast elkaar, één → vol. Alle voetknoppen `var(--tap)` hoog. Geldt voor alle 19 modaalvoeten; desktop ongewijzigd
- **2026-09-06**: De filterknop staat in Uren en Facturen nu ook in de topbalk (op de rij van periode/jaar, tegen de rechterrand, in dezelfde kolom als het ⋯) en de tabsrij houdt alleen tabs. Eén gedeelde regel voor elke knop die alleen een icoon draagt: `.cl2-filterbtn, .cl2-filterwis.zichtbaar, #urenFilterBtn, #facFilterBtn` — `var(--tap)` vierkant, randloos, `box-shadow:none` (`.uren-btn` heeft er één van 1px die anders een randje tekent). Bij Facturen schrijft `facRenderFilters()` in de topbalk óf, in de btw-weergave, in de balk onder de tabs
- **2026-09-06**: Checklist filtert vanaf één trechterknop in de balk (zelfde vorm als het ⋯); de ingeklapte filterbalk is weg. Staat er een filter aan, dan kleurt de knop, krijgt hij een stip en verschijnt er een ✕ ernaast die alles in één tik wist. Het paneel klapt uit ín de stroom — zweven kan er niet: de fade-in van `.cl2-scroll` gebruikt `transform` en dat maakt hem het ankerpunt voor `position:fixed`
- **2026-09-06**: Eén maat voor een icoon — token `--icoon` (16px desktop / 20px mobiel) naast `--tap`, en één vorm `.icoon-meer` voor het ⋯. Stond eerder als tekstglyph in Uren/Facturen (inkt 16×3px) en als svg van 14px in Checklist/Dashboard (11,2×2,4px). Een tekstglyph is geen icoon: zijn maat hangt aan font-size, font-weight én aan welk font laadt. Snelveld "Nieuwe taak" op de Checklist gaat op mobiel uit (blijft op desktop)
- **2026-09-06**: Op mobiel schuift het scherm alleen nog omhoog en omlaag — `overflow-y:auto` maakt de andere as stilzwijgend ook scrollbaar; `overflow-x:hidden` op `html`/`body`/`#appScreen`/`.main-area`/`.module` en op de modals
- **2026-09-06**: Agenda-module verwijderd (2.635 regels) — werd nauwelijks gebruikt en de iCal-keten via vier CORS-proxies was de bron van de onbetrouwbaarheid. Weg: de module, drie modals, beide navigatie-ingangen, de dashboardkaart en -KPI, de proxyketen, en het events-deel van de AI-invoer. `dateStr()` is naar UTILS verhuisd. **`rawState.agenda` blijft ongemoeid in Drive staan** — niet meer gebruikt, wel bewaard
- **2026-09-05**: Checklist op mobiel — filters achter één uitklapbare regel die toont wát er aanstaat, de rest van de bediening in een ⋯-menu
- **2026-09-05**: Agenda op mobiel — weekraster schuift opzij (100px per dag), Dag als standaard, balk van vier rijen naar twee. *Vervallen met de verwijdering hierboven*
- **2026-09-05**: Eén mobiele typografische schaal (zes trappen als tokens) en 44px als ondergrens voor een raakvlak; `validate.mjs` bewaakt de ondergrens
- **2026-09-05**: Bijwerken vanuit Drive gaat vanzelf — `autoSyncKijk()` kijkt bij terugkeer in het venster (`visibilitychange`/`focus`/`online`), bij de eerste klik of toets na een minuut stilte, en elke vijf minuten. Eerst alleen metadata (`driveZoekBestand()`); alleen bij een afwijkende `modifiedTime` volgt `loadGist()`. `autoSyncVeilig()` houdt hem tegen bij een wachtende save, een open modaal of focus in een invoerveld
- **2026-09-02**: Checklist-taken vastpinnen — `item.pinned` zet een taak in één blok bovenaan, *boven* de prioriteitsgroepen (dus een vastgepinde lage prio komt boven een hoge uit). Binnen dat blok geldt gewoon de gekozen sorteermodus: `clSortCmp()` zet er alleen `clVastCmp` vóór. Slepen kruist de grens niet (`clZelfdePinGroep()`)
- **2026-09-01**: Periode op de factuur te overschrijven — veld `f.periode` onder Betreft (leeg = afgeleid uit de gekoppelde uren) plus een knop "Hele maand"; de afleiding eindigde op de laatst geboekte dag, wat bij een maandfactuur bijna altijd te vroeg is
- **2026-09-01**: Checklist-sortering — nieuwe taken bovenaan (elke aanmaakplek zet nu `createdAt`, en `clNieuweSortOrder()` geeft ze `min(groep)-1`), sorteerkeuze uitgebreid naar vijf modi in `CL_SORT_MODI` met een aparte knop "Prio-groepen" (`groupByPriority`); slepen alleen nog in de modus Handmatig
- **2026-08-21**: Opschoning zonder gedragsverandering — 58 lege stub-functies en 45 altijd-ware `typeof x==='function'`-guards weg (restanten uit de tijd dat het bestand in delen werd samengesteld), 17 nooit-aangeroepen functies verwijderd, `verzamelModuleState()` als enige plek waar modules in `rawState` landen. Bewezen identiek: byte-gelijke PDF's en 0 verschillen in berekende stijlen (desktop/mobiel/licht/donker)
- **2026-08-21**: Botsingscheck bij het schrijven (`driveGezien` per venster; bij afwijking eerst samenvoegen), `index.html` netwerk-eerst in de service worker, en 12 functionele tests op de synclogica in `test.html` (29/29)
- **2026-08-21**: Drive is de waarheid — de opstartmelding met "werk van dit apparaat gebruiken" is weg (die knop schreef een oude kopie over Drive heen en kostte notities). Lokaal werk wordt alleen nog stil ingehaald als Drive onveranderd is én de kopie compleet; terugzetten gaat via **Instellingen → Versiegeschiedenis** (Drive-revisies, per dag, met aanvullen/terugzetten/downloaden). Eén versie per dag wordt met `keepForever` vastgehouden
- **2026-08-19**: Urensjablonen — "Toepassen" volgt nu de getoonde periode (landde in de week van vandaag), herhalen vult ook bij bladeren, en een herhalend sjabloon heeft een startdatum (`vanafDatum`) zodat het niet jaren terugwerkend invult
- **2026-08-19**: Uren per klant kiezen binnen een factuurpartij — vinkjes onder de gekozen partij in de nieuwe-factuur-wizard, keuze bewaard als `f.urenKlanten`
- **2026-08-19**: Facturentabel opgeschoond — kolom excl. btw, verzenddatum onder de status, één lettertype (`--font-mono` overschreven voor de module), `table-layout:fixed`, bedrijf onder het nummer i.p.v. eigen kolom; knoppen en tabs met zichtbare rand en schaduw; tijdstip in Verzonden
- **2026-08-19**: Betalingsherinnering via Gmail (eigen sjabloon, eigen logboekpil), betaalvenster met ontvangstdatum i.p.v. prompt(), en "nog X dagen" onder de vervaldatum; Debiteuren werkt nu ook op mobiel
- **2026-08-19**: Dupliceren ook bij een concept; kopie neemt geen maildossier of `nummerVast` meer mee (gaf een spookregel in het logboek Verzonden)
- **2026-08-19**: Klantgegevens bevriezen pas bij het mailen (niet bij "verstuurd"), plus "Definitief maken" voor wie print i.p.v. mailt, en "Gegevens bijwerken" met een diff zodra de kopie afwijkt
- **2026-08-19**: Sjabloon per factuur te kiezen in de editor (naast het nummer); "volgt de standaard" versus vastgezet
- **2026-08-19**: Factuurnummer bewerkbaar in de editor (teller schuift mee, alleen omhoog), Voorbeeld-knop met de echte PDF in een modal, KVK van de klant als sjabloonvinkje
- **2026-08-16**: Maandkalender onder Uren → Per maand — raster ma–zo met dagtotalen en klantblokjes, klik op een dag → Registraties van die week
- **2026-08-16**: Facturen per bedrijf — schakelaar in de topbalk (één administratie of alles), scope in `factuurState.settings.bedrijfScope`, btw-aangifte vraagt eerst om een bedrijf. Alleen binnen Facturen; klanten/uren/notities blijven gedeeld
- **2026-08-16**: Pincode-versleuteling afgeschaft (vroeg op dezelfde pc telkens opnieuw) — alleen het eenmalige uitpakpad voor een oud `rawState.geheim` blijft
- **2026-08-12**: Drive-sync naadloos gemaakt — poort op de geheimen (lege state kon Drive wissen), token vooruit vernieuwen, saves serialiseren, server-klok i.p.v. lokale klok, herstelkopie bij conflict
- **2026-08-11**: Factuur verwijderen werkte niet zichtbaar (`factuurRenderAll` bestond niet); `validate.mjs` controleert nu álle JS-aanroepen, niet alleen `onclick`

> ⚠️ **Vóór je iets terugdraait of een oude beslissing herziet**: lees eerst de volledige entry in `docs/decisions.md` — daar staat *waarom* de keuze gemaakt is.

## Hard rules voor Claude

Afgedwongen door git hooks (`.githooks/pre-push`) en Claude Code hooks (`.claude/settings.json`). Niet omzeilen — bestaan vanwege fouten van 2026-04-30.

### Vóór elke edit

1. **Lees deze CLAUDE.md** als je het deze sessie nog niet hebt gedaan
2. `git fetch origin main` + `git log HEAD..origin/main --oneline` — als output niet leeg: STOP, pull eerst
3. **Grep alle referenties** voor je iets wijzigt of verwijdert: `grep -n "<naam>" index.html`
4. **Lees het hele blok** dat je gaat aanraken — niet alleen het stukje (CSS is cascade, JS is hoist/scope-gevoelig)

### Vóór elke push

1. `node validate.mjs` lokaal — moet groen zijn
2. `git diff origin/main..HEAD` doorlezen
3. **NOOIT `git push --force`** zonder expliciete user-bevestiging. Hook blokkeert het anders. Bij bevestiging: `ALLOW_FORCE_PUSH=1 git push --force origin main`

### Na een push

Vraag Frank om **Ctrl+Shift+R** op de live site.

### Bij significante beslissingen

Voeg een nieuwe entry toe aan [`docs/decisions.md`](docs/decisions.md) bij:
- Architectuur-keuzes (cache strategie, save flow, routing, …)
- UX-systeem-keuzes (hoe spinner werkt, wanneer toast, hoe conflict afgehandeld)
- Verwijderen van features of dependencies (waarom + alternatief)
- Bug-fixes met conceptuele oorzaak (niet pure typo's)

Format: `## YYYY-MM-DD · Titel` met *Probleem / Beslissing / Waarom / Bestanden / Niet doen*. Append-only — oude entries nooit wijzigen.

## Setup voor een nieuwe machine

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-push
```

Daarna draaien `node validate.mjs` en pre-push hook automatisch.

## Tooling

| Bestand | Doel |
|---------|------|
| `validate.mjs` | JS syntax + tag balance + onclick-referentie checks |
| `parallel-check.mjs` | Bewaakt de moduleverdeling: `kaart` / `scope` / `overlap` / `merge` / `stijl`. Vangt het stille conflict dat git niet ziet — twee sporen die dezelfde gedeelde CSS-regel raken |
| `parallel-check.test.mjs` | 21 tests op die bewaker, op een wegwerp-kloon (`node parallel-check.test.mjs`, ~1 min). Draaien na elke wijziging aan `parallel-check.mjs` of `ownership.json` |
| `.claude/ownership.json` | Bron van de moduleverdeling; leesbare versie staat onder *Module ownership* |
| `.claude/agents/*.md` | Eén per spoor, `isolation: worktree` — scope, verboden en valkuilen van die module |
| `docs/stijlgids.md` | Maten per soort onderdeel; lezen vóór vormgeefwerk |
| `test.html` | 72 smoke-, sync-, model- en sorteertests in een iframe. **Via een lokale server openen** (`npx --yes http-server . -p 8765 -c-1 --silent` → http://localhost:8765/test.html); via `file://` schermt de browser de iframe af en zegt de pagina dat ook |
| `.githooks/pre-push` | Blokkeert force-push/non-fast-forward, draait validate |
| `.claude/hooks/pre-tool-use.mjs` | Blokkeert Claude's gevaarlijke commando's |
| `.claude/hooks/post-edit-validate.mjs` | Draait validate na elke edit van hoofd-bestand |
| `.claude/launch.json` | Preview-server config (`npx http-server` op poort 8765) |
| `.claude/skills/vormgeven/` | Werkwijze bij vormgeefwerk — triggert vanzelf op UI-vragen |

## Privacy & security

- Toegang via Google-login; alleen accounts van `herling-analytics.nl` komen binnen
- Data in Drive `appDataFolder`: een verborgen map per gebruiker die alleen deze app kan lezen — geen URL, geen losse token
- Geen pincode-versleuteling meer (afgeschaft 2026-08-16) — `appDataFolder` is het slot. Alleen het uitpakpad voor een oud versleuteld blok staat er nog (PBKDF2 + AES-GCM, alleen ontsleutelen)
- Geen telemetrie, geen externe API-calls behalve Google (Drive, Gmail, Fonts)
- Tokens NIET in `.git/config` URL — gebruik Git Credential Manager (`git config --global credential.helper manager`)

## Glossarium

| Term | Betekenis |
|------|-----------|
| Klant / Client | Bedrijf/opdrachtgever — kleurgecodeerd |
| Module | Top-level sectie (Dashboard, Todo, ...) |
| Project | Kanban-bord (binnen Todo module) |
| Subtaak | Onderdeel van een Checklist-item |
