# Beslissingen-log

Append-only log van significante design-, architectuur- en UX-beslissingen.

**Hoe te gebruiken**:
- Nieuwste entries bovenaan
- **Nooit oude entries wijzigen** — append-only. Als een beslissing achterhaald raakt: voeg een nieuwe entry toe die de oude vervangt en verwijs ernaar.
- Kort houden: 5–10 regels per entry. Voor diepe duiken: link naar `docs/<module>.md` of een commit-hash.
- Format: `## YYYY-MM-DD · Korte titel`, daarna *Probleem / Beslissing / Waarom / Bestanden / Niet doen*.

---

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
