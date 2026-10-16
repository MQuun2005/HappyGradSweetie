// Validate the exact staged tree without stashing or changing the user's files.
// Generated snapshots stay under ignored .angular/; installed node_modules is reused.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const parent = path.join(root, '.angular', 'phase-checkpoints');
mkdirSync(parent, { recursive: true });
const target = mkdtempSync(path.join(parent, 'staged-'));
const prefix = target.replaceAll('\\', '/') + '/';
execFileSync('git', ['checkout-index', '--all', `--prefix=${prefix}`], { cwd: root });
symlinkSync(path.join(root, 'node_modules'), path.join(target, 'node_modules'), 'junction');
const cli = path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const run = (args) =>
  execFileSync(process.execPath, [cli, ...args], {
    cwd: target,
    stdio: 'inherit',
    env: process.env,
  });
console.log(`Validating staged checkpoint: ${target}`);
const edgeQA = existsSync(path.join(target, 'scripts/qa/karma-edge.cjs'));
run([
  'test',
  '--watch=false',
  ...(edgeQA
    ? ['--karma-config=scripts/qa/karma-edge.cjs', '--browsers=EdgeHeadlessQA']
    : ['--browsers=ChromeHeadless']),
]);
run(['build', '--configuration=github-pages']);
execFileSync(process.execPath, ['scripts/prepare-github-pages.mjs'], {
  cwd: target,
  stdio: 'inherit',
});
console.log('PASS: staged tests and GitHub Pages build; working files unchanged.');
