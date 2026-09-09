#!/usr/bin/env node
/* parallel-check.test.mjs — toetst parallel-check.mjs op een wegwerp-kloon.
 *
 * Draai dit na elke wijziging aan `parallel-check.mjs` of `.claude/ownership.json`.
 * Elk geval maakt een branch, brengt een wijziging aan, draait de check en
 * toetst de exitcode én of de melding zegt wat hij moet zeggen. De echte repo
 * wordt niet aangeraakt: alles gebeurt in een kloon onder de tijdelijke map,
 * die achteraf weer weg is.
 *
 * Run: node parallel-check.test.mjs        (~1 minuut, waarvan 10s Chrome)
 *      node parallel-check.test.mjs --houd  laat de kloon staan om na te kijken
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync, cpSync } from 'node:fs';
import { execFileSync, execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HOUD = process.argv.includes('--houd');
const BRON = process.cwd();

/* ── kloon opzetten: de repo zoals hij is gecommit, plus de werkkopie van de
      twee bestanden die we toetsen, zodat je niet hoeft te committen om te testen ── */
const DIR = mkdtempSync(join(tmpdir(), 'parcheck-test-'));
const REPO = join(DIR, 'kloon');
console.log(`kloon: ${REPO}`);
execFileSync('git', ['clone', '--quiet', BRON, REPO], { stdio: 'inherit' });
for (const f of ['parallel-check.mjs', '.claude/ownership.json']) cpSync(join(BRON, f), join(REPO, f));

const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 64e6 });
const gitStil = (...a) => { try { return git(...a); } catch (e) { return e.stdout || ''; } };
gitStil('checkout', '--quiet', 'main');
gitStil('add', '-A');
gitStil('commit', '--quiet', '-m', 'werkkopie van de te toetsen bestanden');

function check(args) {
  try {
    return { code: 0, uit: execSync(`node parallel-check.mjs ${args}`, { cwd: REPO, encoding: 'utf8', maxBuffer: 64e6 }) };
  } catch (e) {
    return { code: e.status, uit: (e.stdout || '') + (e.stderr || '') };
  }
}

/* ── bewerkingen, op patroon in plaats van regelnummer zodat ze blijven werken ── */
const IDX = join(REPO, 'index.html');
function vervang(patroon, vervanging) {
  const s = readFileSync(IDX, 'utf8');
  if (!patroon.test(s)) throw new Error('patroon niet gevonden: ' + patroon);
  writeFileSync(IDX, s.replace(patroon, vervanging));
}
/* Het patroon moet de héle regel dekken, anders knipt de invoeging die regel
   doormidden en telt hij zelf als gewijzigd -- wat bij een functie het verschil
   is tussen "binnenkant verbouwd" en "handtekening gewijzigd". */
function naRegel(patroon, tekst) {
  const s = readFileSync(IDX, 'utf8');
  const m = s.match(patroon);
  if (!m) throw new Error('patroon niet gevonden: ' + patroon);
  writeFileSync(IDX, s.replace(m[0], m[0] + '\r\n' + tekst));
}

