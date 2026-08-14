# Beslissingen-log

Append-only log van significante design-, architectuur- en UX-beslissingen.

**Hoe te gebruiken**:
- Nieuwste entries bovenaan
- **Nooit oude entries wijzigen** — append-only. Als een beslissing achterhaald raakt: voeg een nieuwe entry toe die de oude vervangt en verwijs ernaar.
- Kort houden: 5–10 regels per entry. Voor diepe duiken: link naar `docs/<module>.md` of een commit-hash.
- Format: `## YYYY-MM-DD · Korte titel`, daarna *Probleem / Beslissing / Waarom / Bestanden / Niet doen*.

---

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
