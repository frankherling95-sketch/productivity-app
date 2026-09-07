---
name: vormgeven
description: Werkwijze voor elk vormgeefwerk aan de Herling Analytics app — een knop, menu, kaart, pil, modaal, tegel, tabstrip, kleur, maat, spacing of mobiele weergave. Gebruik dit bij "maak X mooier", "past niet op mobiel", "knop is te groot", "andere kleur", "opnieuw indelen", of elke wijziging in het `<style>`-blok van index.html. Ook bij nieuwe UI-onderdelen.
---

# Vormgeven aan deze app

De app is voor een groot deel **dezelfde soort knop met een andere tekst**.
Consistentie is daarom belangrijker dan een mooie losse oplossing. De maten
liggen vast; jouw werk is aansluiten, niet opnieuw bedenken.

## 1. Lees eerst, dan pas typen

Vóór je één CSS-regel schrijft:

- **[`docs/stijlgids.md`](../../../docs/stijlgids.md)** — per soort onderdeel
  (icoonknop, tekstknop, FAB, menu, KPI-kaart, taakkaart, lijstkaart, pil,
  invoerveld, modaal) de maat, het gewicht en het token. Plus §9 *Bekende
  afwijkingen* en §10 *Hoe je dit controleert*.
- **[`docs/mobile.md`](../../../docs/mobile.md)** — de mobiele schaal, de vaste
  plekken op een telefoon, en de regels achter `--tap` en `--icoon`.

Die twee bestanden zijn de bron. Deze skill herhaalt de getallen bewust niet:
twee bronnen lopen uit elkaar, één niet. Wijkt de code af van de gids, dan
heeft de gids gelijk — of de gids is verouderd en dan pas je hem aan.

## 2. Sluit aan bij de bestaande regel

Hoort het nieuwe onderdeel bij een soort die al bestaat, zet je selector dan
**bij de bestaande CSS-regel** in plaats van een eigen blok te schrijven.

Zo zijn de bekende missers ontstaan: het ⋯-icoon kreeg drie verschillende
maten, de filterknop twee, een taakmenu 15px terwijl elk ander menu 13px is,
en twee keer bleef er een `box-shadow` staan op een knop die randloos hoorde.
Elke keer doordat er een nieuw blok bijkwam.

```bash
# altijd doen vóór je iets wijzigt
grep -n "<selector-of-token>" index.html
```

## 3. Ziet iets er per pagina anders uit? Maak er een standaard van

Staat hetzelfde soort element op meerdere plekken in verschillende maten, dan
mag je daar zelf één standaard van maken — mits het écht hetzelfde soort
element is en de pagina's dezelfde verhoudingen hebben.

Voorwaarde: **noem de standaard expliciet in je antwoord**, met het gekozen
getal en waarom. Anders staat er een keuze in de code die Frank niet kent.

Leg hem vast als token in `:root` (met de mobiele override in de
`@media (max-width:768px)`-laag), documenteer hem in `docs/mobile.md` en zet
een entry in `docs/decisions.md`. Bestaande tokens: `--tap`, `--icoon`,
`--fs-*`, `--sp-*`.

## 4. Controleer op beide breedtes — altijd

Elke visuele wijziging controleren op **375px én desktop** (~1400-1700px), ook
als de vraag maar over één van beide ging.

Waarom dit niet optioneel is: bij het verplaatsen van de KPI-tegels naar een
uitklapblok raakten die hun rasterwikkel kwijt. Op 1700px zag dat er identiek
uit, op 375px vielen ze onder elkaar. Precies het soort fout dat alleen
zichtbaar is op de viewport waar je niet keek.

**Meet, tuur niet.** Gebruik `getComputedStyle` in plaats van naar een
screenshot te kijken — de mobiele CSS-laag zit vol `!important` en de preview
geeft na herhaalde DOM-wissels soms verouderde waarden terug. Lees ook de
console: een `Uncaught` breekt een render af en laat het vórige scherm staan,
wat eruitziet alsof er niets gebeurde in plaats van als een fout.

## 5. Voor én na laten zien

Stuur bij elke visuele wijziging **twee** beelden: de situatie ervóór en die
erna. Niet alleen het eindresultaat — Frank zit vaak op een ander apparaat en
heeft de oude versie niet meer voor zich.

Maak het "voor"-beeld *voordat* je gaat wijzigen. Is er al gewijzigd maar nog
niet gecommit: `git stash` → screenshot → `git stash pop`.

Noem ze `<ding>-voor.png` / `<ding>-na.png`, stuur ze in die volgorde met
`SendUserFile` en zeg in het onderschrift welke welke is.

## 6. De preview draaien

```
preview_start met de "static"-config uit .claude/launch.json
```

De app vraagt om een Google-login die op localhost niet werkt. Seed
`herling_login` in localStorage, dan valt hij terug op de lokale kopie en
schrijft hij niets naar Drive — localhost is een andere origin dan de live
site, dus de echte data blijft buiten schot.

**Screenshots smaller dan 500px**: headless Chrome maakt geen venster smaller
dan dat. Render de app daarom in een **iframe van 375px** op een hulppagina in
de projectmap en screenshot díe, met `--headless=old --window-size=375,812`.
Die pagina seedt localStorage vóór de iframe laadt (zelfde origin), verbergt
de toast, en kan open/dicht-standen forceren via echte `.click()`-aanroepen —
`let`-bindingen op topniveau zijn niet van buitenaf te zetten, dus klikken is
de enige weg. Het hulpbestand heet `_shot.html` en staat in `.gitignore`.

## 7. Grote visuele wijziging? Branch en PR

Frank beoordeelt UI op het scherm, niet in een diff, en wil een misser niet
meteen live hebben staan. Kleine correcties mogen direct naar `main`; een
herziening van een hele weergave gaat via een aparte branch met PR.

## 8. Afronden

- `node validate.mjs` moet groen zijn (bewaakt o.a. de 44px-ondergrens voor
  raakvlakken).
- Nieuwe standaard vastgelegd? Dan ook in `docs/stijlgids.md` of
  `docs/mobile.md`, plus een entry in `docs/decisions.md`.
- Na een push: vraag om **Ctrl+Shift+R** op de live site.
