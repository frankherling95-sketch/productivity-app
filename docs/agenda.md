# Agenda module — deep-dive

Het agenda-subsysteem is verreweg het meest complexe stuk van de app. Dit document legt uit hoe iCal-feeds worden opgehaald, gecached, geparseerd en gerenderd.

## Bron-strategie

- **Alleen iCal**, geen OAuth (MSAL/Graph en Google Identity Services zijn **bewust verwijderd** in commit `4f88c0c` — Frank heeft geen Entra/Azure-rechten in klant-tenants).
- **Outlook agenda koppelen**: Outlook web → Settings → Calendar → Shared calendars → Publish a calendar → kopieer ICS-link → plak in app via "+ iCal link toevoegen".
- **Vertraging**: Microsoft cached gepubliceerde feeds, updates lopen 15–30 min achter.
- **NIET opnieuw introduceren** zonder expliciete vraag: MSAL, Google Identity Services, `accounts[]`-gebaseerde OAuth flows.

## Drie-laags fetch-architectuur

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Stap 1: instant  │───►│ Stap 2: snel     │───►│ Stap 3: fallback │
│                  │    │                  │    │                  │
│ Event cache      │    │ Proxy cache      │    │ Parallel race    │
│ localStorage     │    │ localStorage     │    │ 4 proxies        │
│ (per URL, 5mo)   │    │ (welke proxy)    │    │ Promise.any      │
│                  │    │                  │    │                  │
│ ~1ms             │    │ ~3-4s            │    │ ~3-4s (1e fetch) │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### Laag 1 — Event cache (`herling_ical_event_cache_v2`)

- Per source URL: `{events: [...], fetchedAt: ms}`
- **Window**: vandaag −2 maanden tot vandaag +3 maanden (5-maands strikt). Buiten deze range geen events.
- **TTL**: 10 minuten "fresh".
- **Stale-while-revalidate**: bij stale cache → return cached **en** start background refresh + auto re-render zodra fresh data binnen is.
- **Auto-eviction** bij localStorage-quota: oudste entries eerst.
- Versionering via `_v2` suffix; oude `herling_ical_event_cache` key wordt eenmalig opgeruimd.

### Laag 2 — Proxy cache (`herling_ical_proxy_cache`)

- Per source URL: welke proxy het werkte.
- Op fetch: probeer eerst de gecachte proxy (1 request, ~3s).
- Bij failure: wis cache-entry voor die URL, val terug op laag 3.

### Laag 3 — Parallel proxy race

`fetchICalText(url, sourceName)` start alle 4 proxies tegelijk via `Promise.any`, eerste valide response wint en wordt gecached:

| # | Proxy | Eigenschap |
|---|-------|------------|
| 1 | `corsproxy.io/?` | Snelst, maar ~1MB limit (HTTP 413 op grote feeds) |
| 2 | `api.allorigins.win/raw?url=` | Grote payloads, soms door MS geblokkeerd |
| 3 | `api.allorigins.win/get?url=` | Zelfde service, JSON-wrapped — ander pad |
| 4 | `api.codetabs.com/v1/proxy?quest=` | Andere infra, werkt waar #2/#3 falen (bv. Boskalis) |

- **12s timeout per proxy** via `AbortController`.
- **Error-aggregatie**: bij volledige fail toont de Error alle proxy-uitkomsten.
- **Diagnostics**: `console.info` log met `[iCal] {sourceName} via {proxy} ({KB})`.

## Recurrence parsing

### `parseICS()`

Begrijpt deze velden per VEVENT:
- `DTSTART`, `DTEND` (met TZID-aware datum-parsing)
- `SUMMARY`, `LOCATION`, `STATUS`
- `RRULE` (raw string, geparseerd in expandEvents)
- `UID` — voor master/override koppeling
- `RECURRENCE-ID` — markeert dit VEVENT als override van een specifieke occurrence
- `EXDATE` — array van excluded occurrences (kan komma-gescheiden zijn)

### `expandEvents(events, fromDate, toDate)` — 3 stappen

1. **Splits in masters + overrides**: events met `recurrenceId` zijn overrides en worden gegroepeerd per UID, geïndexeerd op `recurrenceId.date.getTime()`.
2. **Master-RRULE expanderen**: voor elke master itereer occurrences en SKIP wanneer:
   - `EXDATE` matcht (excluded)
   - Een override bestaat voor die occurrence-tijd (override neemt het over)
