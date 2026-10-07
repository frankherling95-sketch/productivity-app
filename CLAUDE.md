# Herling Analytics — Productivity App

Single-page productivity app voor Frank Herling. Single-file HTML SPA, gehost op GitHub Pages.
Toegang via Google-login (Workspace-domein `herling-analytics.nl`), data in Google Drive `appDataFolder`.

## Snel oriënteren

- **Repo**: `frankherling95-sketch/productivity-app` · branch `main`
- **Live URL**: https://app.herling-analytics.nl (eigen domein via GitHub Pages)
- **Auto-deploy**: elke push naar `main` → Pages-build (~30s)
- **Hoofd-bestand**: `index.html` (~1,7MB, ~34k regels) — alles inline, geen build step
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
├── herling-icon.svg              ← logo, stilstaand, groot (manifest)
├── herling-icon-anim.svg         ← logo, bewegend, groot (bron van de klein-versie; niet in de app)
├── herling-icon-klein.svg, herling-icon-anim-klein.svg  ← zelfde logo voor 16–64px: dikkere lijnen, geen raster (tabblad, zijbalk, klantwisselaar)
├── herling-icon-180/192/512.png, herling-icon-maskable-512.png  ← app-iconen (iOS, Android)
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
| `#dashboard` | Dashboard | Hero + KPI strip + kaartenraster (Notes/Checklist/Opdrachten & contracten) |
| `#notes` | Notes | Boomstructuur (folders/pages) met rich-text editor (marked.js) |
| `#checklist` | Checklist | Taken met subtaken, filters (prio/klant/periode), vastpinnen, drag-drop, archief |
| `#uren` | Uren | Urenregistratie per regel, week/maand, Excel export |
| `#facturen` | Facturen | Facturen uit geschreven uren, sjabloonbouwer, debiteuren, btw-overzicht, mailen via Gmail, analyse |
| `#opdrachten` | Opdrachten | Opdrachten per klant (looptijd, uren per week of urenbudget, tarief, opzegtermijn, PDF van de overeenkomst) en een vooruitzicht per werkmaand |
| `#contracten` | Contracten | Zakelijke én privécontracten (twee tabs), elk met looptijd, opzegtermijn, stilzwijgende verlenging en de PDF erbij |

Entry render functions: `renderDashboard()`, `renderNotesModule()`, `renderChecklistModule()`, `renderUrenModule()`, `renderFacturenModule()`, `renderOpdrachtenModule()`, `renderContractenModule()`. `renderAll()` wordt aangeroepen na elke `loadGist()`.

## State & persistence

```js
rawState = {
  tasks:    kanbanState,     // {clients} — heet zo uit de tijd van Kanban (weg 2026-10-04); oude projects blijven ongemoeid in Drive
  notes:    notesState,      // {tree, activeId, collapsed, clientGroupCollapsed, recentIds, sortBy ('gewijzigd' standaard|'handmatig'|'naam'), sortGekozen, prullenbak, verborgenKlanten (leeg sinds 2026-10-05, zie Klant.verborgen)}
  checklist: checklistState, // {items, showArchived, sortBy, groupByPriority}
  uren:     urenState,       // {entries, templates}
  opdrachten: opdrachtState, // {opdrachten, vrij (vakanties), feestdagen (ids; ontbreekt = standaard)}
  contracten: contractState, // {contracten, opruimen} — de PDF's zelf staan NIET hierin, zie Contracten hieronder
  // agenda: verwijderd 2026-09-06; oude events blijven ongemoeid in Drive staan
  settings: { calSources, theme, agendaMeldingen: {aan, kalenderId, checklist}, driveArchief: {aan, mapId}, ... }
}
```

