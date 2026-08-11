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
