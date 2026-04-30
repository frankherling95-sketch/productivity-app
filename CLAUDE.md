# Herling Analytics — Productivity App

Single-page productivity app voor Frank Herling. Single-file HTML SPA, gehost op GitHub Pages, data in een private GitHub Gist.

## Wie is de gebruiker

- **Eén gebruiker, één omgeving tegelijk.** Frank werkt vanuit meerdere computers, maar nooit tegelijkertijd op twee apparaten met de app open.
- **Taal: Nederlands.** Alle UI-tekst en commit messages in het Nederlands.
- **Force-pushes zijn toegestaan** op `main` — geen team, geen reviews.

## Architectuur

**Eén bestand**: `herling_analytics_home.html` — alles inline (HTML + CSS + JS, vanilla JavaScript, geen build step). Wijzigingen gaan altijd hierin tenzij expliciet anders gevraagd.

```
.
├── herling_analytics_home.html   ← DE app (alle wijzigingen hier)
├── index.html                    ← redirect stub naar hoofdbestand
├── bi_checklist_kanban.html      ← redirect stub (legacy URL)
├── herling-icon.svg              ← logo + favicon
├── CLAUDE.md                     ← dit bestand
└── .claude/                      ← Claude Code config + worktrees (niet aanraken)
```

### Modules (hash routing)

| Hash | Module | Functie |
|------|--------|---------|
| `#dashboard` | Dashboard | 2×2 grid: Todo / Notes / Agenda / Checklist overzicht |
| `#todo` | Kanban | Projecten, kolommen, kaarten met klant/tags |
| `#notes` | Notes | Boomstructuur met rich-text editor (marked.js) |
| `#agenda` | Agenda | iCal multi-source (week/dag/maand views) |
| `#checklist` | Checklist | Taken met subtaken, filters, drag-and-drop |

### State & persistence

```js
rawState = {
  tasks: kanbanState,        // {projects, activeProject, clients, tags, categoryGrouping}
  notes: notesState,         // {tree, activeId, collapsed}
  checklist: checklistState, // {items, showArchived, sortBy}
  settings: {...}            // {calSources, calMode, theme, ...}
}
```

**Opslag**:
1. **Primair**: GitHub Gist (`bi_checklist_kanban.json`), één bestand per gebruiker
2. **Backup**: `localStorage` onder key `herling_analytics_local_backup` (instant, geen netwerk)

**Save flow**:
- Elke state-wijziging roept `scheduleSave()` aan
- `scheduleSave()` → schrijft direct naar localStorage (vangnet) → 1500ms debounce → `saveGist()`
- `saveGist()` doet `PATCH /gists/:id` zonder conflict-check (single-user → altijd overschrijven)
- Bij netwerkfout: 5s retry, error in sync-balk, data blijft in localStorage
- Bij Gist-load fout: fallback naar localStorage backup

**Belangrijk**: Geen conflict-detectie. Frank werkt op één apparaat tegelijk; alles wat hij invoert is per definitie de bron van waarheid.

## Belangrijke conventies

- **Geen externe build step** — alles inline, geen bundlers/transpilers/preprocessors.
- **Vanilla JS** — geen frameworks. jQuery niet, React niet, Vue niet.
- **Externe libs**: alleen via CDN in `<head>`: `xlsx`, `marked`, Google Fonts (Inter).
- **Geen Service Workers**. Een eerdere SW met stale-while-revalidate caching zorgde voor een hardnekkige bug waarbij browsers oude HTML bleven serveren. **Niet opnieuw introduceren** zonder expliciete vraag.
- **Geen Google OAuth meer** — agenda is iCal-only (`type:'ical'` in `calSources`). Werkt voor Outlook, Google iCal, Apple Calendar, etc.
- **CORS-proxy** voor iCal: `https://corsproxy.io/?<encoded_url>`.
- **Drag-and-drop**: HTML5 native (`draggable="true"`), geen externe library.
- **iCal RRULE**: zelf geparseerd in `expandEvents()`. DAILY / WEEKLY / MONTHLY / YEARLY ondersteund. UNTIL en COUNT ondersteund.

## Workflow

1. Frank vraagt een feature/fix
2. Edit `herling_analytics_home.html`
3. Commit met Nederlandse beschrijving
4. `git push origin main`
5. Frank doet hard reload (Ctrl+Shift+R) op de GitHub Pages site

```bash
git add herling_analytics_home.html
git commit -m "Korte Nederlandse beschrijving"
git push origin main
```

## Bekende valkuilen

| Probleem | Oorzaak | Oplossing |
|----------|---------|-----------|
| Subtaak verschijnt dubbel | Enter triggert commit + blur triggert ook commit | Guard met `if(clAddingSubtaskFor!==itemId)return;` aan top van `commitSubtaskInput` |
| iCal events ontbreken | MONTHLY/YEARLY RRULE niet uitgebreid | `expandEvents()` heeft branches voor MONTHLY/YEARLY; ook overlap-check op start/end |
| Maandweergave kapt af op 3 events | Oude UX-keuze "+X meer" | Verwijderd — alle events worden nu getoond, pills worden compacter bij 4+ en 7+ |
| Service Worker cachet oude HTML | Eerdere PWA-poging | NIET opnieuw doen. Geen sw.js / manifest.json toevoegen tenzij Frank expliciet vraagt |
| `.claude/worktrees/...` heeft een kopie van de app | Parallelle agent-sessies | Negeren — geen edits daar |

## Recent gemaakte beslissingen

- **2026-04-30**: Service Worker permanent verbannen (caching-bug)
- **2026-04-30**: localStorage als instant backup toegevoegd, conflict-detectie definitief verwijderd
- **2026-04-30**: Checklist filters (prio/klant/periode), subtaken bewerkbaar, auto-close bij alle subtaken klaar
- **2026-04-30**: Agenda iCal-only, onbeperkt aantal bronnen via `calSources` array
- **2026-04-30**: Dashboard 2×2 grid, Checklist-kaart toegevoegd

## Bij problemen met loading / cache

Als Frank meldt "ik zie nog steeds de oude versie":
1. Eerst vragen: hard reload geprobeerd? (Ctrl+Shift+R)
2. Zo nee: dat eerst
3. Zo ja: check of er onverwacht een sw.js of cache in het spel is
4. Browser DevTools → Application → Service Workers → Unregister handmatig
5. Browser DevTools → Application → Storage → Clear site data