**Item shapes** (snelle referentie):
- Checklist item: `{id, text, done, priority, deadline, clientId, subtasks[], archived, sortOrder, pinned}` — subtaak `{id, text, done, doorHoofd?}`; `doorHoofd` = mee afgevinkt met de hoofdtaak, gaat weer open als die terugkomt (`clZetHoofdKlaar()`)
- Notes node (recursief): `{id, type:'page'|'folder', title, content, clientId, tags, children[]}`
- Klant: `{id, name, colorIdx, verborgen?}` — `verborgen` = opgeschoond: weg uit de klantwisselaar, Notities, Checklist en Dashboard, maar gewoon kiesbaar in Uren, Facturen, Opdrachten en Contracten (`klantVerborgen()`, `takenZichtbaar()`, `klantenVoorKeuze()`)
- Contract: `{id, domein ('zakelijk'|'prive'; ontbreekt = zakelijk), soort, titel, clientId|null, wederpartij, opdrachtId|null, getekend, start, eind|null, opzeg, verlenging ('' of '1m'/'3m'/'6m'/'12m'), notitie, bijlagen[]}` — een bijlage is `{id, naam, grootte, hash, driveId|null}`. De PDF staat als **eigen bestand** in de Drive-`appDataFolder` (`contract-<id>.pdf`) plus een kopie in IndexedDB (`herling_bijlagen`), niet in `rawState`. Hangt een contract aan een opdracht, dan komt de looptijd uit de opdracht (`ctrLooptijd()`)
- Opdracht: `{id, clientId, naam, start, eind|null, opzeg ('', '2w', '1m', …), tarief|null, urenPerWeek|null, urenBudget|null, werkdagen|null ([2,3,5] = di/wo/vr; null = ma–vr), notitie, bijlagen[]}` — bijlagen zoals bij een contract, zelfde opslag en opruimlijst (`ctrAlleBijlagen()`) — uren horen erbij via klant + looptijd, niet via een veld op de urenregel

### Storage keys

| Constant | Doel |
|----------|------|
| `DRIVE_BESTAND` = `herling-analytics.json` | Bestand in Drive `appDataFolder` |
| `LS_LOGIN` = `herling_login` | Ingelogde gebruiker (e-mail + geldigheid) |
| `LS_BACKUP_KEY` = `herling_analytics_local_backup` | Volledige rawState backup |
| `LS_SYNC_KEY` = `herling_analytics_sync` | `gewijzigdOp`/`naarDriveOp` (lokale klok) + `driveTijd` (server-klok) |
| `LS_ZIJBALK` = `herling_zijbalk` | Zijbalk ingeklapt + welke groepen dicht staan (per apparaat, niet in Drive) |
| `LS_OPD_PERKLANT` = `herling_opdrachten_perklant` | Stand van de knop *Per klant* op Opdrachten → Vooruitzicht, per apparaat |
| `LS_CTR_WEERGAVE` = `herling_contracten_weergave` | Welke tab van Contracten je bekijkt (zakelijk/privé), per apparaat en bewust niet in `rawState` |
| IndexedDB `herling_bijlagen` | PDF's van Contracten op dit apparaat (kopie; het origineel staat als los bestand in de Drive-`appDataFolder`) |
| `LS_HERSTEL_KEY` = `herling_analytics_herstel` | Niet-gekozen versie na een conflict; zichtbaar in Instellingen → Versiegeschiedenis, of `herstelDownload()` |
| `LS_ARCHIEF` = `herling_archief` | Archief in Google Drive: handtekening, tijdstip, aantal en wat er wacht of is overgeslagen bij de laatste keer bijwerken op dít apparaat (zelfde reden als `LS_AGD`) |
| `LS_AGD` = `herling_agenda` | Meldingen in Google Agenda: handtekening, tijdstip en aantal van de laatste keer bijwerken op dít apparaat (bewust niet in `rawState`: anders wordt elke keer bijwerken een wijziging voor Drive) |

### Save flow

De functienamen zijn historisch (`loadGist`/`saveGist`/`refreshGist`); ze praten met Google Drive, niet met GitHub.

