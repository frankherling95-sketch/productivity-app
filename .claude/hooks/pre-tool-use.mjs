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

  /* Rule 2b: geen namen van klanten of relaties naar de openbare repo
     (2026-10-07). De git-hook in .githooks/pre-push doet dit ook, maar die
     staat alleen aan waar core.hooksPath is ingesteld -- in een verse
     cloudsessie niet. Deze hook draait altijd: validate.mjs loopt de
     bestanden en de berichten van de nog niet gepushte commits na. */
  if (/\bgit\s+push\b/.test(cmd) && !/--no-verify\b/.test(cmd)) {
    try {
      execSync('node validate.mjs --commits origin/main..HEAD', { stdio: 'pipe', encoding: 'utf8', timeout: 60000 });
    } catch (e) {
      const uit = String((e.stdout || '') + (e.stderr || '')).trim();
      if (/Naam van een klant/.test(uit) || e.status === 1) {
        console.error('BLOCKED: validate.mjs keurt deze push af.');
        console.error(uit.split('\n').slice(0, 12).join('\n'));
        console.error('Namen van klanten of relaties: vervang ze (CLAUDE.md, "Geen namen"). ' +
          'Staat er een in een commitbericht dat nog niet gepusht is: herschrijf dat bericht vóór de push.');
        process.exit(2);
      }
    }
  }

  /* Rule 3: warn loudly on rm -rf, git reset --hard outside common cases */
  if (/\brm\s+-rf?\s+\//.test(cmd)) {
    console.error('BLOCKED: rm -rf on absolute path. Confirm with user explicitly.');
    process.exit(2);
  }

  process.exit(0);
});
