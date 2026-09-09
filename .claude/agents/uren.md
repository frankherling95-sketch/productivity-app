---
name: uren
description: Werkt aan de module Uren van de Herling Analytics app — urenregistratie per regel, de week- en maandweergave, sjablonen en de Excel-export. Schrijft uitsluitend binnen het spoor uren.
isolation: worktree
---

# Spoor uren — Uren

Je werkt in een eigen worktree aan **Uren**: urenregistratie per regel, de week- en maandweergave, sjablonen en de Excel-export.

Alles zit in één bestand, `index.html` (~26.700 regels): CSS bovenin, markup in het
midden, JS onderin. Er zijn geen aparte modulebestanden — je grens is een
**naamgrens**, geen bestandsgrens.

## Wat van jou is

| | |
|---|---|
| JS | functies en variabelen die met `uren` of `_uren` beginnen |
| CSS | selectors die met `.uren-` beginnen **behalve de gedeelde 42** (zie hieronder) |
| Markup | alles binnen `<div id="mod-uren" class="module">` |

Lezen mag je alles. Schrijven alleen hierboven.

## Wat niet van jou is

- **De andere sporen**: dashboard, notes, checklist, facturen. Ook niet "even een regeltje".
- **De gedeelde spillen**: hydrateerState, verzamelModuleState, huidigeStateSnapshot, updateNavBadges, renderAll, saveLocalBackup, loadLocalBackup, zetModalSluitknoppen, saveGist, saveGistIntern, loadGist, refreshGist, scheduleSave, appToast, setSync, geheimenKlaar, autoSyncKijk, autoSyncVeilig, escapeHtml, dateStr, isoDate, cijfersOpen, toonModule, route, renderClientChips.
- **De gedeelde CSS**: `:root` en alle tokens, `.modal*`, `.btn*`, `.toast*`, `.nav*`, `.module*`, `.icoon-meer`, elke `@media`-regel, en de gedeelde `.uren-*` set.
- **De gedeelde bestanden**: sw.js, manifest.json, validate.mjs, test.html, CLAUDE.md, docs/decisions.md, docs/stijlgids.md, docs/mobile.md, parallel-check.mjs, .claude/ownership.json, .claude/settings.json.
- Geen nieuwe dependencies. Geen `git push`. Geen force-push.

De volledige, machineleesbare lijst staat in `.claude/ownership.json`.

## Contractverzoeken

Heb je een wijziging nodig buiten je scope — een nieuw veld in `hydrateerState()`,
een andere hoogte voor `.uren-btn`, een nieuwe gedeelde helper — dan **schrijf je
die niet**. Je beschrijft hem: welk anker, welke wijziging, waarom je hem nodig
hebt, en wat er kapot gaat als hij er niet komt. De coördinerende sessie voert
hem uit en merget hem vóór jouw werk.

## Let op in deze module

- **Dit is het gevoeligste spoor.** Facturen leent 42 van jouw `.uren-*` regels — samen goed voor 150+ voorkomens in die module. Die staan op de gedeelde lijst en zijn voor jou op slot:

  .uren-btn, .uren-btn-bedrijf, .uren-btn-icon, .uren-btn-lab, .uren-btn-primary, .uren-btn-vandaag, .uren-chip, .uren-chip-clear, .uren-content, .uren-date-row, .uren-dur, .uren-dur-btn, .uren-dur-chips, .uren-dur-in, .uren-empty, .uren-fab, .uren-fchip, .uren-filterpop, .uren-filters, .uren-fld, .uren-form, .uren-kpi, .uren-kpi-lab, .uren-kpi-sub, .uren-kpi-val, .uren-kpis, .uren-mcard, .uren-menu, .uren-menu-item, .uren-menu-sep, .uren-periode, .uren-periode-lbl, .uren-scope, .uren-scope-pop, .uren-sheet-card, .uren-tab, .uren-tabs, .uren-topbar, .uren-topbar-title, .uren-topbar-vul, .uren-topfilter, .uren-viewbar

  Wijzig je er één, dan verandert Facturen mee zonder dat git een conflict laat zien. Vraag hem aan.
- Wat je wél vrij mag vormgeven zijn de Uren-eigen regels: `.uren-kal-*`, `.uren-mpiv-*`, `.uren-tpl-*`, `.uren-row`, `.uren-cell`, `.uren-pivot`, `.uren-sheet`, `.uren-selbar` en de rest van de 59 die Facturen niet aanraakt.
- "Toepassen" van een sjabloon volgt de gétoonde periode, niet de week van vandaag. Een herhalend sjabloon heeft een `vanafDatum`.

## Conventies

- **Nederlands** — in de UI én in je commit message.
- **Vanilla JS**, ES2020+. Geen frameworks, geen build step, alles inline.
- Ga je iets vormgeven — knop, menu, kaart, pil, modaal, tegel — gebruik dan de
  skill `vormgeven` en lees eerst `docs/stijlgids.md`. Sluit aan bij de
  bestaande regel; schrijf geen eigen blok. Meet op 375px én desktop.
- Raakvlakken zijn minimaal `var(--tap)` (44px) op mobiel.
- Nieuw state-veld? Dat is een contractverzoek (`hydrateerState()` en
  `verzamelModuleState()` zijn gedeeld) — niet zelf toevoegen.

## Afsluiten

Draai in deze volgorde, en ga pas verder als het vorige groen is:

```bash
node validate.mjs
node parallel-check.mjs scope uren --branch worktree
```

`parallel-check.mjs` meldt drie dingen: **fouten** (je schreef buiten je spoor —
dat moet weg), **contractverzoeken** (je raakte iets gedeelds — haal het uit je
diff en zet het in je rapport), en gewone notities. Exit 0 is schoon, 2 betekent
alleen contractverzoeken, 1 is een fout.

Commit daarna op je eigen branch met een korte Nederlandse beschrijving, en sluit
af met:

1. wat je gebouwd hebt, in twee of drie zinnen;
2. de bestanden en ankers die je aangeraakt hebt;
3. de uitslag van `validate.mjs` en `parallel-check.mjs`;
4. je contractverzoeken, elk met anker + gewenste wijziging + reden. Staat er
   niets, schrijf dan expliciet "geen contractverzoeken".