1. State-mutatie → `scheduleSave()` → direct naar `localStorage` (vangnet) → 1500ms debounce → `saveGist()`
2. `saveGist()` is een wrapper met in-flight guard; het echte werk zit in `saveGistIntern()`. Er loopt er **hooguit één tegelijk** — een verzoek dat ondertussen binnenkomt wordt na afloop één keer ingehaald
3. Geschreven wordt het hele bestand, zonder merge (single-user). Wél wordt Drive's `modifiedTime` onthouden, zodat de volgende start weet of Drive sindsdien veranderd is
4. Bij een fout: de melding komt één keer, de wijziging staat lokaal en een herkansing loopt met backoff (5s/15s/60s/180s)
5. Bij een laadfout: terugvallen op de lokale back-up. `driveGelezen` wordt daarbij **niet** gereset — is Drive deze sessie al gelezen, dan blijft schrijven veilig
6. `beforeunload` en `visibilitychange` flushen pending saves
7. Ophalen gaat vanzelf: `autoSyncKijk()` controleert goedkoop (alleen metadata) of Drive is veranderd en roept dan pas `loadGist()` aan — zie de entry van 2026-09-05 in `docs/decisions.md`
8. Er wordt niets meer versleuteld weggeschreven — de pincode is afgeschaft (2026-08-16). Ligt er nog een oud `rawState.geheim` in Drive, dan wordt dat één keer uitgepakt (vanzelf met de bewaarde apparaatsleutel, anders met de code) en daarna definitief plat opgeslagen; zie `pinVersleutelingWeg()`

⚠️ **De poort `geheimenKlaar()`**: zolang dat oude blok nog dicht is, is `factuurState`/`urenState` leeg. Zolang de poort dicht is mag niets die state wegschrijven — anders wist een lege state de administratie in Drive. Zie de entries van 2026-08-12 en 2026-08-16 in `docs/decisions.md`.

### Migratie functies

Bij toevoegen van een nieuw state-veld: voeg een hydratie-stap toe in `hydrateerStateIntern()` (zoek `if(!checklistState.items)` als voorbeeld) — dat is het enige laadpad; `hydrateerState()` is het omhulsel dat `scheduleSave()` laat wachten tot alles geladen is.

> Er staan er nu geen meer. `migrateOldKanban(loaded)` werd nergens aangeroepen en is verwijderd (2026-08-21); `migrateCalSettings()` verdween met de agenda-module (2026-09-06).

### State in `rawState` zetten

`verzamelModuleState()` kopieert de losse module-states terug in `rawState`; `huidigeStateSnapshot()` doet dat en geeft `rawState` terug. **Nieuwe module erbij? Zet hem in `verzamelModuleState()`** — wat daar niet in staat gaat niet naar Drive en niet in de back-up. Zet hem ook in `voegStateSamen()` (samenvoegen bij een schrijfbotsing) en `stateOmvang()` (is een lokale kopie compleet).

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

**Beweging**: `--duur-kort` (140ms), `--duur` (220ms), `--ease` (binnen), `--ease-weg` (weg) — altijd deze, dan werkt "beweging beperken" vanzelf. Zie `docs/stijlgids.md` §14.

**Color tokens**: `--navy #0F1B3D`, `--navy-dark #0A1330`, `--teal #0D3D3A`, `--mint #00E5B0`, plus `--bg/--surface/--text/--border/--accent/--danger` etc. Volledige set in regels 798–893.

## Mobile

- **Breakpoint**: `@media (max-width: 768px)`
- Bottom tab-bar (`#mobileNav`), sidebar als drawer, full-width modals, compactere topbars

## CSS conventies

Class-prefix per module: `.cl-` checklist, `.dash-` dashboard, `.note(s)-` notes, `.uren-` uren, `.modal-`, `.btn-`, `.toast-`, `.nav-`, `.mod-` (generiek). Geen utility-classes, geen `!important` tenzij echt nodig.

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

