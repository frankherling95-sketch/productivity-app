#!/usr/bin/env node
/* PostToolUse hook — runs after Claude edits/writes a file.
 * If herling_analytics_home.html was touched, run validate.mjs.
 * Failure here doesn't block the edit but surfaces the error to Claude.
 */
import { execSync } from 'node:child_process';

let raw = '';
process.stdin.on('data', d => raw += d);
process.stdin.on('end', () => {
  let data; try { data = JSON.parse(raw); } catch { process.exit(0); }
  const path = data.tool_input?.file_path || data.tool_input?.path || '';
  if (!path.endsWith('herling_analytics_home.html')) process.exit(0);

  try {
    const out = execSync('node validate.mjs', { encoding: 'utf8' });
    if (out.includes('Warnings')) {
      console.error(out);
    }
  } catch (e) {
    console.error('⚠ validate.mjs reported errors after edit:');
    console.error(e.stdout || e.message);
    /* Exit 2 so Claude sees the validation failure as feedback */
    process.exit(2);
  }
});
