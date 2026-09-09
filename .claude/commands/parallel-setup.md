---
description: Herijkt de moduleverdeling als de code is verschoven (nieuwe module, nieuwe gedeelde CSS)
argument-hint: [gewenst aantal sporen | leeg = de huidige vijf herijken]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git *), Bash(node parallel-check.mjs:*), Bash(node validate.mjs), Bash(ls:*), Bash(grep:*), Bash(awk:*)
---

# Moduleverdeling herijken

De verdeling staat al: vijf sporen in `.claude/ownership.json`, agent-definities
in `.claude/agents/`, de leesbare tabel in `CLAUDE.md`. Dit commando is er om die
verdeling **opnieuw te toetsen aan de code**, niet om hem van nul op te bouwen.

Draai het als er een module bij is gekomen of verdwenen, als een spoor te groot is
geworden om in één keer te bewerken, of als `parallel-check.mjs` structureel
dingen meldt die geen echt contract zijn.

## Context

- Huidige verdeling: @.claude/ownership.json
- Zoals de code er nu bij ligt: !`node parallel-check.mjs kaart`
- Modulecontainers in de markup: !`grep -n 'id="mod-' index.html`
- Working tree: !`git status --short`

## Harde regels

1. **Je schrijft geen productiecode.** Alleen `.claude/ownership.json`,
   `.claude/agents/*.md` en de ownership-sectie in `CLAUDE.md`.
2. **Stop na fase 0 en wacht op akkoord.** Niet doorlopen naar fase 1.
3. **Verzin geen grenzen die niet in de code bestaan.** Meet ze. Een module
   bestaat pas als er een `#mod-`container, een functie-prefix én een
   selector-prefix bij horen.
4. De partitie is het enige dat er echt toe doet; de rest is boekhouding.

---

## Fase 0 — Meten en voorstellen

Lever exact deze vier onderdelen.

### 0.1 Wat is er verschoven

Vergelijk de uitslag van `parallel-check.mjs kaart` met wat er in
`ownership.json` staat. Benoem concreet: welke ankers zijn van eigenaar
gewisseld, welk spoor is gegroeid, hoeveel ankers zijn nu "onbekend" en of dat
meer of minder is dan eerst.

### 0.2 Nieuwe choke points

Zoek expliciet naar CSS-regels die door meer dan één module gebruikt worden — dat
is in dit bestand de gevaarlijkste soort, want git ziet er niets van. Meet het,
schat het niet:

```bash
# welke classes van module A komen voor in de regio van module B
awk 'NR>=<van> && NR<=<tot>' index.html | grep -o "<prefix>-[a-z0-9-]*" | sort -u
```

Kijk daarnaast naar: gedeelde helpers die inmiddels vanuit twee modules
aangeroepen worden, nieuwe `@media`-blokken waarin meerdere modules staan, en
nieuwe velden in `hydrateerState()` / `verzamelModuleState()`.

Per choke point: welke sporen eraan raken, en of het te splitsen is (een eigen
`.fac-`variant naast de gedeelde regel) of gedeeld moet blijven.

### 0.3 Voorstel

Per spoor: naam, JS-signaal, CSS-signaal, markup-container, en wat het spoor
**niet** mag aanraken. Overlap in eigendom is niet toegestaan. Krijg je dat niet
rond bij het gevraagde aantal, zeg dat en stel er minder voor.

Geef ook aan wat er bij de **gedeelde** lijst bij moet of af kan.

### 0.4 Serialisatieplan

Welke wijzigingen moeten sequentieel gebeuren vóór de volgende fan-out: gedeelde
types, nieuwe state-velden, een gedeelde knopmaat die uit elkaar getrokken moet
worden. Concreet en klein houden.

**Stop hier. Vraag om akkoord of correctie.**

---

## Fase 1 — Wegschrijven

Pas na akkoord. Toon per bestand een diff voordat je schrijft.

1. `.claude/ownership.json` — de sporen, de signalen, de gedeelde lijst. Dit is
   de bron; `parallel-check.mjs` leest hem.
2. `.claude/agents/<spoor>.md` per spoor — frontmatter met `name`, `description`
   en `isolation: worktree`; body met scope, verboden, de valkuilen van díé
   module, en de afsluitroutine (`validate.mjs` + `parallel-check.mjs scope`).
3. De sectie `## Module ownership` in `CLAUDE.md` — de leesbare tabel. Voeg toe,
   overschrijf het bestand niet.

Controleer daarna dat de kaart klopt met wat je bedoelde:

```bash
node parallel-check.mjs kaart
```

## Fase 2 — Contracts vastzetten

Voer het serialisatieplan uit 0.4 uit in **deze** sessie, sequentieel, in een
aparte commit. Dit is het enige moment waarop gedeelde ankers bewerkt worden.

## Fase 3 — Startklaar melden

Lever tot slot de opdracht waarmee ik de ronde begin (`/parallel-fanout <sporen>`),
de voorgestelde merge-volgorde met de reden erbij, en waar ik bij de review op
moet letten als een spoor buiten zijn scope heeft geschreven.