| Library | Versie | Doel |
|---------|--------|------|
| SheetJS `xlsx` (cdn.sheetjs.com) | 0.20.3 | Excel-export (Uren, Facturen) en -import (taken) — npm wordt niet meer bijgewerkt |
| `marked` (jsdelivr, `lib/marked.umd.js`) | 18.0.14 | Markdown → HTML (AI-opschoning, slim toevoegen, wekelijkse review) |
| `dompurify` (jsdelivr) | 3.4.16 | Sanitizer voor alle HTML die met innerHTML de pagina in gaat (`veiligeHtml()`) |
| `jspdf` (jsdelivr) | 4.2.1 | Factuur-PDF's |
| Google Identity Services | — | Inloggen |
| Google Fonts | — | `Archivo, Inter, Plus Jakarta Sans, JetBrains Mono` |

**Altijd met een vaste versie.** Zonder versie laadt een CDN de nieuwste: marked
haalde in versie 16 `marked.min.js` weg en gaf daarna maandenlang een 404.
Bijwerken = het nummer in de `<script>`-tag ophogen, `test.html` draaien en
`npm audit` op de gebruikte versies.

Bij CDN-falen: app crasht niet hard, alleen die feature werkt niet (Excel-export uit, markdown als ruwe tekst, sanitizer valt terug op een eigen grovere filter).

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

`#mod-opdrachten` (`opd*`, `.opd-`) en `#mod-contracten` (`ctr*`, `.ctr-`) hebben
voorlopig geen eigen spoor en vallen onder de coördinator. (`#mod-todo`, Kanban, is
weg sinds 2026-10-04.)

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
| "Ik zie de oude versie" | Sinds v9 is het document netwerk-eerst, en sinds v2.24 ook echt: de worker haalt het met `cache:'no-cache'`, want GitHub Pages stuurt `max-age=600` en een kale `fetch(req)` gaf tot tien minuten na een uitrol de vorige versie. Eén keer herladen na een `sw.js`-wijziging; blijft het hangen: DevTools → Application → Service Workers → Unregister + Clear site data |
| Force-push verwijdert remote commits | **Eerst altijd `git fetch && git log HEAD..origin/main`** |
| `.claude/worktrees/...` heeft een kopie | Negeren — staat in `.gitignore`, agent-isolatie |
| Maandweergave krap bij drukke dag | Klik op datum → daganzicht |

## Recent gemaakte beslissingen

De drie meest recente. Alle andere — met het *waarom* — staan in
[`docs/decisions.md`](docs/decisions.md) (append-only, nieuwste onderaan).

- **2026-10-07**: **Geen namen van klanten of relaties in de repo** (v2.34) — de repo is openbaar; alle namen vervangen door vaste verzonnen namen, Externe tools uit de HTML naar `rawState.settings.externeTools`, en `validate.mjs` + de push-hooks houden namen tegen (gehashte lijst). Oude commits bevatten ze nog
- **2026-10-07**: **Beweging** (v2.32) — tokens `--duur-kort`/`--duur`/`--ease-weg`; module faded in (geen View Transitions: die werken asynchroon), Checklist afvinken + FLIP bij elke hertekening, vensters en menu's faden ook uit (`allow-discrete`, `@starting-style`, en `menuUitfaden()` voor menu's die uit de pagina gaan). "Beweging beperken" zet alles op 0
- **2026-10-05**: **Klanten verbergen** (v2.31) — oog per klant in de klantwisselaar; `client.verborgen` gaat mee naar Drive. Weg uit Notities, Checklist en Dashboard (taken, tellingen, badge, klantkeuze), niet uit Uren/Facturen/Opdrachten/Contracten. Terughalen onder *Verborgen* in de wisselaar; de Checklist zegt onderaan hoeveel open taken niet getoond worden. Vervangt `notesState.verborgenKlanten` (één keer overgezet)

> ⚠️ **Vóór je iets terugdraait of een oude beslissing herziet**: lees eerst de volledige entry in `docs/decisions.md` — daar staat *waarom* de keuze gemaakt is.

## Hard rules voor Claude

Afgedwongen door git hooks (`.githooks/pre-push`) en Claude Code hooks (`.claude/settings.json`). Niet omzeilen — bestaan vanwege fouten van 2026-04-30.

### ⚠️ Geen namen van klanten of relaties — de repo is openbaar

