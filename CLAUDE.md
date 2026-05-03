# Herling Analytics — Productivity App

Single-page productivity app voor Frank Herling. Single-file HTML SPA, gehost op GitHub Pages, data in een private GitHub Gist.

## Repository & live site

- **Repo**: `frankherling95-sketch/productivity-app`
- **Branch**: alleen `main` (geen feature-branches, geen PRs)
- **Live URL**: `https://frankherling95-sketch.github.io/productivity-app/`
- **Auto-deploy**: elke push naar `main` triggert een GitHub Pages build (~30 sec → live)

## Wie is de gebruiker

- **Eén gebruiker, één omgeving tegelijk.** Frank werkt vanuit meerdere computers, maar nooit tegelijkertijd op twee apparaten met de app open.
- **Taal: Nederlands.** Alle UI-tekst en commit messages in het Nederlands.
- **Force-pushes zijn TOEGESTAAN MAAR ALLEEN met expliciete bevestiging** — zie hard rules onderaan.
- **Achtergrond Frank**: data analytics. Comfortable met data structuren, SQL, Python.

## Architectuur

**Eén bestand**: `herling_analytics_home.html` (~225KB, ~11.000 regels) — alles inline (HTML + CSS + JS, vanilla JavaScript, geen build step). Wijzigingen gaan altijd hierin tenzij expliciet anders gevraagd.

```
.
├── herling_analytics_home.html   ← DE app (alle wijzigingen hier)
├── index.html                    ← redirect stub naar hoofdbestand
├── bi_checklist_kanban.html      ← redirect stub (legacy URL)
├── herling-icon.svg              ← logo + favicon
├── CLAUDE.md                     ← dit bestand
├── validate.mjs                  ← Node syntax/structure checker
├── test.html                     ← browser smoke test (16 checks)
├── .githooks/pre-push            ← git hook (na `core.hooksPath` setup)
├── .claude/                      ← Claude Code config + hooks
└── .gitignore                    ← excludeert worktrees + settings.local
```

### Indeling binnen `herling_analytics_home.html`

| Regels (~) | Inhoud |
|------------|--------|
| 1–14 | `<head>`: meta, favicon, CDN scripts |
| 23–797 | Originele CSS: layout, sidebar, modules, modals |
| 798–893 | Theme overlay tokens (light/dark) |
| 894–1391 | Component CSS (sidebar, buttons, kanban, checklist, notes, modals, agenda, uren, toast) |
| 1392–1438 | Mobile CSS (`@media (max-width: 768px)`) |
| 1439–~4880 | HTML body (sidebar, modules, modals, toast) |
| ~4884+ | JavaScript: STATE → AUTH → GIST → CLIENTS → DASHBOARD → BOOT → TODO → NOTES → CHECKLIST → AGENDA → AGENDA OAUTH → UREN |

Snel zoeken in JS: elke major sectie heeft een banner-comment met `═══` lijntjes, makkelijk grep-baar.

### Modules (hash routing)

| Hash | Module | Functie | Status |
|------|--------|---------|--------|
| `#dashboard` | Dashboard | Hero + KPI strip + 2×2 grid: Todo / Notes / Agenda / Checklist | Stabiel |
| `#todo` | Kanban | Projecten met kolommen, kaarten met klant/tags/category, drag-drop | Stabiel |
| `#notes` | Notes | Boomstructuur (folders/pages) met rich-text editor (marked.js) | Stabiel |
| `#agenda` | Agenda | iCal multi-source (week/dag/maand views) — Outlook via published iCal-link | Stabiel |
| `#checklist` | Checklist | Taken met subtaken, filters (prio/klant/periode), drag-drop, archief | Stabiel |
| `#uren` | Uren | Timesheets, weekpatronen, herhaling, export | Stabiel |

#### Agenda module — Outlook integratie

OAuth (MSAL/Graph + Google) is **bewust verwijderd** omdat Frank geen Entra/Azure-rechten heeft. De agenda werkt nu uitsluitend met iCal-feeds:

- **Outlook agenda koppelen**: in Outlook web → Settings → Calendar → Shared calendars → Publish a calendar → kopieer ICS-link → plak in app via "+ iCal link toevoegen". Werkt voor zowel persoonlijke als werk-/school-accounts (mits IT publishing niet heeft uitgezet).
- **Vertraging**: Microsoft cached gepubliceerde feeds, updates lopen 15-30 min achter.
- **Fallback**: handmatige `.ics`-import via de bestaande ICS-import knop.
- **NIET opnieuw introduceren** zonder expliciete vraag: MSAL, Google Identity Services, `accounts[]`-gebaseerde OAuth flows. Zie de instructie in `openCalSourcesModal` voor uitleg.
- **Mogelijke verbeteringen**:
  - Native event creation/edit: lokale events maken/bewerken in `rawState.agenda.events[]` (state bestaat, UI gedeeltelijk).
  - Maandweergave: nu adaptive pill-formaat bij 4+ events, maar bij erg drukke dagen wordt het toch krap.
  - Recurrence editing: nu alleen lezen van iCal RRULE, niet bewerken.
  - Drag-drop voor events herplannen.

### Modules — entry render functions

Bij wijzigingen aan een module: dit is de hoofdfunctie waar je begint.

| Module | Entry function | DOM container |
|--------|----------------|---------------|
| Dashboard | `renderDashboard()` | `#mod-dashboard` |
| Todo (Kanban) | `renderTodoModule()` | `#mod-todo` |
| Notes | `renderNotesModule()` | `#mod-notes` |
| Agenda | `renderAgendaModule()` | `#mod-agenda` |
| Checklist | `renderChecklistModule()` | `#mod-checklist` |
| Uren | `renderUrenModule()` | `#mod-uren` |

`renderAll()` wordt aangeroepen na elke `loadGist()` en triggert al deze.

## State & persistence

### State shape

```js
rawState = {
  tasks:    kanbanState,     // {projects, activeProject, clients, tags, categoryGrouping}
  notes:    notesState,      // {tree, activeId, collapsed}
  checklist: checklistState, // {items, showArchived, sortBy}
  uren:     urenState,       // {entries, templates}
  agenda:   {events: []},    // native (niet-iCal) events
  settings: {
    calSources: [],          // [{id, type:'ical', name, url, color, enabled}]
    theme:      'auto',      // 'auto' | 'light' | 'dark' | 'schedule'
    /* ...andere instellingen */
  }
}
```

### Detail per entiteit

**Kanban item**:
```js
{ id, title, clientId, category, context, tags:[], createdAt, updatedAt }
```

**Checklist item**:
```js
{ id, text, done, priority:'hoog'|'middel'|'laag', deadline, clientId,
  subtasks:[{id, text, done}], archived, sortOrder }
```

**Notes node** (recursief):
```js
{ id, type:'page'|'folder', title, content, clientId, tags,
  children:[...], createdAt, updatedAt }
```

**Klant**:
```js
{ id, name, colorIdx }   // colorIdx is index in CLIENT_COLORS palette
```

**iCal source**:
```js
{ id, type:'ical', name, url, color, enabled }
```

### Storage keys / constants

| Constant | Waarde | Doel |
|----------|--------|------|
| `GIST_FILENAME` | `bi_checklist_kanban.json` | Filename binnen de Gist (legacy naam, niet wijzigen) |
| `LS_TOKEN_KEY` | `bi_checklist_gh_token` | GitHub PAT in localStorage |
| `LS_GIST_KEY` | `bi_checklist_gist_id_kanban` | Gist ID in localStorage |
| `LS_BACKUP_KEY` | `herling_analytics_local_backup` | Volledige rawState backup |
| `CORS_PROXY` | `https://corsproxy.io/?` | Proxy voor iCal-feeds (browser CORS) |

