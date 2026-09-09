#!/usr/bin/env node
/* parallel-check.mjs — bewaakt de moduleverdeling bij parallel werk.
 *
 * Git merget index.html per hunk en doet dat prima zolang twee sporen ver uit
 * elkaar schrijven. Wat git NIET ziet is het geval waar beide merges schoon
 * zijn en de app toch stuk is: spoor uren zet `.uren-btn` op 34px, facturen
 * gebruikt diezelfde regel 57 keer, niemand krijgt een conflict te zien.
 * Dat gat dicht dit script.
 *
 * Gebruik:
 *   node parallel-check.mjs scope <spoor> [--basis main] [--branch <ref>]
 *   node parallel-check.mjs overlap [spoor...] [--basis main]
 *   node parallel-check.mjs merge [--basis main]
 *   node parallel-check.mjs stijl [--basis main]
 *   node parallel-check.mjs kaart
 *
 * Exit 0 = schoon, 1 = fouten, 2 = alleen contractverzoeken (geen fout).
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execSync, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OWNERSHIP = '.claude/ownership.json';
const cfg = JSON.parse(readFileSync(OWNERSHIP, 'utf8'));
const BESTAND = cfg.bestand;
const SPOREN = Object.keys(cfg.sporen);

/* ─────────── argumenten ─────────── */
const argv = process.argv.slice(2);
const modus = argv[0];
const vlag = (naam, def) => {
  const i = argv.indexOf('--' + naam);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const vrij = argv.slice(1).filter((a, i, arr) =>
  !a.startsWith('--') && !(i > 0 && arr[i - 1].startsWith('--')));

const BASIS = vlag('basis', 'main');

/* ─────────── uitvoer ─────────── */
const fouten = [], contracten = [], notities = [];
const kop = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');
const regel = (t) => console.log('  ' + t);

/* ─────────── git ─────────── */
const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const gitStil = (args) => { try { return git(args); } catch { return null; } };
const toon = (ref, pad) => {
  const uit = gitStil(['show', ref + ':' + pad]);
  if (uit === null) throw new Error(`kan ${pad} niet lezen op ${ref}`);
  return uit;
};

/* ═══════════════════════════════════════════════════════════════
   1. Zones — waar staat de CSS, de markup en de JS in index.html
   ═══════════════════════════════════════════════════════════════ */
function zones(regels) {
  let cssVan = 0, cssTot = 0, jsVan = 0;
  regels.forEach((r, i) => {
    const n = i + 1;
    if (!cssVan && /^<style>/.test(r)) cssVan = n;
    if (cssVan && !cssTot && /^<\/style>/.test(r)) cssTot = n;
    if (/^<script>\s*$/.test(r)) jsVan = n;          /* laatste inline script wint */
  });
  return { cssVan, cssTot, htmlVan: cssTot + 1, htmlTot: jsVan - 1, jsVan, jsTot: regels.length };
}

/* ═══════════════════════════════════════════════════════════════
   2. Ankers — de kapstokken waar een regel aan hangt
   ═══════════════════════════════════════════════════════════════ */
function ankers(regels, z) {
  const uit = [];
  for (let i = 0; i < regels.length; i++) {
    const n = i + 1, r = regels[i];

    if (n > z.cssVan && n < z.cssTot) {
      if (/^@media/.test(r)) { uit.push({ n, naam: '@media', soort: 'css', gedeeld: true }); continue; }
      const m = r.match(/^([.#][A-Za-z][A-Za-z0-9_-]*)/);
      if (m) uit.push({ n, naam: m[1], soort: 'css' });
      else if (/^:root/.test(r)) uit.push({ n, naam: ':root', soort: 'css', gedeeld: true });
      continue;
    }

    if (n >= z.htmlVan && n <= z.htmlTot) {
      const m = r.match(/id="mod-([A-Za-z0-9_-]+)"/);
      if (m) uit.push({ n, naam: 'mod-' + m[1], soort: 'html' });
      continue;
    }

    if (n > z.jsVan) {
      const f = r.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
      if (f) { uit.push({ n, naam: f[1], soort: 'js' }); continue; }
      const c = r.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/);
      if (c) uit.push({ n, naam: c[1], soort: 'js' });
    }
  }
  return uit;
}

/* ═══════════════════════════════════════════════════════════════
   3. Eigendom — welk spoor hoort bij welk anker
   ═══════════════════════════════════════════════════════════════ */
const signaalRe = {};
for (const [s, v] of Object.entries(cfg.sporen)) signaalRe[s] = v.signalen.map(p => new RegExp(p));

function spoorUitNaam(naam) {
  const treffers = SPOREN.filter(s => signaalRe[s].some(re => re.test(naam)));
  return treffers.length === 1 ? treffers[0] : null;   /* twee signalen = geen uitsluitsel */
}

function wijsEigenaarsToe(lijst) {
  /* Stap 1: wat de naam zelf verraadt. */
  for (const a of lijst) {
    if (a.soort === 'html') {
      const s = SPOREN.find(k => cfg.sporen[k].html === a.naam);
      a.spoor = s || null;
      a.vast = true;                                   /* markup-grenzen staan hard */
    } else {
      a.spoor = spoorUitNaam(a.naam);
      a.vast = !!a.spoor;
    }
  }
  /* Stap 2: een naamloos anker erft alleen als beide buren het eens zijn. */
  for (let i = 0; i < lijst.length; i++) {
    if (lijst[i].spoor) continue;
    if (lijst[i].gedeeld) continue;
    let voor = null, na = null;
    for (let j = i - 1; j >= 0; j--) if (lijst[j].vast && lijst[j].soort === lijst[i].soort) { voor = lijst[j].spoor; break; }
    for (let j = i + 1; j < lijst.length; j++) if (lijst[j].vast && lijst[j].soort === lijst[i].soort) { na = lijst[j].spoor; break; }
    if (voor && voor === na) { lijst[i].spoor = voor; lijst[i].geerfd = true; }
  }
  return lijst;
}

function bouwKaart(tekst) {
  /* De worktree staat op CRLF, `git show` levert LF — normaliseren, anders
     mist elk regex dat op $ eindigt zijn doel in precies één van de twee. */
  const regels = tekst.split(/\r?\n/);
  const z = zones(regels);
  const lijst = wijsEigenaarsToe(ankers(regels, z));
  /* regel → anker: het dichtstbijzijnde anker ervoor, binnen dezelfde zone */
  const perRegel = new Array(regels.length + 2).fill(null);
  let huidig = null;
  for (let n = 1; n <= regels.length; n++) {
    const a = lijst.find(x => x.n === n);
    if (a) huidig = a;
    perRegel[n] = huidig;
  }
  return { regels, z, lijst, perRegel };
}

const isGedeeld = (a) =>
  a.gedeeld === true ||
  (a.soort === 'js' && cfg.gedeeld.functies.includes(a.naam)) ||
  (a.soort === 'css' && cfg.gedeeld.selectors.includes(a.naam));

/* ═══════════════════════════════════════════════════════════════
   4. Referenties — wie roept dit aan / wie gebruikt deze class
   ═══════════════════════════════════════════════════════════════ */
function gebruikers(kaart, anker) {
  const zoek = anker.soort === 'css' ? anker.naam.slice(1) : anker.naam;
  if (zoek.length < 3) return new Set();
  const re = new RegExp('(?<![\\w$-])' + zoek.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w$-])');
  const uit = new Set();
  for (let n = 1; n <= kaart.regels.length; n++) {
    if (n === anker.n) continue;
    if (!re.test(kaart.regels[n - 1])) continue;
    const a = kaart.perRegel[n];
    if (!a) continue;
    if (a === anker) continue;                          /* eigen body telt niet */
    if (a.spoor) uit.add(a.spoor);
  }
  return uit;
}

/* ═══════════════════════════════════════════════════════════════
   5. Gewijzigde regels uit een diff
   ═══════════════════════════════════════════════════════════════ */
function gewijzigdeRegels(van, naar, pad) {
  const args = ['diff', '--unified=0', '--no-color'];
  if (naar === '__worktree__') args.push(van, '--', pad); else args.push(van + '..' + naar, '--', pad);
  const diff = gitStil(args) || '';
  const nrs = [];
  for (const r of diff.split('\n')) {
    const m = r.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (!m) continue;
    const start = +m[1], aantal = m[2] === undefined ? 1 : +m[2];
    if (aantal === 0) nrs.push(start);                  /* pure verwijdering */
    else for (let i = 0; i < aantal; i++) nrs.push(start + i);
  }
  return nrs;
}

function gewijzigdeBestanden(van, naar) {
  const args = naar === '__worktree__'
    ? ['diff', '--name-only', van]
    : ['diff', '--name-only', van + '..' + naar];
  return (gitStil(args) || '').split('\n').map(s => s.trim()).filter(Boolean);
}

/* ═══════════════════════════════════════════════════════════════
   MODUS: kaart — laat zien hoe het bestand verdeeld is
   ═══════════════════════════════════════════════════════════════ */
function doeKaart() {
  const kaart = bouwKaart(readFileSync(BESTAND, 'utf8'));
  const telling = {}, onbekend = { js: 0, css: 0 };
  for (const a of kaart.lijst) {
    const k = a.spoor || (isGedeeld(a) ? 'gedeeld' : 'onbekend');
    telling[k] = (telling[k] || 0) + 1;
    if (k === 'onbekend') onbekend[a.soort] = (onbekend[a.soort] || 0) + 1;
  }
  kop(`Eigendomskaart van ${BESTAND} (${kaart.regels.length} regels)`);
  regel(`zones — CSS ${kaart.z.cssVan}-${kaart.z.cssTot} · markup ${kaart.z.htmlVan}-${kaart.z.htmlTot} · JS ${kaart.z.jsVan}-${kaart.z.jsTot}`);
  regel(`ankers — ${kaart.lijst.length} totaal`);
  console.log();
  for (const s of SPOREN) {
    const eigen = kaart.lijst.filter(a => a.spoor === s);
    if (!eigen.length) { regel(`${s.padEnd(11)} — geen ankers gevonden`); continue; }
    const js = eigen.filter(a => a.soort === 'js'), css = eigen.filter(a => a.soort === 'css');
    const bereik = (arr) => arr.length ? `${arr[0].n}-${arr[arr.length - 1].n}` : '—';
    regel(`${s.padEnd(11)} ${String(eigen.length).padStart(4)} ankers · JS ${bereik(js).padEnd(13)} · CSS ${bereik(css)}`);
  }
  console.log();
  regel(`gedeeld    ${String(telling.gedeeld || 0).padStart(4)} ankers (contract — alleen de coordinator)`);
  regel(`onbekend   ${String(telling.onbekend || 0).padStart(4)} ankers (JS ${onbekend.js || 0}, CSS ${onbekend.css || 0}) — elke wijziging hieraan wordt gemeld`);
  return 0;
}

/* ═══════════════════════════════════════════════════════════════
   MODUS: scope — schrijft dit spoor binnen zijn eigen grenzen
   ═══════════════════════════════════════════════════════════════ */
function raakteAnkers(kaartTekst, van, naar) {
  const kaart = bouwKaart(kaartTekst);
  const nrs = gewijzigdeRegels(van, naar, BESTAND);
  const set = new Map();
  for (const n of nrs) {
    const a = kaart.perRegel[n];
    const sleutel = a ? a.soort + ':' + a.naam + '@' + a.n : 'buiten:' + n;
    if (!set.has(sleutel)) set.set(sleutel, { anker: a, regels: [] });
    set.get(sleutel).regels.push(n);
  }
  return { kaart, geraakt: set, aantalRegels: nrs.length };
}

function doeScope(spoor, branch) {
  if (!SPOREN.includes(spoor)) { console.error(`Onbekend spoor "${spoor}". Bekend: ${SPOREN.join(', ')}`); return 1; }
  const doel = branch || `claude/${spoor}`;
  const isWt = doel === 'worktree';
  const ref = isWt ? '__worktree__' : doel;
  if (!isWt && !gitStil(['rev-parse', '--verify', doel])) {
    console.error(`Branch "${doel}" bestaat niet. Geef er een op met --branch.`); return 1;
  }
  const tekst = isWt ? readFileSync(BESTAND, 'utf8') : toon(doel, BESTAND);

  kop(`Scope-controle · spoor ${spoor} · ${isWt ? 'working tree' : doel} tegen ${BASIS}`);

  /* 5a. Bestanden die niemand mag aanraken */
  for (const b of gewijzigdeBestanden(BASIS, ref)) {
    if (b === BESTAND) continue;
    if (cfg.gedeeld.bestanden.some(g => b === g || b.startsWith(g))) {
      contracten.push(`gedeeld bestand gewijzigd: ${b} — dit hoort de coordinator te doen`);
    } else {
      notities.push(`ook gewijzigd: ${b}`);
    }
  }

  /* 5b. index.html per anker */
  const { kaart, geraakt, aantalRegels } = raakteAnkers(tekst, BASIS, ref);
  regel(`${aantalRegels} gewijzigde regels in ${BESTAND}, verdeeld over ${geraakt.size} ankers`);

  for (const [, v] of geraakt) {
    const a = v.anker;
    const waar = `regel ${v.regels[0]}${v.regels.length > 1 ? `-${v.regels[v.regels.length - 1]}` : ''}`;

    if (!a) { contracten.push(`${waar} — buiten elk anker (bovenaan het bestand of in de <head>)`); continue; }

    const naam = (a.soort === 'css' ? a.naam : a.naam + '()');

    if (isGedeeld(a)) { contracten.push(`${naam} — staat op de gedeelde lijst (${waar})`); continue; }

    if (a.spoor && a.spoor !== spoor) {
      fouten.push(`${naam} is van spoor ${a.spoor}, niet van ${spoor} (${waar})`); continue;
    }
    if (!a.spoor) {
      contracten.push(`${naam} — geen eigenaar vast te stellen (${waar})`); continue;
    }

    /* Eigen anker, maar wordt het van buiten gebruikt? */
    const g = gebruikers(kaart, a);
    g.delete(spoor);
    if (g.size) contracten.push(`${naam} is eigen, maar wordt ook gebruikt door ${[...g].join(', ')} (${waar})`);
  }
  return rapporteer();
}

/* ═══════════════════════════════════════════════════════════════
   MODUS: overlap — botsen de sporen onderling
   ═══════════════════════════════════════════════════════════════ */
function doeOverlap(lijst) {
  const sporen = lijst.length ? lijst : SPOREN;
  const perSpoor = {};
  kop(`Overlap-controle · ${sporen.join(', ')} tegen ${BASIS}`);

  for (const s of sporen) {
    const branch = `claude/${s}`;
    if (!gitStil(['rev-parse', '--verify', branch])) { regel(`${s.padEnd(11)} — geen branch, overgeslagen`); continue; }
    const { geraakt } = raakteAnkers(toon(branch, BESTAND), BASIS, branch);
    perSpoor[s] = new Set([...geraakt.keys()].map(k => k.replace(/@\d+$/, '')));
    const bst = new Set(gewijzigdeBestanden(BASIS, branch).filter(b => b !== BESTAND));
    for (const b of bst) perSpoor[s].add('bestand:' + b);
    regel(`${s.padEnd(11)} raakt ${perSpoor[s].size} ankers/bestanden aan`);
  }

  const namen = Object.keys(perSpoor);
  for (let i = 0; i < namen.length; i++) {
    for (let j = i + 1; j < namen.length; j++) {
      const a = namen[i], b = namen[j];
      const beide = [...perSpoor[a]].filter(x => perSpoor[b].has(x));
      if (beide.length) {
        fouten.push(`${a} en ${b} raken allebei: ${beide.slice(0, 8).join(', ')}${beide.length > 8 ? ` (+${beide.length - 8})` : ''}`);
      }
    }
  }
  if (!fouten.length) regel('geen enkel anker wordt door twee sporen aangeraakt');
  return rapporteer();
}

/* ═══════════════════════════════════════════════════════════════
   MODUS: merge — na het samenvoegen
   ═══════════════════════════════════════════════════════════════ */
function doeMerge() {
  kop(`Merge-controle · working tree tegen ${BASIS}`);

  /* 1. Conflictmarkers */
  const tekst = readFileSync(BESTAND, 'utf8');
  const markers = tekst.split(/\r?\n/)
    .map((r, i) => /^(<{7}|={7}|>{7})(\s|$)/.test(r) ? i + 1 : 0).filter(Boolean);
  if (markers.length) fouten.push(`conflictmarkers blijven staan op regel ${markers.slice(0, 10).join(', ')}`);
  else regel('geen conflictmarkers');

  /* 2. validate.mjs */
  try {
    const uit = execSync('node validate.mjs', { encoding: 'utf8' });
    regel('validate.mjs: groen' + (uit.includes('Warnings') ? ' (met waarschuwingen)' : ''));
    if (uit.includes('Warnings')) notities.push(uit.trim().split('\n').slice(-6).join('\n     '));
  } catch (e) {
    fouten.push('validate.mjs faalt:\n     ' + (e.stdout || e.message).trim().split('\n').slice(0, 12).join('\n     '));
  }

  /* 3. Welke ankers zijn in totaal geraakt, en wie gebruikt ze nog meer */
  const { kaart, geraakt, aantalRegels } = raakteAnkers(tekst, BASIS, '__worktree__');
  regel(`${aantalRegels} gewijzigde regels over ${geraakt.size} ankers sinds ${BASIS}`);

  for (const [, v] of geraakt) {
    const a = v.anker;
    if (!a || !a.spoor) continue;
    if (isGedeeld(a)) { contracten.push(`gedeeld anker gewijzigd: ${a.naam} (regel ${v.regels[0]})`); continue; }
    const g = gebruikers(kaart, a);
    g.delete(a.spoor);
    if (g.size) contracten.push(`${a.naam} (van ${a.spoor}) wordt ook gebruikt door ${[...g].join(', ')} — kijk die module na`);
  }
  return rapporteer();
}

/* ═══════════════════════════════════════════════════════════════
   MODUS: stijl — berekende stijlen voor en na vergelijken
   ═══════════════════════════════════════════════════════════════ */
function chromePad() {
  const kandidaten = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return kandidaten.find(p => { try { return existsSync(p); } catch { return false; } }) || null;
}

function probePagina(indexTekst, thema) {
  const css = indexTekst.slice(indexTekst.indexOf('<style>') + 7, indexTekst.indexOf('</style>'));
  const sel = cfg.gedeeld.selectors.filter(s => s.startsWith('.'));
  const props = cfg.stijlProbe.eigenschappen;
  /* Elke class krijgt een eigen proefkonijn, genest in de containers die er in
     de echte app omheen staan -- zonder die nesting missen we regels als
     `#mod-facturen .uren-content`. */
  const blokjes = sel.map((s, i) =>
    `<div id="mod-facturen" class="module"><div class="uren-module"><div class="uren-tabs">` +
    `<div class="uren-viewbar"><span data-p="${i}" class="${s.slice(1)}">x</span></div></div></div></div>`).join('');
  return `<!doctype html><html data-theme="${thema}"><meta charset="utf-8">
<style>${css}</style><body>${blokjes}
<pre id="uit"></pre><script>
const SEL=${JSON.stringify(sel)}, PROPS=${JSON.stringify(props)};
const uit={};
SEL.forEach((s,i)=>{const el=document.querySelector('[data-p="'+i+'"]');if(!el)return;
  const cs=getComputedStyle(el);const o={};PROPS.forEach(p=>o[p]=cs.getPropertyValue(p));uit[s]=o;});
document.getElementById('uit').textContent='@@'+JSON.stringify(uit)+'@@';
</script></body></html>`;
}

function meet(chrome, bestandsPad, breedte) {
  const uit = execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--dump-dom',
    `--window-size=${breedte},900`, '--virtual-time-budget=3000',
    'file:///' + bestandsPad.replace(/\\/g, '/'),
  ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const m = uit.match(/@@(\{[\s\S]*?\})@@/);
  if (!m) throw new Error('geen meetresultaat uit Chrome');
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
}

function doeStijl() {
  kop(`Stijl-controle · gedeelde selectors, working tree tegen ${BASIS}`);
  const chrome = chromePad();
  if (!chrome) { notities.push('Chrome niet gevonden — stijlmeting overgeslagen (zet CHROME_PATH)'); return rapporteer(); }

  const nu = readFileSync(BESTAND, 'utf8');
  const oud = toon(BASIS, BESTAND);
  const dir = mkdtempSync(join(tmpdir(), 'parcheck-'));
  let verschillen = 0;
  try {
    for (const c of cfg.stijlProbe.combinaties) {
      const pOud = join(dir, `oud-${c.naam}.html`), pNu = join(dir, `nu-${c.naam}.html`);
      writeFileSync(pOud, probePagina(oud, c.thema));
      writeFileSync(pNu, probePagina(nu, c.thema));
      const a = meet(chrome, pOud, c.breedte), b = meet(chrome, pNu, c.breedte);
      const lokaal = [];
      for (const s of Object.keys(a)) {
        for (const p of Object.keys(a[s])) {
          if (!b[s] || a[s][p] === b[s][p]) continue;
          lokaal.push(`${s} · ${p}: ${a[s][p] || '(leeg)'} → ${b[s][p] || '(leeg)'}`);
        }
      }
      verschillen += lokaal.length;
      regel(`${c.naam.padEnd(15)} ${lokaal.length ? `\x1b[33m${lokaal.length} verschillen\x1b[0m` : 'gelijk'}`);
      lokaal.slice(0, 12).forEach(l => contracten.push(`[${c.naam}] ${l}`));
      if (lokaal.length > 12) contracten.push(`[${c.naam}] +${lokaal.length - 12} meer`);
    }
  } finally { try { rmSync(dir, { recursive: true, force: true }); } catch {} }

  if (!verschillen) regel('geen enkele gedeelde regel is van waarde veranderd');
  return rapporteer();
}

/* ═══════════════════════════════════════════════════════════════
   Rapport
   ═══════════════════════════════════════════════════════════════ */
function rapporteer() {
  if (fouten.length) { kop(`\x1b[31m${fouten.length} fout(en) — buiten de eigen grenzen geschreven\x1b[0m`); fouten.forEach(f => regel('✗ ' + f)); }
  if (contracten.length) { kop(`\x1b[33m${contracten.length} contractverzoek(en) — de coordinator beslist\x1b[0m`); contracten.forEach(c => regel('· ' + c)); }
  if (notities.length) { kop('Ter info'); notities.forEach(n => regel('  ' + n)); }
  if (!fouten.length && !contracten.length) kop('\x1b[32mSchoon.\x1b[0m');
  console.log();
  return fouten.length ? 1 : (contracten.length ? 2 : 0);
}

/* ═══════════════════════════════════════════════════════════════ */
let code = 0;
switch (modus) {
  case 'kaart':   code = doeKaart(); break;
  case 'scope':   code = doeScope(vrij[0], vlag('branch', null)); break;
  case 'overlap': code = doeOverlap(vrij); break;
  case 'merge':   code = doeMerge(); break;
  case 'stijl':   code = doeStijl(); break;
  default:
    console.log(`parallel-check.mjs — bewaakt de moduleverdeling bij parallel werk

  node parallel-check.mjs kaart                      hoe is index.html verdeeld
  node parallel-check.mjs scope <spoor>              blijft dit spoor binnen zijn grenzen
  node parallel-check.mjs scope <spoor> --branch worktree
  node parallel-check.mjs overlap [spoor...]         botsen de sporen onderling
  node parallel-check.mjs merge                      na het samenvoegen
  node parallel-check.mjs stijl                      berekende stijlen voor/na

Sporen: ${SPOREN.join(', ')}
Exit 0 = schoon · 1 = fout · 2 = alleen contractverzoeken`);
    code = 0;
}
process.exit(code);
