#!/usr/bin/env node
/* validate.mjs — basic syntax + structural validation for the SPA.
 * Run: `node validate.mjs`  (exit 0 = ok, 1 = errors found)
 *
 * Checks:
 * 1. <script>/<style> tags are balanced
 * 2. Each inline <script> block parses as valid JavaScript
 * 3. Functions called via onclick="" exist somewhere in the file
 * 4. document.getElementById('xxx') targets that look obviously missing
 *    (the ID never appears anywhere in the HTML)
 * 5. Geen font-size onder 11,5px binnen een mobiele media query
 *    (waarschuwing — zie docs/mobile.md voor de schaal)
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const FILE = 'index.html';
const html = readFileSync(FILE, 'utf8');
const errors = [];
const warnings = [];

/* ─── Tag balance ─── */
const countTag = (open, close) => {
  const o = (html.match(new RegExp(open, 'g')) || []).length;
  const c = (html.match(new RegExp(close, 'g')) || []).length;
  if (o !== c) errors.push(`Tag mismatch: ${o} <${open.replace(/[\\b]/g, '')}> vs ${c} </${close.replace(/[\\/<>]/g, '')}>`);
};
countTag('<script\\b', '<\\/script>');
countTag('<style\\b', '<\\/style>');

/* ─── Div-balans per module ───────────────────────────────────────────────
 * Aanleiding 2026-09-06: bij het verwijderen van de agenda-kaart gingen drie
 * </div>'s te veel mee -- die van het kaartenraster, de scroll-container en
 * #mod-dashboard zelf. Daardoor lagen alle andere modules ineens binnen het
 * dashboard, en verdween hun inhoud zodra het dashboard niet actief was.
 *
 * Niets ving dat op: de HTML-parser van een browser dicht zulke onbalans
 * stilzwijgend, de smoke-tests kijken naar losse elementen, en de check
 * hierboven telt alleen script- en style-tags. Deze wel: elke module moet
 * netjes sluiten, en de volgende module moet er náást beginnen, niet erin. */
const divTok = /<div\b|<\/div>/g;
const modules = [...html.matchAll(/id="(mod-[a-z]+)"/g)].map(m => m[1]);
for (const id of modules) {
  const i = html.indexOf(`id="${id}"`);
  const start = html.lastIndexOf('<div', i);
  if (start < 0) continue;
  divTok.lastIndex = start;
  let diepte = 0, eind = -1, m;
  while ((m = divTok.exec(html)) !== null) {
    diepte += m[0] === '</div>' ? -1 : 1;
    if (diepte === 0) { eind = m.index; break; }
  }
  const regel = html.slice(0, start).split('\n').length;
  if (eind < 0) {
    errors.push(`#${id} (regel ${regel}) wordt nooit gesloten — er ontbreekt een </div>`);
    continue;
  }
  /* Ligt er een andere module binnen deze? Dan is er één </div> te weinig. */
  const binnen = modules.filter(a => a !== id).find(a => {
    const j = html.indexOf(`id="${a}"`);
    return j > start && j < eind;
  });
  if (binnen) errors.push(`#${binnen} ligt binnen #${id} (regel ${regel}) — modules horen naast elkaar te staan`);
}

/* ─── Extract & parse each <script> block ─── */
const scriptRe = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
let match, idx = 0;
while ((match = scriptRe.exec(html)) !== null) {
  idx++;
  const code = match[1];
  if (!code.trim()) continue;
  /* Skip blocks with src= attribute (external) */
  const tag = html.slice(match.index, match.index + match[0].indexOf('>') + 1);
  if (/\bsrc\s*=/.test(tag)) continue;
  try {
    new vm.Script(code, { filename: `inline-script-${idx}` });
  } catch (e) {
    /* Find rough line in source for context */
    const before = html.slice(0, match.index);
    const startLine = before.split('\n').length;
    errors.push(`JS syntax error in inline script #${idx} (around line ${startLine}): ${e.message}`);
  }
}

