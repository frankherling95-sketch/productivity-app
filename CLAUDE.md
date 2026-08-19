# Herling Analytics — Productivity App

Single-page productivity app voor Frank Herling. Single-file HTML SPA, gehost op GitHub Pages.
Toegang via Google-login (Workspace-domein `herling-analytics.nl`), data in Google Drive `appDataFolder`.

## Snel oriënteren

- **Repo**: `frankherling95-sketch/productivity-app` · branch `main`
- **Live URL**: https://app.herling-analytics.nl (eigen domein via GitHub Pages)
- **Auto-deploy**: elke push naar `main` → Pages-build (~30s)
- **Hoofd-bestand**: `index.html` (~580KB, ~12k regels) — alles inline, geen build step
- **Diepe duik agenda**: zie [`docs/agenda.md`](docs/agenda.md)
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
├── docs/agenda.md                ← deep-dive iCal/agenda
├── docs/decisions.md             ← append-only beslissingen-log (ADR-stijl)
├── validate.mjs                  ← Node syntax/structure checker
├── test.html                     ← browser smoke test
├── .githooks/pre-push            ← git hook (na `core.hooksPath` setup)
└── .claude/                      ← Claude Code config + hooks
```

## Modules (hash routing)

| Hash | Module | Functie |
|------|--------|---------|
| `#dashboard` | Dashboard | Hero + KPI strip + 2×2 grid (Todo/Notes/Checklist/Agenda) |
| `#todo` | Kanban | Projecten met kolommen, kaarten met klant/tags/category, drag-drop |
| `#notes` | Notes | Boomstructuur (folders/pages) met rich-text editor (marked.js) |
| `#agenda` | Agenda | iCal multi-source (week/dag/maand), zie `docs/agenda.md` |
| `#checklist` | Checklist | Taken met subtaken, filters (prio/klant/periode), drag-drop, archief |
| `#uren` | Uren | Urenregistratie per regel, week/maand, Excel export |
| `#facturen` | Facturen | Facturen uit geschreven uren, sjabloonbouwer, debiteuren, btw-overzicht, mailen via Gmail |

Entry render functions: `renderDashboard()`, `renderTodoModule()`, `renderNotesModule()`, `renderAgendaModule()`, `renderChecklistModule()`, `renderUrenModule()`, `renderFacturenModule()`. `renderAll()` wordt aangeroepen na elke `loadGist()`.

## State & persistence

```js
rawState = {
  tasks:    kanbanState,     // {projects, activeProject, clients, tags, categoryGrouping}
  notes:    notesState,      // {tree, activeId, collapsed}
  checklist: checklistState, // {items, showArchived, sortBy}
  uren:     urenState,       // {entries, templates}
  agenda:   {events: []},    // native (niet-iCal) events
  settings: { calSources, theme, ... }
}
```

**Item shapes** (snelle referentie):
- Kanban item: `{id, title, clientId, category, context, tags[], createdAt, updatedAt}`
- Checklist item: `{id, text, done, priority, deadline, clientId, subtasks[], archived, sortOrder}`
- Notes node (recursief): `{id, type:'page'|'folder', title, content, clientId, tags, children[]}`
- Klant: `{id, name, colorIdx}`
- iCal source: `{id, type:'ical', name, url, color, enabled}`

### Storage keys

| Constant | Doel |
|----------|------|
| `DRIVE_BESTAND` = `herling-analytics.json` | Bestand in Drive `appDataFolder` |
| `LS_LOGIN` = `herling_login` | Ingelogde gebruiker (e-mail + geldigheid) |
| `LS_BACKUP_KEY` = `herling_analytics_local_backup` | Volledige rawState backup |
| `LS_ICAL_EVENT_CACHE` = `herling_ical_event_cache_v2` | Per-feed parsed events (5mo window) |
| `LS_PROXY_CACHE_KEY` = `herling_ical_proxy_cache` | Per-feed werkende proxy |
| `LS_SYNC_KEY` = `herling_analytics_sync` | `gewijzigdOp`/`naarDriveOp` (lokale klok) + `driveTijd` (server-klok) |
| `LS_HERSTEL_KEY` = `herling_analytics_herstel` | Niet-gekozen versie na een conflict; ophalen met `herstelDownload()` |

