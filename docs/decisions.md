# Beslissingen-log

Append-only log van significante design-, architectuur- en UX-beslissingen.

**Hoe te gebruiken**:
- Nieuwste entries bovenaan
- **Nooit oude entries wijzigen** — append-only. Als een beslissing achterhaald raakt: voeg een nieuwe entry toe die de oude vervangt en verwijs ernaar.
- Kort houden: 5–10 regels per entry. Voor diepe duiken: link naar `docs/<module>.md` of een commit-hash.
- Format: `## YYYY-MM-DD · Korte titel`, daarna *Probleem / Beslissing / Waarom / Bestanden / Niet doen*.

---

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