/* ─── Onclick handlers reference functions that exist ─── */
const onclickRe = /onclick\s*=\s*["']([a-zA-Z_$][\w$]*)\s*\(/g;
const definedFns = new Set();
const fnDefRe = /function\s+([a-zA-Z_$][\w$]*)\s*\(/g;
let m;
while ((m = fnDefRe.exec(html)) !== null) definedFns.add(m[1]);
/* Also catch arrow assignments: const foo = () => ... */
const arrowRe = /(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>)/g;
while ((m = arrowRe.exec(html)) !== null) definedFns.add(m[1]);
/* And window.x = ... assignments */
const windowAssignRe = /window\.([a-zA-Z_$][\w$]*)\s*=/g;
while ((m = windowAssignRe.exec(html)) !== null) definedFns.add(m[1]);

const calledFns = new Set();
while ((m = onclickRe.exec(html)) !== null) calledFns.add(m[1]);

/* `onclick="if(x)..."` is geen functieaanroep maar een statement */
const ONCLICK_SKIP = new Set(['if', 'for', 'while', 'switch', 'return', 'typeof', 'delete', 'void', 'new']);
const missing = [...calledFns].filter(fn => !definedFns.has(fn) && !ONCLICK_SKIP.has(fn));
if (missing.length) {
  warnings.push(`Onclick references possibly-undefined functions: ${missing.join(', ')}`);
}

/* ─── Aanroepen ín de JS naar functies die niet bestaan ───
 * De onclick-check hierboven ving alleen handlers in de HTML. Een typefout
 * in gewone code (factuurRenderAll i.p.v. facRenderAll) gooide een
 * ReferenceError midden in een actie: de rest van de functie liep niet meer,
 * dus het scherm werd niet ververst en de toast kwam nooit. Onzichtbaar,
 * want de fout stond alleen in de console. Vandaar deze check. */

/* Strings en commentaar weghalen, maar ${...} in template literals houden:
 * daar staat echte code in. */
function stripLiterals(src) {
  let out = '', i = 0;
  const n = src.length;
  const prevMeaningful = () => { for (let k = out.length - 1; k >= 0; k--) if (!/\s/.test(out[k])) return out[k]; return ''; };
  while (i < n) {
    const c = src[i], c2 = src[i + 1];
    if (c === '/' && c2 === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && c2 === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'") {
      const q = c; i++;
      while (i < n && src[i] !== q) { if (src[i] === '\\') i++; if (src[i] === '\n') break; i++; }
      i++; out += '""'; continue;
    }
    if (c === '`') {
      i++;
      while (i < n && src[i] !== '`') {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '$' && src[i + 1] === '{') {            /* code in de interpolatie: wél meenemen */
          i += 2; let depth = 1, start = i;
          while (i < n && depth > 0) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') depth--;
            else if (src[i] === '`' || src[i] === '"' || src[i] === "'") {   /* geneste literal overslaan */
              const q2 = src[i]; i++;
              while (i < n && src[i] !== q2) { if (src[i] === '\\') i++; i++; }
            }
            if (depth > 0) i++;
          }
          out += ' ' + stripLiterals(src.slice(start, i)) + ' '; i++; continue;
        }
        i++;
      }
      i++; out += '""'; continue;
    }
    if (c === '/') {                                            /* regex-literal of deling */
      const p = prevMeaningful();
      if (p === '' || '(,=:[!&|?{};+-*%~^<>'.includes(p)) {
        i++;
        let inClass = false;
        while (i < n && src[i] !== '\n') {
          if (src[i] === '\\') { i += 2; continue; }
          if (src[i] === '[') inClass = true;
          else if (src[i] === ']') inClass = false;
          else if (src[i] === '/' && !inClass) break;
          i++;
        }
        i++; out += ' 0 '; continue;
      }
    }
    out += c; i++;
  }
  return out;
}

/* Alle inline JS achter elkaar (zonder strings/commentaar) */
let js = '';
scriptRe.lastIndex = 0;
while ((match = scriptRe.exec(html)) !== null) {
  const tag = html.slice(match.index, match.index + match[0].indexOf('>') + 1);
  if (/\bsrc\s*=/.test(tag)) continue;
  js += '\n' + stripLiterals(match[1]);
}

