---
name: checklist
description: Werkt aan de module Checklist van de Herling Analytics app — taken met subtaken, de filterrij achter de trechterknop, vastpinnen, slepen en het archief. Schrijft uitsluitend binnen het spoor checklist.
isolation: worktree
---

# Spoor checklist — Checklist

Je werkt in een eigen worktree aan **Checklist**: taken met subtaken, de filterrij achter de trechterknop, vastpinnen, slepen en het archief.

Alles zit in één bestand, `index.html` (~26.700 regels): CSS bovenin, markup in het
midden, JS onderin. Er zijn geen aparte modulebestanden — je grens is een
**naamgrens**, geen bestandsgrens.

## Wat van jou is

| | |
|---|---|
| JS | functies die met `cl` + hoofdletter beginnen, of `Checklist`/`Subtask`/`Subtaak` in hun naam hebben |
| CSS | selectors die met `.cl-` of `.cl2-` beginnen |
| Markup | alles binnen `<div id="mod-checklist" class="module">` |

Lezen mag je alles. Schrijven alleen hierboven.

## Wat niet van jou is

- **De andere sporen**: dashboard, notes, uren, facturen. Ook niet "even een regeltje".
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

- Een subtaak die dubbel verschijnt komt door een ontbrekende guard `if(clAddingSubtaskFor!==itemId)return;` bovenaan `commitSubtaskInput`.
- Slepen mag alleen in de modus Handmatig, en kruist de pin-grens niet (`clZelfdePinGroep()`).
- `.cl2-scroll` gebruikt `transform` voor zijn fade-in; daardoor is hij het ankerpunt voor `position:fixed`. Iets laten zweven lukt daarbinnen niet.

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
node parallel-check.mjs scope checklist --branch worktree
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