### `uid()` — ID-generator

```js
function uid(){return 'id_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);}
```

Gebruikt overal voor IDs van items, projecten, klanten, etc. Format: `id_<random8>_<base36-time>`.

### Save flow

1. State-mutatie → `scheduleSave()`
2. `scheduleSave()` schrijft direct naar `localStorage` (vangnet) → 1500ms debounce-timer → `saveGist()`
3. `saveGist()` doet `PATCH /gists/:id` zonder conflict-check (single-user → altijd overschrijven)
4. Bij netwerkfout: 5s retry, error in sync-balk, data blijft in localStorage
5. Bij Gist-load fout: fallback naar localStorage backup
6. `beforeunload` handler captured pending saves naar localStorage

**Belangrijk**: Geen conflict-detectie. Alles wat Frank invoert is per definitie de bron van waarheid.

### Migratiefuncties

Lopen bij elke `loadGist()`. Voegen ontbrekende velden toe in oudere data zonder data te verliezen.

| Functie | Wat |
|---------|-----|
| `migrateOldKanban(loaded)` | Zet flat-format kanban om naar `{projects, activeProject, clients, tags, categoryGrouping}` |
| `migrateCalSettings()` | Zet legacy `icalUrl` om naar `calSources[]`; verwijdert oude `google` types |

Bij toevoegen van een nieuw state-veld: voeg een hydratie-stap toe in `loadGist()` (zoek `if(!checklistState.items)checklistState.items=[];` als voorbeeld).

### Background sync

| Trigger | Wat | Guard |
|---------|-----|-------|
| 5-min interval (visible tab) | GET gist, vergelijk `updated_at`, reload als anders | Slaat over als `saveTimer` actief |
| `visibilitychange` na >30s away | `loadGist()` | Slaat over als `saveTimer` actief |

## UX-systemen

### `setSync(type, msg)`
Update de status-balk in de sidebar.
- `type`: `'idle' | 'saving' | 'saved' | 'error'`
- Verschijnt linksonder in de sidebar.

### `appToast(msg, opts)`
Floating toast onderaan rechts. Aanwezig vanaf regel ~6693.
- `opts`: `{type:'info|warning|error|success', duration:ms, undo:fn}`
- `undo` toont een knop "↩ Ongedaan maken" die `fn` aanroept (te overrulen via `undoToastUndoBtn.textContent`).