/* Bindingen verzamelen — ruim, want een gemiste binding is vals alarm. */
const bound = new Set(definedFns);
const bind = (re, group = 1) => { let x; const r = new RegExp(re, 'g'); while ((x = r.exec(js)) !== null) if (x[group]) bound.add(x[group]); };
const bindList = (re, group = 1) => {
  let x; const r = new RegExp(re, 'g');
  while ((x = r.exec(js)) !== null) (x[group] || '').split(',').forEach(p => {
    const c = p.replace(/=[\s\S]*$/, '').replace(/^[\s.{}[\]]*/, '').replace(/[\s.{}[\]:]+.*$/, '').trim();
    if (/^[a-zA-Z_$][\w$]*$/.test(c)) bound.add(c);
  });
};
bind('function\\s*\\*?\\s*([a-zA-Z_$][\\w$]*)');
bind('class\\s+([a-zA-Z_$][\\w$]*)');
bind('([a-zA-Z_$][\\w$]*)\\s*:\\s*(?:async\\s*)?(?:function|\\(|[a-zA-Z_$][\\w$]*\\s*=>)');  /* object-literal methodes */
bind('^\\s*(?:async\\s+)?([a-zA-Z_$][\\w$]*)\\s*\\([^()]*\\)\\s*\\{');                        /* shorthand methodes */
bind('catch\\s*\\(\\s*([a-zA-Z_$][\\w$]*)');
bindList('(?:const|let|var)\\s+([^=;\\n{]*)');                    /* let a,b,c */
bindList('(?:const|let|var)\\s*[{[]([^}\\]]*)[}\\]]');            /* destructuring */
bindList('function\\s*\\*?\\s*[a-zA-Z_$\\w$]*\\s*\\(([^()]*)\\)'); /* parameters */
bindList('\\(([^()]*)\\)\\s*=>');                                  /* arrow-parameters */
bind('(?:^|[^\\w$.])([a-zA-Z_$][\\w$]*)\\s*=>');                   /* enkel arrow-parameter */
bindList('for\\s*\\(\\s*(?:const|let|var)\\s+([^;)\\n]*)');

const JS_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'function', 'new', 'do', 'else', 'case', 'delete', 'void', 'in', 'of', 'await', 'yield', 'throw', 'try', 'with', 'instanceof', 'super', 'this', 'constructor', 'get', 'set', 'async', 'var', 'let', 'const', 'class', 'export', 'import', 'default', 'break', 'continue', 'debugger', 'extends', 'static']);
const BROWSER_GLOBALS = new Set(['alert', 'confirm', 'prompt', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'fetch', 'String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'Math', 'JSON', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Error', 'TypeError', 'RangeError', 'RegExp', 'Symbol', 'BigInt', 'Proxy', 'Reflect', 'Intl', 'URL', 'URLSearchParams', 'Blob', 'File', 'FileReader', 'FormData', 'Headers', 'Request', 'Response', 'AbortController', 'TextEncoder', 'TextDecoder', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'Int8Array', 'Float32Array', 'Float64Array', 'ArrayBuffer', 'DataView', 'btoa', 'atob', 'structuredClone', 'queueMicrotask', 'matchMedia', 'getComputedStyle', 'scrollTo', 'scrollBy', 'open', 'close', 'print', 'focus', 'blur', 'postMessage', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'Event', 'CustomEvent', 'MutationObserver', 'IntersectionObserver', 'ResizeObserver', 'Image', 'Audio', 'Option', 'Notification', 'crypto', 'navigator', 'location', 'history', 'screen', 'performance', 'console', 'document', 'window', 'globalThis', 'localStorage', 'sessionStorage', 'indexedDB', 'caches', 'XMLHttpRequest', 'DOMParser', 'XMLSerializer', 'Node', 'Element', 'HTMLElement', 'Text', 'Range', 'Selection', 'marked', 'XLSX', 'google', 'gapi', 'Worker', 'importScripts', 'require', 'eval', 'unescape', 'escape']);