3. **Overrides apart toevoegen** met hun gewijzigde DTSTART/SUMMARY/LOCATION; CANCELLED overrides worden gefilterd.

Plus defensieve **dedup-Set** keyed op `(UID, occurrence-time)` voor pathologische iCal-data.

**Ondersteunde RRULE FREQ**: DAILY, WEEKLY, MONTHLY, YEARLY. UNTIL en COUNT respected. INTERVAL respected.

**Niet ondersteund**: BYDAY, BYMONTHDAY, BYSETPOS — events met deze rules expanderen alleen op de DTSTART weekdag/datum. Voor de meeste Outlook-events is dit voldoende.

## Rendering

### Entry functions

| View | Function | Locatie |
|------|----------|---------|
| Dag | `renderDayGrid(events, day, container)` | regel ~10713 |
| Week | `renderWeekGrid(events, weekStart, container)` | regel ~11201 |
| Maand | `renderMonthGrid(events, monthStart, container)` | regel ~10746 |

Elk start met `_clearCalTooltipData()` om de tooltip-Map te resetten.

### Event-block layout

`evBlockHtml({ev, top, height, timeStr, col, totalCols})`:
- Block ≤26px hoog: `cal-ev-short` modifier — tijd + titel inline
- Block >26px: tijd in mono boven (10px), titel daaronder (Plus Jakarta Sans, 11.5px)
- Background: 22% transparante `_calColor`, border-left in volle kleur
- Hover: lift + soft shadow + z-index 5

### Tooltip systeem

- Custom popover (`.cal-ev-tooltip`) ipv native `title` attribuut — instant + gestyled
- 220ms hover-delay voorkomt flikker
- Toont: **bron** (kleurpunt + naam), **titel**, **datum + tijd + duur**, **locatie**, en voor native events de hint "klik om te bewerken"
- Smart positioning: rechts van block, flip naar links bij viewport-rand
- Hide on: mouseout, scroll, window blur

## Dashboard agenda-card

`fetchDashIcalCal(body)` (regel ~11329) hergebruikt **dezelfde** `fetchSourceEvents()` als de agenda module:
- Window: vandaag tot +14 dagen
- Cache wordt gedeeld met agenda module → instant data zodra een van beide eerder is geladen

## Native events (rawState.agenda.events[])

Lokaal aangemaakte/bewerkte afspraken — los van iCal-feeds, gesyncd via Gist.

**Shape**:
```js
{ id, title, allDay, start, end,    // start/end: 'YYYY-MM-DDTHH:MM' of 'YYYY-MM-DD'
  location, description, color, clientId,
  recurrence: null | {              // optioneel
    freq: 'DAILY'|'WEEKLY'|'MONTHLY'|'YEARLY',
    interval: 1,                    // elke N units
    until?: 'YYYY-MM-DD',           // optionele einddatum
    count?: number                  // alternatief: stoppen na N keer
  },
  createdAt, updatedAt }
```

**Render-pad**: `getNativeEventsInRange(timeMin, timeMax)` (regel ~10293) doet ofwel een single-event window check, ofwel expandeert recurring events naar individuele occurrences — vergelijkbaar met `expandEvents` voor iCal maar simpeler omdat we geen RECURRENCE-ID overrides hebben (single-user).

**Edit-semantiek**: bewerken van een herhalende afspraak wijzigt de **hele serie**. Per-instance overrides (zoals iCal RECURRENCE-ID) zijn niet ondersteund voor v1 — feature voor later als Frank dat nodig heeft.

**Geen BYDAY/BYMONTHDAY**: maandelijks = "elke X maand op dezelfde dag-van-de-maand" via `setMonth(getMonth()+interval)`. Voor "elke 2e dinsdag" is BYDAY+BYSETPOS nodig — niet geïmplementeerd.

## Bekende beperkingen / verbeterpunten

- **Maandweergave**: bij erg drukke dagen (>10 events) wordt het krap — adaptive pill-grootte heeft limieten.
- **iCal-recurrence editing**: alleen lezen vanuit feeds, niet bewerken.
- **Native recurrence per-instance edit**: niet ondersteund (hele serie wijzigt).
- **Drag-drop voor herplannen**: niet geïmplementeerd.
- **TZID handling in parser**: huidige `parseICSDate` ignoreert TZID en gebruikt naive local time. Werkt voor de meeste cases, maar DST-overgangen kunnen 1-uur drift geven (overrides aligned met masters via dezelfde drift, dus geen duplicate-issues).