const BEWERKING = {
  urenEigenCss:   () => naRegel(/\.uren-kal-card\{/, '  /* test: eigen kalenderkaart */'),
  urenEigenJs:    () => naRegel(/function urenExportPdf\(data\)\{/, '  /* test: eigen pdf-export */'),
  urenGedeeldCss: () => vervang(/(\.uren-btn\{[\s\S]{0,120}?)height:32px/, '$1height:34px'),
  urenAndersCss:  () => vervang(/(\.uren-btn\{[\s\S]{0,120}?height:32px;)padding:0 13px/, '$1padding:0 15px'),
  urenKruisJs:    () => naRegel(/function facExportBoekhouding\(\)\{/, '  /* test: uren schrijft in facturen */'),
  urenGedeeldFn:  () => naRegel(/function hydrateerState\(\)\{/, '  /* test: gedeelde spil */'),
  urenGeleendFn:  () => naRegel(/function urenFmt\(n\)\{/, '  /* test: eigen functie die facturen leent */'),
  urenGeleendSig: () => vervang(/function urenFmt\(n\)\{/, 'function urenFmt(n, extra){'),
  facEigenJs:     () => naRegel(/function facExportBoekhouding\(\)\{/, '  /* test: eigen export */'),
  facEigenCss:    () => naRegel(/\.fac-pblok\{/, '  /* test: eigen pblok */'),
  notesEigenJs:   () => naRegel(/function renderNoteEditor\(/, '  /* test: eigen editor */'),
  clEigenJs:      () => naRegel(/function renderChecklistModule\(\)\{/, '  /* test: eigen module */'),
  dashEigenJs:    () => naRegel(/function dashDerivedStats\(/, '  /* test: eigen stats */'),
  swBump:         () => { const p = join(REPO, 'sw.js'); writeFileSync(p, readFileSync(p, 'utf8').replace(/herling-v\d+/, 'herling-v999')); },
  decisions:      () => {
    const p = join(REPO, 'docs/decisions.md'); const s = readFileSync(p, 'utf8');
    const m = s.match(/^---\r?$/m); if (!m) throw new Error('geen --- in decisions.md');
    writeFileSync(p, s.replace(m[0], m[0] + '\r\n\r\n## 2026-01-01 test'));
  },
};

function maakBranch(naam, bewerkingen) {
  gitStil('checkout', '--quiet', '-B', naam, 'main');
  for (const b of bewerkingen) BEWERKING[b]();
  gitStil('add', '-A');
  gitStil('commit', '--quiet', '-m', 'test ' + naam);
  gitStil('checkout', '--quiet', 'main');
}

/* ── toetsen ── */
let ok = 0, stuk = 0;
const mislukt = [];
function toets(nr, omschrijving, gedaan, verwachtCode, moetBevatten = [], magNietBevatten = []) {
  const f = [];
  if (gedaan.code !== verwachtCode) f.push(`exit ${gedaan.code}, verwacht ${verwachtCode}`);
  for (const s of moetBevatten) if (!gedaan.uit.includes(s)) f.push(`mist "${s}"`);
  for (const s of magNietBevatten) if (gedaan.uit.includes(s)) f.push(`bevat ten onrechte "${s}"`);
  f.length ? stuk++ : ok++;
  if (f.length) mislukt.push({ nr, omschrijving, f, uit: gedaan.uit });
  console.log(`${f.length ? '\x1b[31m STUK \x1b[0m' : '\x1b[32m  ok  \x1b[0m'} ${String(nr).padStart(4)}. ${omschrijving}${f.length ? '\n          → ' + f.join('; ') : ''}`);
}

console.log('\n\x1b[1mTestmatrix parallel-check.mjs\x1b[0m\n\x1b[1m— scope —\x1b[0m');

maakBranch('claude/uren', ['urenEigenCss', 'urenEigenJs']);
toets(1, 'uren wijzigt alleen eigen CSS + eigen JS → schoon', check('scope uren'), 0, ['Schoon'], ['fout']);

maakBranch('claude/uren', ['urenKruisJs']);
toets(2, 'uren schrijft in een facturen-functie → fout', check('scope uren'), 1, ['is van spoor facturen']);

maakBranch('claude/uren', ['urenGedeeldCss']);
toets(3, 'uren wijzigt de gedeelde .uren-btn → contract', check('scope uren'), 2, ['.uren-btn', 'gedeelde lijst']);

maakBranch('claude/uren', ['urenGedeeldFn']);
toets(4, 'uren wijzigt hydrateerState() → contract', check('scope uren'), 2, ['hydrateerState', 'gedeelde lijst']);

maakBranch('claude/notes', ['notesEigenJs', 'swBump']);
toets(5, 'notes bumpt CACHE_NAME in sw.js → contract', check('scope notes'), 2, ['sw.js', 'gedeeld bestand']);

maakBranch('claude/checklist', ['clEigenJs', 'decisions']);
toets(6, 'checklist schrijft in docs/decisions.md → contract', check('scope checklist'), 2, ['decisions.md', 'gedeeld bestand']);

maakBranch('claude/uren', ['urenGeleendFn']);
toets(7, 'binnenkant van urenFmt() verbouwd → notitie, geen contract',
  check('scope uren'), 0, ['urenFmt', 'alleen de binnenkant'], ['contractverzoek']);

maakBranch('claude/uren', ['urenGeleendSig']);
toets(7.1, 'handtekening van urenFmt() gewijzigd → wel contract',
  check('scope uren'), 2, ['urenFmt', 'handtekening wijzigt', 'facturen']);

maakBranch('claude/uren', ['urenEigenJs']);
toets(7.2, 'een naam die alleen in een comment staat telt niet als gebruik',
  check('scope uren'), 0, ['Schoon'], ['urenExportPdf']);

maakBranch('claude/dashboard', ['dashEigenJs']);
toets(8, 'dashboard wijzigt eigen dashDerivedStats() → schoon', check('scope dashboard'), 0, ['Schoon']);

maakBranch('claude/facturen', ['facEigenJs', 'facEigenCss']);
toets(9, 'facturen wijzigt eigen JS + eigen CSS → schoon', check('scope facturen'), 0, ['Schoon']);

toets(10, 'onbekend spoor → nette foutmelding', check('scope onzin'), 1, ['Onbekend spoor']);

/* Het geval waar een echte agent op stukliep: zijn worktree liep achter op main,
   en het verschil met de tip van main toonde andermans werk als het zijne. */
console.log('\n\x1b[1m— achterlopende basis —\x1b[0m');
gitStil('checkout', '--quiet', '-B', 'claude/uren', 'main~1');
BEWERKING.urenEigenCss();
gitStil('commit', '--quiet', '-am', 'uren op een achterlopende basis');
gitStil('checkout', '--quiet', 'main');
toets(10.1, 'spoor loopt achter op main → alleen eigen werk telt',
  check('scope uren'), 0, ['Schoon', 'splitste 1 commit(s) geleden'], ['is van spoor']);

console.log('\n\x1b[1m— overlap —\x1b[0m');

maakBranch('claude/uren', ['urenEigenCss', 'urenEigenJs']);
maakBranch('claude/facturen', ['facEigenJs', 'facEigenCss']);
toets(11, 'twee sporen, elk in eigen gebied → geen overlap', check('overlap uren facturen'), 0, ['geen enkel anker']);

maakBranch('claude/uren', ['urenGedeeldCss']);
maakBranch('claude/facturen', ['urenAndersCss']);
toets(12, 'twee sporen raken allebei .uren-btn → fout', check('overlap uren facturen'), 1, ['raken allebei', '.uren-btn']);

console.log('\n\x1b[1m— merge —\x1b[0m');

gitStil('checkout', '--quiet', '-B', 'proef-conflict', 'main');
gitStil('merge', '--quiet', '--no-edit', 'claude/uren');
gitStil('merge', '--no-edit', 'claude/facturen');
toets(13, 'achtergebleven conflictmarkers → fout', check('merge'), 1, ['conflictmarkers']);
gitStil('merge', '--abort');
gitStil('checkout', '--quiet', 'main');

maakBranch('claude/uren', ['urenEigenCss', 'urenEigenJs']);
maakBranch('claude/facturen', ['facEigenJs', 'facEigenCss']);
gitStil('checkout', '--quiet', '-B', 'proef-schoon', 'main');
gitStil('merge', '--quiet', '--no-edit', 'claude/uren');
const mergeUit = gitStil('merge', '--no-edit', 'claude/facturen');
toets(14, 'twee gescheiden sporen mergen zonder conflict',
  { code: mergeUit.includes('CONFLICT') ? 1 : 0, uit: mergeUit }, 0, []);
toets(15, 'merge-controle op die schone merge → geen fouten',
  check('merge'), 0, ['geen conflictmarkers', 'validate.mjs: groen'], ['fout(en)']);

console.log('\n\x1b[1m— stijl (headless Chrome) —\x1b[0m');

toets(16, 'alleen eigen selectors gewijzigd → geen stijlverschil', check('stijl'), 0, ['geen enkele gedeelde regel']);

gitStil('checkout', '--quiet', '-B', 'proef-stijl', 'main');
BEWERKING.urenGedeeldCss();
gitStil('commit', '--quiet', '-am', 'gedeelde knop');
toets(17, 'gedeelde .uren-btn gewijzigd → stijlverschil met waarden',
  check('stijl'), 2, ['.uren-btn', 'height: 32px', '34px', 'desktop-licht', 'desktop-donker']);

console.log('\n\x1b[1m— kaart —\x1b[0m');
gitStil('checkout', '--quiet', 'main');
toets(18, 'kaart noemt alle vijf sporen en de zones',
  check('kaart'), 0, ['dashboard', 'notes', 'checklist', 'uren', 'facturen', 'zones', 'gedeeld']);

/* ── uitslag ── */
console.log(`\n\x1b[1m${ok} van ${ok + stuk} geslaagd\x1b[0m`);
for (const m of mislukt) console.log(`\n─── ${m.nr}. ${m.omschrijving}\n     ${m.f.join('; ')}\n${m.uit}`);
if (HOUD) console.log(`\nkloon blijft staan: ${REPO}`);
else try { rmSync(DIR, { recursive: true, force: true }); } catch {}
process.exit(stuk ? 1 : 0);
