---
description: Controleert de sporen, voegt ze samen en bewijst dat de app heel is
argument-hint: [spoornamen in merge-volgorde | leeg = alle branches claude/*]
allowed-tools: Read, Glob, Grep, Edit, Bash(git *), Bash(node parallel-check.mjs:*), Bash(node validate.mjs), Bash(npx --yes http-server:*)
---

# Samenvoegen en controleren

## Context

- Eigendomskaart: @.claude/ownership.json
- Spoor-branches: !`git branch --list "claude/*"`
- Working tree: !`git status --short`
- Achterstand op origin: !`git fetch origin main --quiet; git log HEAD..origin/main --oneline`

## Opdracht

Sporen: $ARGUMENTS (leeg = elke branch `claude/*` die vóór `main` uit loopt).

Git merget `index.html` per hunk en doet dat goed zolang twee sporen ver uit
elkaar schrijven. Waar het misgaat is het geval waarin **beide merges schoon zijn
en de app tóch stuk is**: spoor uren zet `.uren-btn` op 34px, Facturen gebruikt
diezelfde regel 57 keer, en niemand krijgt een conflict te zien. Deze hele
procedure bestaat om dat geval te vangen. Sla geen stap over en ga niet door op
een rode uitslag.

### Stap 1 — Controleer elk spoor apart, vóór je iets merget

Per spoor:

```bash
node parallel-check.mjs scope <spoor>
```

Uitslag lezen:

- **fouten** (exit 1) — het spoor heeft buiten zijn grenzen geschreven. Niet zelf
  gladstrijken: stuur de agent terug met `SendMessage` en laat hem het zelf
  terugdraaien, of draai de betreffende hunk terug en meld dat in het rapport.
  Merge dit spoor niet zolang hier iets rood staat.
- **contractverzoeken** (exit 2) — het spoor raakte iets gedeelds aan. Haal die
  hunk uit zijn branch en verzamel de wijziging voor stap 3.
- **schoon** (exit 0) — klaar om te mergen.

### Stap 2 — Botsen de sporen onderling?

```bash
node parallel-check.mjs overlap <spoor> <spoor> ...
# heet de branch niet claude/<spoor>, zoals bij een worktree:
node parallel-check.mjs overlap uren=<branch> facturen=<branch>
```

Raken twee sporen hetzelfde anker aan, dan is dat geen mergeprobleem maar een
**partitiefout**: de grens ligt op de verkeerde plek. Benoem dat, los het op door
de wijziging naar het contract te tillen (stap 3), en noteer of
`.claude/ownership.json` bijgesteld moet worden.

### Stap 3 — Contractwijzigingen eerst, in deze sessie

Voer alle verzamelde contractwijzigingen hier uit, sequentieel, op `main`, in één
aparte commit met een boodschap die zegt wat het contract nu is. Dit is het enige
moment waarop gedeelde ankers bewerkt worden. Daarna pas mergen — zo bouwt elk
spoor op hetzelfde contract in plaats van erlangs.

### Stap 4 — Mergen, in afhankelijkheidsvolgorde

Merge in de volgorde die ik opgeef, of anders: eerst het spoor waarvan de anderen
iets lenen, daarna de rest, dashboard als laatste (dat leest uit alle modules).

Bij een conflict: los het op door **beide** bedoelingen te behouden, niet door er
één te laten winnen. Kan dat niet, stop en leg het voor.

### Stap 5 — De validatieslag

Pas als alles gemerged is, in deze volgorde:

```bash
node parallel-check.mjs merge
```

Die controleert drie dingen tegelijk: geen achtergebleven conflictmarkers,
`validate.mjs` groen, en — het punt van de hele exercitie — voor elk anker dat
íémand gewijzigd heeft: wordt het ook door een andere module gebruikt? Elke regel
die daar uitkomt is een module die je moet nakijken, ook al klaagde git niet.

```bash
node parallel-check.mjs stijl
```

Meet de berekende stijl van alle gedeelde selectors op vier combinaties
(desktop/mobiel × licht/donker) vóór en na, met headless Chrome. Elk verschil dat
hier opduikt terwijl niemand een contractwijziging heeft aangevraagd, is precies
het stille conflict waar dit voor bedoeld is. Duurt ongeveer vijf seconden.

Draai daarna de bestaande testsuite:

```bash
npx --yes http-server . -p 8765 -c-1 --silent
```

en open `http://localhost:8765/test.html` (72 smoke-, sync-, model- en
sorteertests). Via `file://` schermt de browser de iframe af.

Bekijk tot slot elke gewijzigde module in de preview op **375px én desktop**, in
licht en donker. Voor de sporen die iets vormgegeven hebben: voor/na naast
elkaar.

### Stap 6 — Afronden

Pas als stap 5 helemaal groen is:

1. Bump `CACHE_NAME` in `sw.js` — één keer, hier, niet per spoor.
2. Schrijf één entry in `docs/decisions.md` per conceptuele beslissing, in het
   bestaande format (`## YYYY-MM-DD · Titel`, met Probleem / Beslissing / Waarom
   / Bestanden / Niet doen). Append bovenaan. Agents schrijven daar nooit zelf in
   — dan botst elke ronde op regel 13.
3. Vraag mij om akkoord vóór `git push origin main`.
4. Ruim op:

```bash
git worktree list
git worktree remove .claude/worktrees/<naam>
git worktree prune
git branch -d claude/<spoor>
```

5. Vraag me om **Ctrl+Shift+R** op https://app.herling-analytics.nl. Na een
   gewijzigde `sw.js` is er nog één extra herlading nodig voor de nieuwe worker
   het overneemt.

### Rapportage

Sluit af met één tabel — `Spoor | Gemerged | Conflicten | Ankers | Nagekeken
modules` — en daaronder wat er uit `parallel-check.mjs stijl` kwam, ook als dat
"geen verschillen" is. Dat laatste is het bewijs dat de merge visueel niets
heeft gedaan wat niemand gevraagd had.