### `updateNavBadges()`
Zet getalletjes naast Todo/Agenda/Checklist nav-items (open taken, vandaag's events, openstaande checklist).
- Wordt aangeroepen vanuit `scheduleSave()` automatisch.

### Undo systeem
Verwijderacties tonen een toast met "Ongedaan maken". State wordt eerst opgeslagen in een lokale snapshot voordat de delete wordt doorgevoerd.

## Theme-systeem

- **Auto** (default): volgt `prefers-color-scheme`
- **Manual**: `:root[data-theme="light"]` of `:root[data-theme="dark"]`
- Toggle-functie ergens rond regel ~5617
- Voorkeur opgeslagen in `rawState.settings.theme`

### Color tokens

```
--navy        #0F1B3D    (primary brand)
--navy-dark   #0A1330    (deeper navy)
--teal        #0D3D3A    (accent dark)
--mint        #00E5B0    (accent bright)
--mint-soft   rgba(0,229,176,0.12)
--mint-glow   rgba(0,229,176,0.25)
```
Plus tokens voor `--bg`, `--surface`, `--text`, `--border`, `--accent`, `--danger`, etc. Zie regels 798–893 voor de volledige set in beide modes.

## Mobile

- **Breakpoint**: `@media (max-width: 768px)` — vanaf regel ~2867
- Onder deze breedte verschijnen:
  - Bottom tab-bar (`#mobileNav`)
  - Sidebar als drawer (slide-in)
  - Full-width modals
  - Compactere topbars per module
- Mobile nav-badges hebben hun eigen IDs: `mobileNavBadgeTodo`, `-Agenda`, `-Checklist`

## CSS conventies

Class-prefix per module om naam-collisies te voorkomen:

| Prefix | Module |
|--------|--------|
| `.cl-` | Checklist |
| `.cal-` | Agenda (calendar) |
| `.dash-` | Dashboard |
| `.col-` | Kanban kolommen |
| `.note-` / `.notes-` | Notes |
| `.uren-` | Uren |
| `.mod-` | Generieke module containers |
| `.modal-` | Modals |
| `.btn-` | Buttons |
| `.toast-` | Toast |
| `.nav-` | Sidebar nav |

Volg dit bij nieuwe componenten. Geen utility-classes (Tailwind-stijl), geen `!important` tenzij echt nodig.

## Externe dependencies (CDN)

| Library | URL | Doel |
|---------|-----|------|
| xlsx | `https://unpkg.com/xlsx/dist/xlsx.full.min.js` | Excel export (Uren) |
| marked | `https://cdn.jsdelivr.net/npm/marked/marked.min.js` | Markdown rendering (Notes) |
| Google Fonts | `Archivo, Inter, Plus Jakarta Sans, JetBrains Mono` | Typography |

**Bij CDN-falen**: app crasht niet hard, maar features die de lib gebruiken werken niet (Excel-export uit, Notes tonen ruwe markdown). Geen fallback ingebouwd.

## Belangrijke conventies

- **Geen externe build step** — alles inline, geen bundlers/transpilers/preprocessors.
- **Vanilla JS** — geen frameworks. jQuery niet, React niet, Vue niet.
- **Geen Service Workers**. Een eerdere SW met stale-while-revalidate caching zorgde voor een hardnekkige cache-bug. **Niet opnieuw introduceren** zonder expliciete vraag.
- **Geen analytics, geen tracking, geen cookies**. Privacy: alle data in private Gist, lokaal in localStorage.
- **CORS-proxy** voor iCal: `https://corsproxy.io/?<encoded_url>`.
- **Drag-and-drop**: HTML5 native (`draggable="true"`), geen externe library.
- **iCal RRULE**: zelf geparseerd in `expandEvents()`. DAILY / WEEKLY / MONTHLY / YEARLY ondersteund. UNTIL en COUNT ondersteund.
- **Token-format**: app accepteert `ghp_`, `github_pat_`, `gho_` prefixes. Sanitizer in `sanitizeToken()` strips zero-width chars en whitespace.
- **Browser-support**: modern Chromium / Firefox / Safari, ES2020+ syntax. Geen IE11.

## Workflow

1. Frank vraagt een feature/fix
2. **Lees deze CLAUDE.md** als nog niet deze sessie gedaan
3. **`git fetch origin main` + `git log HEAD..origin/main`** — moet leeg zijn
4. **`grep -n "<symbol>" herling_analytics_home.html`** voor refs vóór wijziging
5. Edit `herling_analytics_home.html`
6. **`node validate.mjs`** lokaal — moet groen zijn
7. Commit met Nederlandse beschrijving
8. **`git push origin main`** — pre-push hook draait validate
9. Frank doet hard reload (Ctrl+Shift+R) op de live site
10. Optioneel: `test.html` openen voor 16-point smoke test

```bash
git add herling_analytics_home.html
git commit -m "Korte Nederlandse beschrijving"
git push origin main
```

## Common patterns / how-to recipes

### Een nieuwe modaal toevoegen
1. HTML: voeg `<div class="modal-bg" id="<naam>Modal"><div class="modal">...</div></div>` toe in body
2. CSS: gebruik `.modal-bg`, `.modal`, `.modal-footer` — bestaande classes
3. JS: `function openXModal(){document.getElementById('xModal').classList.add('open');}` + `closeXModal()`
4. Sluitknop: `<button onclick="closeXModal()">`

### Een nieuw state-veld toevoegen
1. Voeg het toe aan de initiële state declaratie
2. Voeg een hydratie-stap toe in `loadGist()`: `if(!state.newField)state.newField=defaultValue;`
3. Pas de save flow niet aan — `saveGist()` neemt de hele `rawState` mee

### Een nieuwe checklist filter toevoegen
1. Voeg sleutel toe aan `clFilters = {prio, clientId, period, ...}`
2. Render-knop in `renderClFilterBar()`
3. Filter-logica in `renderChecklistModule()` waar `display = activeItems.filter(...)` staat

### Nav-badge updaten
- Roep `updateNavBadges()` aan na elke state-mutatie die de telling beïnvloedt
- Edit `updateNavBadges()` zelf om het ID + de telling toe te voegen

## Bekende valkuilen

| Probleem | Oorzaak | Oplossing |
|----------|---------|-----------|
| Subtaak verschijnt dubbel | Enter triggert commit + blur ook | Guard met `if(clAddingSubtaskFor!==itemId)return;` aan top van `commitSubtaskInput` |
| iCal events ontbreken | MONTHLY/YEARLY RRULE niet uitgebreid | `expandEvents()` heeft branches; check ook overlap (`start<=toDate && end>=fromDate`) |
| Service Worker cachet oude HTML | Eerdere PWA-poging | NIET opnieuw doen. Geen sw.js / manifest.json toevoegen tenzij Frank expliciet vraagt |
| `.claude/worktrees/...` heeft een kopie van de app | Parallelle agent-sessies | Negeren — geen edits daar (staat in `.gitignore`) |
| Force-push verwijdert remote commits | Worktree-agent kan tussen sessies pushen | **Eerst altijd `git fetch && git log HEAD..origin/main`** |
| Conflict-toast bij snelle saves | Was eventual consistency van GitHub API | Conflict-detectie is permanent verwijderd; localStorage is vangnet |
| Maandweergave krap bij drukke dag | Adaptive pill-grootte heeft limieten | Open de daganzicht via klik op datum |

## Performance / file size

- Huidig: ~225KB / ~11.000 regels
- Eerste paint: <500ms op moderne laptop
- Tested met: ~50 taken, ~200 notes, ~5 iCal sources, ~1000 uren-entries
- **Drempel voor splitsen**: ~500KB. Daarboven wordt initial-load merkbaar. Overweeg dan: minify (één keer in CI), of wel een build-step met esbuild.

## Privacy & security

- Alle gebruikersdata in **private GitHub Gist** (alleen toegankelijk met PAT)
- GitHub PAT in localStorage — acceptabel voor single-user, *niet* in repo committen
- Geen telemetrie, geen externe API-calls behalve GitHub + Google Fonts CDNs + iCal feeds
- iCal feeds via `corsproxy.io` — feed-URLs zijn typisch "secret" maar passeren wel een derde partij

## Glossarium

| Term | Betekenis |
|------|-----------|
| Klant / Client | Bedrijf of opdrachtgever — kleurgecodeerd, toegewezen aan items |
| Module | Top-level sectie (Dashboard, Todo, Notes, etc.) |
| Project | Kanban-bord (binnen Todo module) |
| Subtaak | Onderdeel van een Checklist-item |
| Tag / Label | Vrije label op een Kanban-kaart |
| Categorie | Vooraf-gedefinieerde groep binnen een Kanban-project |
| Sortering / Sortorder | Numeriek veld voor handmatige drag-volgorde |
| Archief | Verborgen items die wel bewaard blijven (toggle in checklist) |
| iCal source | `.ics` feed van Outlook/Google/Apple/etc. |

## Recent gemaakte beslissingen

- **2026-04-30**: Quality-guard infrastructuur (validate.mjs, test.html, githooks, claude hooks)
- **2026-04-30**: Force-push protectie via pre-push hook (na incidenten met overwriting van remote)
- **2026-04-30**: Conflict-detectie definitief weg uit `saveGist`. Was false-positive door GitHub eventual consistency
- **2026-04-30**: localStorage als instant backup (`saveLocalBackup`/`loadLocalBackup`)
- **2026-04-30**: Service Worker permanent verbannen (caching-bug)
- **2026-04-30**: Checklist filters (prio/klant/periode), subtaken bewerkbaar inline, auto-close bij alle subtaken klaar
- **2026-04-30**: Subtaken zichtbaar op dashboard checklist-kaart met toggle
- **2026-04-30**: Agenda iCal-only (Google OAuth UI weg uit de productpath); Phase A foundation blijft in code voor later
- **2026-05-03**: MSAL + Google OAuth foundation **volledig verwijderd** (Frank heeft geen Entra/Azure-rechten). Outlook agenda's koppelen via gepubliceerde iCal-link (outlook.com/office.com → Settings → Calendar → Shared calendars → Publish)
- **2026-04-30**: Maand-weergave: alle events tonen met adaptive pill-grootte i.p.v. "+X meer"
- **2026-04-30**: Dashboard 2×2 grid met 4 modules + Checklist-kaart

## Hard rules voor Claude (niet overslaan)

Deze workflow wordt afgedwongen door git hooks (`.githooks/pre-push`) en
Claude Code hooks (`.claude/settings.json` + `.claude/hooks/`). Probeer
ze niet te omzeilen — ze bestaan vanwege de fouten van 2026-04-30.

### Vóór elke edit

1. **Lees deze CLAUDE.md eerst** als je het nog niet deze sessie hebt gedaan.
2. **`git fetch origin main`** + **`git log HEAD..origin/main --oneline`**
   - Als de output niet leeg is: STOP. Pull eerst (`git pull --rebase origin main`).
3. **Grep alle referenties** naar symbolen die je gaat wijzigen of verwijderen:
   - `grep -n "<naam>" herling_analytics_home.html`
   - Geldt voor: functienamen, DOM IDs, CSS classes, state-keys.
4. **Lees het volledige blok** dat je gaat aanraken — niet alleen het stukje dat je
   denkt te wijzigen. CSS is cascade, JS is hoist/scope-gevoelig.

### Vóór elke push

1. **`node validate.mjs`** lokaal draaien — moet groen zijn.
2. **`git diff origin/main..HEAD`** doorlezen.
3. **NOOIT `git push --force`** zonder de gebruiker letterlijk om bevestiging
   te vragen. De hook blokkeert het anders.
4. Bij bevestigde force-push: `ALLOW_FORCE_PUSH=1 git push --force origin main`.

### Na een push

Vraag de gebruiker om **`Ctrl+Shift+R`** te doen op de live site. Eventueel
`test.html` openen voor een visuele smoke test.

## Setup voor een nieuwe machine

Eenmalig per nieuwe clone of nieuwe computer:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-push
```

Daarna draaien `node validate.mjs` en de pre-push hook automatisch.

## Tooling

| Bestand | Doel |
|---------|------|
| `validate.mjs` | JS syntax + tag balance + onclick-referentie checks |
| `test.html` | Open in browser → laadt app in iframe + 16 smoke tests |
| `.githooks/pre-push` | Blokkeert force-push en non-fast-forward, draait validate |
| `.claude/hooks/pre-tool-use.mjs` | Blokkeert Claude's gevaarlijke commando's |
| `.claude/hooks/post-edit-validate.mjs` | Draait validate na elke edit van het hoofdbestand |
| `.claude/settings.json` | Hook-registratie voor Claude Code |

## Bij problemen met loading / cache

Als Frank meldt "ik zie nog steeds de oude versie":
1. Eerst vragen: hard reload geprobeerd? (Ctrl+Shift+R)
2. Zo nee: dat eerst
3. Zo ja: check of er onverwacht een sw.js of cache in het spel is
4. Browser DevTools → Application → Service Workers → Unregister handmatig
5. Browser DevTools → Application → Storage → Clear site data