### Save flow

De functienamen zijn historisch (`loadGist`/`saveGist`/`refreshGist`); ze praten met Google Drive, niet met GitHub.

1. State-mutatie → `scheduleSave()` → direct naar `localStorage` (vangnet) → 1500ms debounce → `saveGist()`
2. `saveGist()` is een wrapper met in-flight guard; het echte werk zit in `saveGistIntern()`. Er loopt er **hooguit één tegelijk** — een verzoek dat ondertussen binnenkomt wordt na afloop één keer ingehaald
3. Geschreven wordt het hele bestand, zonder merge (single-user). Wél wordt Drive's `modifiedTime` onthouden, zodat de volgende start weet of Drive sindsdien veranderd is
4. Bij een fout: de melding komt één keer, de wijziging staat lokaal en een herkansing loopt met backoff (5s/15s/60s/180s)
5. Bij een laadfout: terugvallen op de lokale back-up. `driveGelezen` wordt daarbij **niet** gereset — is Drive deze sessie al gelezen, dan blijft schrijven veilig
6. `beforeunload` en `visibilitychange` flushen pending saves
7. Er wordt niets meer versleuteld weggeschreven — de pincode is afgeschaft (2026-08-16). Ligt er nog een oud `rawState.geheim` in Drive, dan wordt dat één keer uitgepakt (vanzelf met de bewaarde apparaatsleutel, anders met de code) en daarna definitief plat opgeslagen; zie `pinVersleutelingWeg()`

⚠️ **De poort `geheimenKlaar()`**: zolang dat oude blok nog dicht is, is `factuurState`/`urenState` leeg. Zolang de poort dicht is mag niets die state wegschrijven — anders wist een lege state de administratie in Drive. Zie de entries van 2026-08-12 en 2026-08-16 in `docs/decisions.md`.

### Migratie functies

Lopen elke `loadGist()`. Bij toevoegen van een nieuw state-veld: voeg een hydratie-stap toe in `hydrateerState()` (zoek `if(!checklistState.items)` als voorbeeld) — dat is het enige laadpad.

| Functie | Wat |
|---------|-----|
| `migrateOldKanban(loaded)` | Flat-format → nieuwe structuur |
| `migrateCalSettings()` | `icalUrl` → `calSources[]` |

## UX-systemen

| Systeem | Doel |
|---------|------|
| `setSync(type, msg)` | Status-balk in sidebar (`idle\|saving\|saved\|error`) |
| `appToast(msg, opts)` | Floating toast met optionele undo-knop |
| `updateNavBadges()` | Tellingen naast Todo/Agenda/Checklist nav-items |
| Undo systeem | Verwijderacties tonen toast met "Ongedaan maken" |

## Theme

- `auto` (default, volgt `prefers-color-scheme`), `light`, `dark`, `schedule`
- Manual: `:root[data-theme="..."]`
- Voorkeur in `rawState.settings.theme`

**Color tokens**: `--navy #0F1B3D`, `--navy-dark #0A1330`, `--teal #0D3D3A`, `--mint #00E5B0`, plus `--bg/--surface/--text/--border/--accent/--danger` etc. Volledige set in regels 798–893.

## Mobile

- **Breakpoint**: `@media (max-width: 768px)`
- Bottom tab-bar (`#mobileNav`), sidebar als drawer, full-width modals, compactere topbars

## CSS conventies

Class-prefix per module: `.cl-` checklist, `.cal-` agenda, `.dash-` dashboard, `.col-` kanban, `.note(s)-` notes, `.uren-` uren, `.modal-`, `.btn-`, `.toast-`, `.nav-`, `.mod-` (generiek). Geen utility-classes, geen `!important` tenzij echt nodig.

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
- ⚠️ **Service Worker bestaat (`sw.js`)** — was eerder verwijderd vanwege caching-bugs, is nu (door pwa-feature-commits) terug. Stale-while-revalidate strategie. Bij "ik zie de oude versie" altijd eerst SW + caches in DevTools clearen.
- **Geen analytics, geen cookies**. Alle data privé in Drive + localStorage.
- **CORS-proxy** voor iCal: zie `docs/agenda.md` voor de 4-proxy chain.
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