const callRe = /(^|[^\w$.?])([a-zA-Z_$][\w$]*)\s*\(/g;
const undefinedCalls = new Map();
while ((m = callRe.exec(js)) !== null) {
  const name = m[2];
  if (JS_KEYWORDS.has(name) || BROWSER_GLOBALS.has(name) || bound.has(name)) continue;
  undefinedCalls.set(name, (undefinedCalls.get(name) || 0) + 1);
}
if (undefinedCalls.size) {
  errors.push(`Aanroep naar niet-bestaande functie(s): ${[...undefinedCalls.keys()].join(', ')}`);
}

/* ─── Mobiele ondergrens voor leesbare tekst ───
 * De schaal staat in docs/mobile.md: --fs-micro (11,5px op een telefoon) is
 * de kleinste maat die in beeld hoort te komen. Het bestand liep vol met
 * losse waarden tussen 8,5 en 11px omdat elke keer één pixel gewonnen moest
 * worden om iets op één regel te krijgen; los verdedigbaar, samen een scherm
 * waarop niets meer opvalt.
 *
 * Waarschuwing en geen fout: er zijn plekken waar een bewuste uitzondering
 * verdedigbaar is. Zet daar het woord mag-kleiner in een CSS-comment bij, op
 * dezelfde regel of de regel erboven, dan blijft de melding weg -- maar staat
 * in de code wel dat het een keuze was en geen slordigheid. */
const MOBIELE_ONDERGRENS = 11.5;
const mobieleBlokken = [];
const mediaRe = /@media[^{]*\(\s*max-width\s*:\s*(\d+)px\s*\)[^{]*\{/g;
let mm;
while ((mm = mediaRe.exec(html)) !== null) {
  if (Number(mm[1]) > 768) continue;          /* alleen telefoonbreedtes */
  /* Haakjes tellen tot het blok sluit, zodat geneste regels meetellen. */
  let diepte = 1, i = mediaRe.lastIndex;
  while (i < html.length && diepte > 0) {
    const c = html[i];
    if (c === '{') diepte++;
    else if (c === '}') diepte--;
    i++;
  }
  mobieleBlokken.push([mediaRe.lastIndex, i]);
}
const teKlein = new Map();
for (const [start, eind] of mobieleBlokken) {
  const blok = html.slice(start, eind);
  const fsRe = /font-size\s*:\s*([\d.]+)px/g;
  let f;
  while ((f = fsRe.exec(blok)) !== null) {
    const px = parseFloat(f[1]);
    if (px >= MOBIELE_ONDERGRENS) continue;
    /* Bewuste uitzondering? Kijk op dezelfde regel en de regel ervoor. */
    const totHier = html.slice(0, start + f.index);
    const regel = totHier.split('\n').length;
    const rest = html.slice(start + f.index);
    const dezeRegel = totHier.slice(totHier.lastIndexOf('\n') + 1) + rest.slice(0, rest.indexOf('\n'));
    const vorigeRegel = (html.slice(0, totHier.lastIndexOf('\n')).split('\n').pop() || '');
    if (/mag-kleiner/.test(dezeRegel) || /mag-kleiner/.test(vorigeRegel)) continue;
    teKlein.set(regel, px);
  }
}
if (teKlein.size) {
  const lijst = [...teKlein.entries()].map(([r, px]) => `regel ${r}: ${px}px`).join(', ');
  warnings.push(
    `font-size onder ${MOBIELE_ONDERGRENS}px in een mobiele media query (${teKlein.size}x) — ` +
    `${lijst}. Gebruik var(--fs-micro) of ruimer; zie docs/mobile.md.`
  );
}

/* ─── Actienamen in data-*-attributen ───
   De modules hangen hun knoppen aan één van zes tabellen via een
   data-attribuut. Staat er een naam in die niet in de bijbehorende tabel
   voorkomt, dan gebeurt er bij het klikken niets -- geen fout, geen melding,
   alleen een knop die niet werkt. Dat is dezelfde stilte als de
   onclick-controle hierboven vangt, maar dan via de andere weg.

   Dit vangt een typefout of een vergeten registratie. Een verkeerde
   ARGUMENTVOLGORDE vangt het niet; die verschilt per tabel en staat in
   CLAUDE.md onder "Actie aansluiten op een dispatcher". */
{
  const tabellen = [
    ['data-action',      'APP_ACTIONS'],
    ['data-change',      'APP_CHANGE_ACTIONS'],
    ['data-uren-action', 'UREN_CLICK_ACTIONS'],
    ['data-uren-change', 'UREN_CHANGE_ACTIONS'],
    ['data-fac-action',  'FAC_CLICK_ACTIONS'],
    ['data-fac-change',  'FAC_CHANGE_ACTIONS'],
  ];
  for (const [attr, tabel] of tabellen) {
    /* De sleutels van de tabel: zowel `const X={...}` als `Object.assign(X,{...})`,
       want APP_ACTIONS wordt in stukken gevuld. */
    const namen = new Set();
    const blokRe = new RegExp(
      '(?:const\\s+' + tabel + '\\s*=|Object\\.assign\\(\\s*' + tabel + '\\s*,)\\s*\\{', 'g');
    let b;
    while ((b = blokRe.exec(js)) !== null) {
      /* Van de openende accolade tot de bijbehorende sluitende. */
      let diepte = 0, i = b.index + b[0].length - 1;
      const start = i;
      for (; i < js.length; i++) {
        if (js[i] === '{') diepte++;
        else if (js[i] === '}') { diepte--; if (diepte === 0) break; }
      }
      const blok = js.slice(start, i);
      let m;
      const sleutelRe = /(?:^|[{,\s])([a-zA-Z_$][\w$]*)\s*:/g;
      while ((m = sleutelRe.exec(blok)) !== null) namen.add(m[1]);
    }
    if (!namen.size) continue;   /* tabel niet gevonden: niets te toetsen */

    const gebruikRe = new RegExp(attr + '\\s*=\\s*["\']([a-zA-Z_$][\\w$]*)["\']', 'g');
    const ontbreekt = new Set();
    let g;
    while ((g = gebruikRe.exec(html)) !== null) {
      if (!namen.has(g[1])) ontbreekt.add(g[1]);
    }
    if (ontbreekt.size) {
      errors.push(
        `${attr} verwijst naar ${ontbreekt.size} naam/namen die niet in ${tabel} staan: ` +
        [...ontbreekt].join(', ')
      );
    }
  }
}

/* ─── Versienummer ───
   Het nummer in de zijbalk is MAJOR.BUILD, en de teller in sw.js
   (CACHE_NAME = 'herling-v<n>') is die twee aan elkaar geplakt:
   n = MAJOR * 100 + BUILD. Dus v2.01 hoort bij herling-v201.

   BUILD loopt van 01 tot en met 99; daarna gaat MAJOR omhoog en begint BUILD
   weer bij 01 (v1.99 -> v2.01). De teller in sw.js blijft daarbij oplopen,
   want een cachenaam die terugspringt zou een oude cache opnieuw in gebruik
   nemen. Eén bron, twee plekken: zonder deze controle blijft er vroeg of laat
   een oud nummer in beeld staan terwijl de cache al verder is. */
{
  const inBeeld = html.match(/class="app-versie"[^>]*>v(\d+)\.(\d+)</);
  let sw = '';
  try { sw = readFileSync('sw.js', 'utf8'); } catch (e) { /* geen sw.js */ }
  const cache = sw.match(/CACHE_NAME\s*=\s*['"]herling-v(\d+)['"]/);
  if (!inBeeld) {
    errors.push('Versienummer niet gevonden in de zijbalk (span.app-versie, vorm "v1.81")');
  } else if (cache) {
    const n = Number(cache[1]);
    const major = Math.floor(n / 100), build = n % 100;
    const hoort = `v${major}.${String(build).padStart(2, '0')}`;
    const staat = `v${inBeeld[1]}.${inBeeld[2]}`;
    if (build === 0) {
      errors.push(`sw.js staat op herling-v${n}; een build van 00 bestaat niet. ` +
        `Na v${major - 1}.99 komt v${major}.01, dus herling-v${major * 100 + 1}.`);
    } else if (staat !== hoort) {
      errors.push(
        `Versienummer loopt uit de pas: zijbalk toont ${staat}, sw.js staat op ` +
        `herling-v${n}. Dat hoort ${hoort} te zijn (n = major * 100 + build).`
      );
    }
  }
}

/* ─── Output ─── */
if (errors.length) {
  console.error('✗ VALIDATION FAILED');
  errors.forEach(e => console.error('  • ' + e));
  if (warnings.length) {
    console.error('  Warnings:');
    warnings.forEach(w => console.error('  ⚠ ' + w));
  }
  process.exit(1);
} else {
  console.log('✓ Syntax + structure checks passed');
  if (warnings.length) {
    console.log('  Warnings (non-blocking):');
    warnings.forEach(w => console.log('  ⚠ ' + w));
  }
  process.exit(0);
}
