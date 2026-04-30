#!/usr/bin/env node
/* PreToolUse hook — runs before Claude executes a Bash command.
 * Reads the tool call from stdin (JSON), inspects it, exits 2 to BLOCK
 * the tool call with a reason shown back to Claude. Exit 0 to allow.
 */
import { execSync } from 'node:child_process';

let raw = '';
process.stdin.on('data', d => raw += d);
process.stdin.on('end', () => {
  let data; try { data = JSON.parse(raw); } catch { process.exit(0); }
  if (data.tool_name !== 'Bash') process.exit(0);
  const cmd = (data.tool_input?.command || '').trim();

  /* Rule 1: --force push always requires explicit user opt-in via env */
  if (/git\s+push[^\n]*--force\b/.test(cmd) && !/ALLOW_FORCE_PUSH=1/.test(cmd)) {
    console.error('BLOCKED: git push --force requires user-confirmed override.');
    console.error('Ask the user explicitly. If they agree, prefix with: ALLOW_FORCE_PUSH=1');
    console.error('Better: do `git fetch origin main` first and inspect `git log HEAD..origin/main`.');
    process.exit(2);
  }

  /* Rule 2: regular `git push` requires fetching first to confirm not behind */
  if (/^[^|;&]*git\s+push\b/.test(cmd) && !/--force\b/.test(cmd) && !/--no-verify\b/.test(cmd)) {
    try {
      execSync('git fetch origin main --quiet', { stdio: 'pipe', timeout: 10000 });
      const behind = execSync('git rev-list HEAD..origin/main --count', { encoding: 'utf8' }).trim();
      if (parseInt(behind, 10) > 0) {
        console.error(`BLOCKED: remote/main is ${behind} commit(s) ahead of local.`);
        console.error('Run `git pull --rebase origin main` first, then push.');
        console.error('See what you are missing with `git log HEAD..origin/main --oneline`.');
        process.exit(2);
      }
    } catch (e) {
      /* Allow when fetch fails — likely offline */
    }
  }

  /* Rule 3: warn loudly on rm -rf, git reset --hard outside common cases */
  if (/\brm\s+-rf?\s+\//.test(cmd)) {
    console.error('BLOCKED: rm -rf on absolute path. Confirm with user explicitly.');
    process.exit(2);
  }

  process.exit(0);
});