Daarna: vraag Frank om **Ctrl+Shift+R** op de live site. Optioneel `test.html` openen voor smoke test.

**Branches**: voorkeur is direct naar `main`, maar **PRs zijn toegestaan** voor grotere/risicovolle wijzigingen (`gh pr create` of via web UI).

## Common patterns

**Nieuwe modaal**: `<div class="modal-bg" id="<naam>Modal"><div class="modal">...</div></div>` + `openXModal()`/`closeXModal()` JS functies. CSS classes bestaan al.

**Nieuw state-veld**: voeg toe aan initiële state, dan hydratie-stap in `hydrateerState()`. `saveGist()` neemt rawState in zijn geheel mee.

**Nieuwe checklist filter**: voeg sleutel toe aan `clFilters`, render-knop in `renderClFilterBar()`, filter-logica in `renderChecklistModule()`.

**Nav-badge updaten**: `updateNavBadges()` aanroepen na state-mutatie + ID + telling toevoegen aan de functie zelf.

## Bekende valkuilen

| Probleem | Oplossing |
|----------|-----------|
| Subtaak verschijnt dubbel | Guard met `if(clAddingSubtaskFor!==itemId)return;` aan top van `commitSubtaskInput` |
| iCal events ontbreken / dubbel | Zie `docs/agenda.md` — check RRULE/RECURRENCE-ID/EXDATE handling |
| "Ik zie de oude versie" | Eerst Ctrl+Shift+R; dan DevTools → Application → Service Workers → Unregister + Clear site data |
| Force-push verwijdert remote commits | **Eerst altijd `git fetch && git log HEAD..origin/main`** |
| `.claude/worktrees/...` heeft een kopie | Negeren — staat in `.gitignore`, agent-isolatie |
| Maandweergave krap bij drukke dag | Klik op datum → daganzicht |

## Recent gemaakte beslissingen

Top-3 meest recent. Volledige log + *waarom* per beslissing: [`docs/decisions.md`](docs/decisions.md).

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
| `test.html` | Open in browser → 16 smoke tests in iframe |
| `.githooks/pre-push` | Blokkeert force-push/non-fast-forward, draait validate |
| `.claude/hooks/pre-tool-use.mjs` | Blokkeert Claude's gevaarlijke commando's |
| `.claude/hooks/post-edit-validate.mjs` | Draait validate na elke edit van hoofd-bestand |
| `.claude/launch.json` | Preview-server config (`npx http-server` op poort 8765) |

## Privacy & security

- Toegang via Google-login; alleen accounts van `herling-analytics.nl` komen binnen
- Data in Drive `appDataFolder`: een verborgen map per gebruiker die alleen deze app kan lezen — geen URL, geen losse token
- Geen pincode-versleuteling meer (afgeschaft 2026-08-16) — `appDataFolder` is het slot. Alleen het uitpakpad voor een oud versleuteld blok staat er nog (PBKDF2 + AES-GCM, alleen ontsleutelen)
- iCal feeds via CORS-proxies — feed-URLs passeren een derde partij
- Geen telemetrie, geen externe API-calls behalve Google (Drive, Gmail, Fonts) + iCal feeds
- Tokens NIET in `.git/config` URL — gebruik Git Credential Manager (`git config --global credential.helper manager`)

## Glossarium

| Term | Betekenis |
|------|-----------|
| Klant / Client | Bedrijf/opdrachtgever — kleurgecodeerd |
| Module | Top-level sectie (Dashboard, Todo, ...) |
| Project | Kanban-bord (binnen Todo module) |
| Subtaak | Onderdeel van een Checklist-item |
| iCal source | `.ics` feed van Outlook/Google/Apple |
| Override | Recurring event-instance met afwijkende DTSTART/SUMMARY (zie `docs/agenda.md`) |
