---
description: Start parallelle agents op de vastgelegde moduleverdeling
argument-hint: [spoornamen, spatiegescheiden | leeg = alle vijf]
allowed-tools: Read, Glob, Grep, Agent, Bash(git status:*), Bash(git fetch:*), Bash(git log:*), Bash(git worktree:*), Bash(git branch:*), Bash(node parallel-check.mjs:*), Bash(node validate.mjs)
---

# Fan-out over de sporen

## Context

- Eigendomskaart: @.claude/ownership.json
- Projectregels: @CLAUDE.md
- Working tree: !`git status --short`
- Achterstand op origin: !`git fetch origin main --quiet; git log HEAD..origin/main --oneline`
- Bestaande worktrees: !`git worktree list`
- Openstaande spoor-branches: !`git branch --list "claude/*"`
- Huidige verdeling: !`node parallel-check.mjs kaart`

## Opdracht

Doelsporen: $ARGUMENTS (leeg = alle vijf: dashboard, notes, checklist, uren, facturen).

### Preflight — stop bij elke fout

1. **Achterstand op origin/main leeg?** Zo nee: stop, eerst pullen. Een fan-out
   vanaf een verouderde basis levert vijf worktrees die allemaal het verkeerde
   vertrekpunt hebben.
2. **Working tree schoon?** Zo nee: stop. De basis moet vastliggen voordat er
   vijf kopieën van gemaakt worden.
3. **Verweesde worktrees of spoor-branches van een vorige ronde?** Meld ze en
   vraag of ze weg mogen. Draai niet over oud werk heen.
4. **Zijn er contractwijzigingen nodig die je nú al kunt voorzien** — een gedeeld
   state-veld, een nieuwe knopmaat, een wijziging in `hydrateerState()`? Voer die
   eerst uit in *deze* sessie, commit ze apart, en start de fan-out daarna.
   Contracts horen bevroren te zijn vóór de sporen beginnen.

### Dispatch

⚠️ **Agent-definities worden bij sessiestart ingelezen.** Is `.claude/agents/`
in déze sessie aangepast of aangemaakt, dan kent de Agent-tool die namen nog
niet en krijg je "Agent type not found". Start dan een nieuwe sessie, of val
terug op een gewone subagent in een worktree die als eerste opdracht
`.claude/agents/<spoor>.md` leest en opvolgt.

Start per spoor één subagent via zijn definitie in `.claude/agents/<spoor>.md`.
Die definities dragen de scope, de verboden en de conventies al; herhaal ze niet,
maar geef mee:

- de concrete taak voor dát spoor, afgeleid uit mijn opdracht hieronder;
- de instructie om af te sluiten met `node validate.mjs` én
  `node parallel-check.mjs scope <spoor> --branch worktree`, allebei zonder
  fouten, gevolgd door een commit op de eigen branch;
- de instructie om een benodigde wijziging buiten scope **niet** te schrijven maar
  te beschrijven en terug te rapporteren.

**Draai ze parallel** — alle Agent-aanroepen in één bericht, niet na elkaar.

### Rapportage

Als alles terug is, lever één tabel:

`Spoor | Status | Ankers gewijzigd | validate | parallel-check | Contractverzoeken`

Groepeer daarna alle contractverzoeken. Vragen twee sporen dezelfde gedeelde
wijziging, benoem dat expliciet als partitiefout — dat betekent dat de grens op
de verkeerde plek ligt, en dat los je niet stil op.

Voer de contractwijzigingen zelf uit in **deze** sessie, niet in een worktree.
Draai daarna `/parallel-merge` om samen te voegen en te controleren.

---

**Taak per spoor:**

(beschrijf hier per spoor wat er gebouwd moet worden — of laat leeg en geef het
interactief door)
