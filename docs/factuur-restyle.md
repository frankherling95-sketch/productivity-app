# Factuur restylen naar ontwerp 3a

Referentie-ontwerp: `Factuur.dc.html`, optie **3a** (twee pagina's: factuur + urenspecificatie als bijlage).
Alles hieronder speelt in `index.html`. Basis-fontgrootte `cfg.basis` = 9.5pt, accent `#0F1B3D`, grijs `[91,104,118]`.

---

## Deel 1 — Zonder code, in de sjabloonbouwer

Deze punten zijn puur blok-instellingen. Doe ze eerst; dan zie je hoe dicht je al komt.

| Blok | Instelling |
|------|-----------|
| LOGO (links) | breedte 38, marge onder 2 |
| ZENDER (rechts, 1e) | **alle velden aan**: naam, adres, btw, kvk, iban, bic — `tel` uit. Grootte −1.5 |
| ZENDER (rechts, 2e) | **verwijderen** — gegevens staan nu in het eerste blok |
| ONTVANGER (links) | `tav` uit (contactpersoon is nu gelijk aan de bedrijfsnaam), `btw` aan |
| META (links) | alleen `nummer`; `betreft` en `referentie` uit |
| META (rechts) | alleen `factuurdatum`; `vervaldatum` uit (die staat straks in het betaalblok) |
| REGELS | `bedragIncl` uit, `stuksprijs` uit, `btw` aan, `btwRechts` uit |
| RICH_TEXT (betaalzin) | uit — vervangen door het betaalblok |
| FOOTER | uit — alle gegevens staan rechtsboven |
| Factuur zelf | `specificatie` aan → `facPdfSpecificatie()` maakt al een eigen bijlagepagina |

`facPdfAdres()` rendert de afzender al precies als in 3a: naam vet, daaronder per regel
`Btw-nummer: …`, `KVK-nummer: …`, `IBAN: …`, `BIC: …`. Daar hoeft niets aan.

### Wat er na deel 1 nog niet klopt
- Geen scheidingslijn onder de factuurnummer-regel
- "Factuur: F000002" met dubbele punt; datum als `12/08/2026` i.p.v. voluit
- Kolomkoppen dun en grijs, en `Tarief` / `Btw` zijn geen echte kolommen
- Geen donkere "TE BETALEN"-balk
- Geen betaalblok in kader
- Bijlagepagina heeft geen logo/kop

---

## Deel 2 — Code, in vijf losse stappen

Eén commit per stap, `node validate.mjs` ertussen.

### Stap 1 · Scheidingslijn onder de kopstrook

`facPdfAdres()` (rond regel 20472) kent geen `lijnBoven`, `facPdfMeta()` wel. Trek gelijk, maar over
de **volle** breedte in plaats van de kolombreedte — anders loopt de lijn tot halverwege.

Voeg boven aan `facPdfAdres()` toe, direct na `const opt={align:a.align};`:

```js
let h=0;
if(b.style.lijnBoven){
  doc.setDrawColor(...ctx.accent).setLineWidth(0.5).line(ctx.L,y,ctx.R,y);
  h+=6;
}
```

…en verwijder de latere `let h=0;`. Zet dan `lijnBoven:true` op het ONTVANGER-blok. In `facPdfMeta()`
dezelfde `ctx.L`/`ctx.R` gebruiken in plaats van `x`/`x+w`.

**Let op**: `facPdfDoc()` tekent een links/rechts-strook met beide blokken op dezelfde `y`. Zet
`lijnBoven` alleen op het **linker** blok van de strook, anders wordt de lijn twee keer getekend.

### Stap 2 · Dubbele punten weg, datum voluit

In `facPdfMeta()`:
- `'Factuur: '+f.nummer` → `'Factuur '+f.nummer`
- De rijen-array: `['Factuurdatum:',…]` → `['Factuurdatum',…]`

Voor de datum voluit een tweede formatter naast `factuurFmtDatum()`:

```js
const FAC_MAANDEN=['januari','februari','maart','april','mei','juni',
                   'juli','augustus','september','oktober','november','december'];
function factuurFmtDatumLang(d){
  if(!d)return '';
  const x=new Date(d);
  if(isNaN(x))return factuurFmtDatum(d);
  return x.getDate()+' '+FAC_MAANDEN[x.getMonth()]+' '+x.getFullYear();
}
```

Gebruiken in `facPdfMeta()` en in het betaalblok (stap 4). `factuurFmtDatum()` zelf niet aanpassen —
die wordt ook in de UI-lijsten gebruikt, waar kort juist prettig is.

### Stap 3 · Kolomkoppen en echte kolommen in `facPdfRegels()`

Twee dingen tegelijk (regel 20586 e.v.):

**a. Koppen vet en donker.** Nu hardcoded `setFont(F,'normal')` + `setTextColor(...ctx.grijs)`.
Maak dat afhankelijk van een nieuwe stijlvlag `kopVet`:

```js
const kopVet=b.style.kopVet===true;
doc.setFont(F,kopVet?'bold':'normal').setFontSize(ctx.bs-1.5)
   .setTextColor(...(kopVet?ctx.accent:ctx.grijs));
```

Kop-teksten in hoofdletters wanneer `kopVet`: `OMSCHRIJVING`, `AANTAL`, `TARIEF`, `BTW`, `BEDRAG`.
`'Beschrijving'` wordt `'Omschrijving'`.

**b. Tarief en btw als eigen kolom.** Nu staan ze als grijze subregels ónder de omschrijving
(`'Stuksprijs: '+…` en `pct+'% Btw'`). In 3a zijn het kolommen. Layout uit het ontwerp, omgerekend
naar mm bij `ctx.breedte` = 170:

| Kolom | Breedte | Uitlijning |
|-------|---------|-----------|
| Omschrijving | rest | links |
| Aantal | 20 | rechts |
| Tarief | 24 | rechts |
| Btw | 14 | rechts |
| Bedrag | 28 | rechts |

Dat betekent nieuwe x-posities: `xBedrag = x+w`, `xBtw = xBedrag-28`, `xTarief = xBtw-14`,
`xAantal = xTarief-24`, `xOms = x`. De tweeregelige koppen (`Bedrag` / `excl. btw`) vervallen —
één regel per kop. Laat de oude subregel-code staan achter `if(!kopVet)`, zodat bestaande
sjablonen niet omvallen.

De tweeregelige-kop-code en `btwRechts` kunnen weg zodra alle sjablonen om zijn; laat ze voorlopig
staan als fallback.

### Stap 4 · Donkere "TE BETALEN"-balk

In het totalen-deel van `facPdfRegels()`. De laatste `rij('Totaalbedrag incl. btw', …, true)`
vervangen door een gevulde balk. Maten uit 3a: balk loopt van `xLab` tot `xIncl`, hoogte 9mm,
label kleinkapitaal links, bedrag vet rechts.

```js
doc.setFillColor(...ctx.accent).rect(xLab-3,y+h-4,xIncl-xLab+3,9,'F');
doc.setFont(F,'bold').setFontSize(ctx.bs-1.5).setTextColor(255,255,255);
doc.text('TE BETALEN',xLab,y+h+1.8);
doc.setFontSize(ctx.bs+3);
doc.text(factuurFmtBedrag(ctx.tot.incl),xIncl-3,y+h+1.8,{align:'right'});
doc.setTextColor(...ctx.accent);
h+=13;
```

Zet dit achter dezelfde `kopVet`-vlag (of een eigen `totaalBalk`), zodat oude sjablonen de
bestaande lijn+vette regel houden.

De accentlijn boven de totalen (`setDrawColor(...ctx.accent).setLineWidth(0.4).line(…)`) vervalt
dan — de balk neemt die rol over.

### Stap 5 · Betaalblok als nieuw bloktype

Toevoegen aan `FAC_BLOKTYPEN` (regel 17259):

```js
BETAALBLOK: {label:'Betaalgegevens', uniek:true},
```

Case toevoegen in `facPdfBlok()`:

```js
case 'BETAALBLOK': return facPdfBetaalblok(ctx,b,x,y,w);
```

Renderer — kader met drie kolommen, zoals 3a:

```js
/* Betaalgegevens in een kader: IBAN, kenmerk en uiterste datum naast
   elkaar. Vervangt de losse betaalzin, die dezelfde gegevens herhaalde
   die elders op de factuur al stonden. */
function facPdfBetaalblok(ctx,b,x,y,w){
  const {doc,F,f}=ctx;
  const gr=ctx.bs+(Number(b.style.grootte)||0);
  const hoog=22;
  doc.setDrawColor(...ctx.lijn).setLineWidth(0.3).rect(x,y,w,hoog);
  const kol=[
    ['BETALEN OP', ctx.afz.iban||'', 't.n.v. '+(ctx.afz.naam||'')+
                                     (ctx.afz.bic?' \u00b7 BIC '+ctx.afz.bic:'')],
    ['KENMERK',    'Factuur '+(f.nummer||''), ''],
    ['UITERLIJK',  factuurFmtDatumLang(f.vervaldatum),
                   'Betaaltermijn '+(f.betaaltermijn||30)+' dagen']
  ];
  const bw=[w*0.46,w*0.24,w*0.30];
  let cx=x+6;
  kol.forEach(([label,regel1,regel2],i)=>{
    doc.setFont(F,'bold').setFontSize(gr-1.5).setTextColor(...ctx.accent);
    doc.text(label,cx,y+7);
    doc.setFont(F,'normal').setFontSize(gr);
    doc.text(regel1,cx,y+13);
    if(regel2){
      doc.setFontSize(gr-1.5).setTextColor(...ctx.grijs);
      doc.text(regel2,cx,y+18);
    }
    cx+=bw[i];
  });
  return hoog;
}
```

Ook toevoegen aan de sjabloonbouwer-UI zodat het blok toevoegbaar is — zoek waar `FAC_BLOKTYPEN`
in de editor wordt uitgelezen, en of er per bloktype een instellingen-paneel is dat een `case`
nodig heeft.

**Positie**: onderaan, direct boven de (uitgeschakelde) FOOTER. Het sjabloon plaatst blokken in de
stroom, dus bij weinig factuurregels blijft er ruimte onder — in 3a staat het blok tegen de
onderkant. Wil je dat ook in de PDF, geef het blok dan een `anker:'onder'`-vlag en teken het net als
`facPdfFooter()` op `ctx.onder - hoogte` in plaats van op de lopende `y`.

### Stap 6 (optioneel) · Bijlagepagina dezelfde kop

`facPdfSpecificatie()` (regel 20689) begint kaal met de tekst "Urenspecificatie". In 3a heeft
pagina 2 dezelfde kop als pagina 1: logo links, bedrijfsgegevens rechts, titel, scheidingslijn, en
onderaan "Bijlage bij factuur F000002 · pagina 2 van 2".

Trek de kop uit `facPdfDoc()` in een `facPdfKop(ctx,titel,ondertitel)` en roep die aan op beide
pagina's. Paginanummer onderaan via `doc.getNumberOfPages()`.

---

## Volgorde en risico

1–2 zijn cosmetisch en veilig. 3 raakt de regeltabel, die ook de pagina-afbreking doet — check een
factuur met 20+ regels. 4 en 5 zijn nieuw en staan los. 6 is een aparte pagina, geen risico.

Alle codewijzigingen achter een stijlvlag (`kopVet`, `totaalBalk`, of een nieuw sjabloon "3a" naast
"Standaard") zodat oude facturen die opnieuw worden gedownload er hetzelfde uit blijven zien.
