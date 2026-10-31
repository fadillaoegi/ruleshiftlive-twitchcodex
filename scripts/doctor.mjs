// Read-only checks: no containers, roles, databases, migrations or tokens created.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import dns from 'node:dns/promises';
import { environment, root } from './environment.mjs';
import { configuration } from './configuration.mjs';

const env = await environment();
let config;
try { config = configuration(env); }
catch (error) {
  const report = { recorded_at: new Date().toISOString(), source: 'Actual read-only preflight commands', configuration: { status: 'invalid', detail: error.message }, live_twitch: 'pending' };
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes('--save')) {
    await mkdir(new URL('docs/evidence/', root), { recursive: true });
    await writeFile(new URL('docs/evidence/environment.json', root), JSON.stringify(report, null, 2) + '\n');
  }
  process.exit(1);
}
async function command(program, args, options = {}) {
  return new Promise(resolve => {
    const child = spawn(program, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { if (stdout.length < 262144) stdout += chunk; });
    child.stderr.on('data', chunk => { if (stderr.length < 262144) stderr += chunk; });
    child.on('error', () => resolve({ code: -1, stdout: '', stderr: '' }));
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}
function listener(port, host) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', error => resolve({ host, port, status: error.code === 'EADDRINUSE' ? 'occupied' : 'blocked', code: error.code }));
    server.listen(port, host, () => server.close(() => resolve({ host, port, status: 'available' })));
  });
}
const [docker, backendPort, webPort, twitchDNS] = await Promise.all([
  command('docker', ['ps', '--format', '{{json .}}']),
  listener(Number(config.backendURL.port || 80), config.backendURL.hostname.replace(/^\[|\]$/g, '')),
  listener(Number(config.webURL.port || 80), '127.0.0.1'),
  dns.lookup('id.twitch.tv').then(() => 'resolved', () => 'unavailable'),
]);
let postgres = { status: 'not_configured', target_major: 18, detail: 'Set DATABASE_URL for the existing PostgreSQL 18 container in backend/.env.' };
if (env.DATABASE_URL) {
  const check = await command('go', ['run', './cmd/dbcheck'], { cwd: new URL('backend/', root), env });
  try { postgres = { ...JSON.parse(check.stdout), target_major: 18 }; }
  catch { postgres = { status: 'unavailable', target_major: 18, detail: 'Database check could not run. Confirm Go is installed and build dependencies are available.' }; }
}
const report = {
  recorded_at: new Date().toISOString(), source: 'Actual read-only preflight commands',
  configuration: { status: 'valid' },
  docker: docker.code === 0 ? {
    status: 'reachable',
    containers: docker.stdout.trim().split('\n').filter(Boolean).flatMap(line => {
      try { const row = JSON.parse(line); return [{ name: row.Names, image: row.Image, ports: row.Ports }]; } catch { return []; }
    }),
  } : { status: /permission denied|operation not permitted/i.test(docker.stderr) ? 'permission_denied' : 'unavailable', detail: 'Could not list containers. No existing container was changed.' },
  listeners: [backendPort, webPort], postgres,
  credentials: Object.fromEntries(['DATABASE_URL', 'TEST_DATABASE_URL', 'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET'].map(key => [key, env[key] ? 'set' : 'missing'])),
  twitch_dns: twitchDNS,
  live_twitch: 'pending: interactive OAuth and a real channel message must still be verified',
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--save')) {
  await mkdir(new URL('docs/evidence/', root), { recursive: true });
  await writeFile(new URL('docs/evidence/environment.json', root), JSON.stringify(report, null, 2) + '\n');
}
if (postgres.status !== 'connected' || [backendPort, webPort].some(p => p.status !== 'available') || report.credentials.TWITCH_CLIENT_ID === 'missing' || report.credentials.TWITCH_CLIENT_SECRET === 'missing' || twitchDNS !== 'resolved') process.exitCode = 1;
