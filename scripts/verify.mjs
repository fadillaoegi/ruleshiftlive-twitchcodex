import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { environment } from './environment.mjs';

const root = new URL('../', import.meta.url);
const evidence = new URL('docs/evidence/', root);
const logs = new URL('.local/checks/', root);
await Promise.all([mkdir(evidence, { recursive: true }), mkdir(logs, { recursive: true })]);
const env = await environment();
env.RULESHIFT_VERTICAL_EVIDENCE = fileURLToPath(new URL('vertical-slice.json', evidence));
await rm(env.RULESHIFT_VERTICAL_EVIDENCE, { force: true });
if (env.RULESHIFT_OFFLINE === '1') { env.GOPROXY = 'off'; env.GOSUMDB = 'off'; }
const checks = [
  { name: 'backend-tests', directory: 'backend', program: 'go', args: ['test', '-race', '-count=1', '-json', './...'] },
  { name: 'backend-vet', directory: 'backend', program: 'go', args: ['vet', './...'] },
  { name: 'web-tests', directory: 'web', program: 'npm', args: ['test'] },
  { name: 'web-build', directory: 'web', program: 'npm', args: ['run', 'build'] },
];
async function run(check) {
  const started = Date.now();
  const result = await new Promise(resolve => {
    const child = spawn(check.program, check.args, { cwd: new URL(`${check.directory}/`, root), env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', error => resolve({ code: -1, stdout, stderr: error.message }));
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
  await writeFile(new URL(`${check.name}.log`, logs), result.stdout + result.stderr);
  const summary = { name: check.name, command: [check.program, ...check.args].join(' '), status: result.code === 0 ? 'passed' : 'failed', exit_code: result.code, elapsed_ms: Date.now() - started };
  if (check.name === 'backend-tests') {
    const events = result.stdout.split('\n').flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
    summary.tests_passed_including_subtests = events.filter(e => e.Action === 'pass' && e.Test).length;
    summary.skipped_tests = events.filter(e => e.Action === 'skip' && e.Test).map(e => `${e.Package}/${e.Test}`);
  }
  console.log(`${check.name}: ${summary.status}`);
  if (result.code !== 0) console.log(result.stderr || result.stdout);
  return summary;
}
const results = await Promise.all(checks.map(run));
const report = { recorded_at: new Date().toISOString(), source: 'Actual local commands executed by Codex', platform: `${process.platform}/${process.arch}`, node: process.version, checks: results, evidence_limits: ['EventSub tests use synthetic protocol fixtures, not Twitch.', 'Real PostgreSQL integration is pending unless the opt-in test ran.', 'Browser/OBS QA is not included in this command.', 'AI interpretation is not implemented.'] };
await writeFile(new URL('local-checks.json', evidence), JSON.stringify(report, null, 2) + '\n');
console.log(`Evidence: ${fileURLToPath(new URL('local-checks.json', evidence))}`);
if (results.some(result => result.status !== 'passed')) process.exitCode = 1;
