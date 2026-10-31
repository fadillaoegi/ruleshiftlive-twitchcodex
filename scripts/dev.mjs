// Launch the Go backend and Vite from one command. Database containers are owned
// by the user; this launcher never starts or modifies Docker services.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { environment, root } from './environment.mjs';
import { configuration } from './configuration.mjs';

const env = await environment();
let config;
try {
  config = configuration(env);
} catch (error) { console.error(error.message); process.exit(1); }
const { address, origin, backendURL, webURL, redirectURI } = config;
if (process.argv.includes('--live') && ['DATABASE_URL','TWITCH_CLIENT_ID','TWITCH_CLIENT_SECRET'].some(key => !env[key])) {
  console.error('Live startup requires DATABASE_URL for your existing PostgreSQL 18 container and both Twitch app credentials in backend/.env. Run node scripts/doctor.mjs for status.');
  process.exit(1);
}
const binDirectory = new URL('.local/bin/', root);
await mkdir(binDirectory, { recursive: true });
const binary = fileURLToPath(new URL(`ruleshift-server${process.platform === 'win32' ? '.exe' : ''}`, binDirectory));
const built = await new Promise(resolve => {
  const child = spawn('go', ['build', '-o', binary, './cmd/server'], { cwd: new URL('backend/', root), env, stdio: 'inherit' });
  child.on('error', () => resolve(false)); child.on('close', code => resolve(code === 0));
});
if (!built) { console.error('Backend build failed. Verify Go and cached/downloaded dependencies.'); process.exit(1); }

// Backend credentials do not enter the frontend process environment.
const frontendEnv = Object.fromEntries(['PATH','HOME','SystemRoot','COMSPEC','TMPDIR','TEMP','TMP','LANG','LC_ALL','TERM'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
frontendEnv.RULESHIFT_BACKEND_ORIGIN = backendURL.origin;
frontendEnv.RULESHIFT_WEB_PORT = webURL.port || '80';
const children = [
  spawn(binary, [], { cwd: new URL('backend/', root), env: { ...env, HTTP_ADDR: address, WEB_ORIGIN: origin, TWITCH_REDIRECT_URI: redirectURI }, stdio: 'inherit' }),
  spawn(process.execPath, [fileURLToPath(new URL('web/node_modules/vite/bin/vite.js', root)), '--host', '127.0.0.1', '--port', frontendEnv.RULESHIFT_WEB_PORT, '--strictPort'], { cwd: new URL('web/', root), env: frontendEnv, stdio: 'inherit' }),
];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true; process.exitCode = code;
  for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  const deadline = setTimeout(() => { for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); }, 6000);
  deadline.unref();
}
for (const child of children) { child.on('error', () => stop(1)); child.on('exit', code => { if (!stopping) stop(code || 1); }); }
process.once('SIGINT', () => stop(0)); process.once('SIGTERM', () => stop(0));
const databaseMode = env.DATABASE_URL ? 'Database target: the existing PostgreSQL 18 instance in DATABASE_URL; the backend verifies the connection.' : 'Rehearsal startup: DATABASE_URL is missing, so live persistence is disabled.';
console.log(`Launching RuleShift Live: ${origin}\n${databaseMode}\nCtrl+C stops both owned processes.`);