Echte namen van klanten, opdrachtgevers, tussenpartijen, bemiddelaars,
leveranciers en andere zakelijke relaties komen **nergens** in de repo: niet
in code, commentaar, tests, testdata, docs, mockups, voorbeeldteksten (placeholders),
URL's of commitberichten. Ook niet "even als voorbeeld" en niet uit een
screenshot of uit Franks eigen data overgenomen. Dat geldt net zo voor
persoonsnamen, adressen, IBAN's en KvK-nummers.

Gebruik altijd deze verzonnen namen:

| Rol | Naam |
|---|---|
| klanten | Klant Noord, Klant Zuid, Klant Oost, Klant West (en Klant A–E in mockups) |
| tussenpartij / factuurklant | Acme Data B.V., Acme BI B.V. |
| gemeente / instelling | Gemeente Puren, Bibliotheek Noordstad, Bibliotheek Zuidstad |
| overig bedrijf | Voorbeeld B.V., Voorbeeld Energie, Voorbeeld Telecom |
| persoon | Jan Jansen, iemand@voorbeeld.nl |

Wat Frank zelf invult (klanten, links naar portalen van relaties) hoort in zijn
eigen gegevens in Drive, niet in de code — zie Externe tools
(`rawState.settings.externeTools`).

**Afgedwongen:** `validate.mjs` hasht elk woord en elke reeks van 2–3 woorden
in de bestanden (en met `--commits` in de commitberichten) en vergelijkt met een
lijst bekende namen — als hash, zodat de lijst zelf niets prijsgeeft. De
PreToolUse-hook draait dat bij elke `git push`, ook in een verse cloudsessie;
`.githooks/pre-push` doet het waar `core.hooksPath` aanstaat. Nieuwe naam
erbij: `node validate.mjs --namen-hash "Naam"` en de regel in de lijst zetten,
of leesbaar in `.claude/namen.local` (gitignored, alleen dat apparaat).

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
| `test.html` | 148 smoke-, sync-, model-, reken- en sorteertests in een iframe. **Via een lokale server openen** (`npx --yes http-server . -p 8765 -c-1 --silent` → http://localhost:8765/test.html); via `file://` schermt de browser de iframe af en zegt de pagina dat ook |
| `.githooks/pre-push` | Blokkeert force-push/non-fast-forward, draait validate |
| `.claude/hooks/pre-tool-use.mjs` | Blokkeert Claude's gevaarlijke commando's |
| `.claude/hooks/post-edit-validate.mjs` | Draait validate na elke edit van hoofd-bestand |
| `.claude/launch.json` | Preview-server config (`npx http-server` op poort 8765) |
| `.claude/skills/vormgeven/` | Werkwijze bij vormgeefwerk — triggert vanzelf op UI-vragen |

## Privacy & security

- Toegang via Google-login; alleen accounts van `herling-analytics.nl` komen binnen
- Data in Drive `appDataFolder`: een verborgen map per gebruiker die alleen deze app kan lezen — geen URL, geen losse token
- Geen pincode-versleuteling meer (afgeschaft 2026-08-16) — `appDataFolder` is het slot. Alleen het uitpakpad voor een oud versleuteld blok staat er nog (PBKDF2 + AES-GCM, alleen ontsleutelen)
- Geen telemetrie, geen externe API-calls behalve Google (Drive, Gmail, Agenda, Fonts)
- Google-scopes: `drive.appdata` (opslag), `drive.file` (archief: alleen wat de app zelf maakte), `gmail.send`, `calendar.app.created` — elk staat op het OAuth-scherm in de Cloud Console
- Tokens NIET in `.git/config` URL — gebruik Git Credential Manager (`git config --global credential.helper manager`)
- **De repo is openbaar** (GitHub Free + Pages). Geen namen van klanten of relaties erin — zie *Hard rules*

## Glossarium

| Term | Betekenis |
|------|-----------|
| Klant / Client | Bedrijf/opdrachtgever — kleurgecodeerd |
| Module | Top-level sectie (Dashboard, Todo, ...) |
| Subtaak | Onderdeel van een Checklist-item |
