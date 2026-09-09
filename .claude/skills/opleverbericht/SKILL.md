---
name: opleverbericht
description: Sluit elke oplevering af met een kort blok "Opgeleverd" in bullets. Gebruik dit zodra je een wijziging, nieuwe functionaliteit, bugfix of opschoning aflevert — dus bij elk antwoord waarin code is gewijzigd, gecommit of gepusht, ook als het maar één regel was. Niet gebruiken bij een puur informatief antwoord zonder wijziging.
---

# Opleverbericht

Frank leest het antwoord vaak op een ander apparaat dan waarop hij werkt, en
soms pas later. Het verhaal erboven legt uit *waarom*; de bullets onderaan zijn
waar hij op terugkijkt om te weten *wat* er nu anders is.

## De regel

Elk antwoord waarin je iets hebt opgeleverd eindigt met:

```markdown
## Opgeleverd

- **Toegevoegd** — …
- **Gewijzigd** — …
- **Opgelost** — …
```

- **Drie tot zeven bullets.** Meer betekent dat je het verhaal herhaalt.
- **Eén regel per bullet.** Geen subbullets, geen alinea's.
- **Begin met het soort**: Toegevoegd · Gewijzigd · Opgelost · Verwijderd ·
  Opgeruimd. Dan in gewone taal wat het is, en waar het zit (welke module,
  welk scherm).
- **Nederlands**, zoals de rest van de app.
- **Geen functienamen of selectors** in de bullets. Die horen in het verhaal
  erboven of in `docs/decisions.md`, niet in de terugblik.

## Wat er ook in hoort

- **Wat je bewust níet hebt gedaan.** Uitgesteld, geblokkeerd, buiten scope
  gelaten — één bullet, met de reden in een halve zin. Anders denkt hij dat het
  af is.
- **Wat hij zelf moet doen.** Een harde herlaadactie, akkoord geven op een push,
  een keuze die nog openstaat.

## Wanneer níet

Bij een vraag die je alleen beantwoordt, een uitleg, een verkenning of een
voorstel dat nog niet gebouwd is. Er is dan niets opgeleverd, en een leeg
kopje "Opgeleverd" maakt het antwoord alleen langer.

## Voorbeeld

```markdown
## Opgeleverd

- **Toegevoegd** — Bladeren tussen facturen: pijltjes in de kop van de editor,
  met "3 van 12", ook met ↑ en ↓ op je toetsenbord
- **Toegevoegd** — Sorteren op kolomkop in de facturenlijst (alleen op een
  bureaublad; op een telefoon staat die tabel er niet)
- **Gewijzigd** — De cijfertegels van de analyse zitten nu achter dezelfde
  uitklapbalk als op de andere tabbladen
- **Niet gedaan** — De dode mobiele CSS-regels van de oude KPI-strip; die
  ruim ik apart op, niet in dezelfde merge
- **Voor jou** — Ctrl+Shift+R op de live site, twee keer (de service worker is
  mee gewijzigd)
```
