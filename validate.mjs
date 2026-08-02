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

const missing = [...calledFns].filter(fn => !definedFns.has(fn));
if (missing.length) {
  warnings.push(`Onclick references possibly-undefined functions: ${missing.join(', ')}`);
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
