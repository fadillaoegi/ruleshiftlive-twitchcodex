import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

export const root = new URL('../', import.meta.url);
export async function environment() {
  let local = {};
  try { local = parseEnv(await readFile(new URL('backend/.env', root), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('Cannot read backend/.env. Check its permissions locally.'); }
  // Parse values as data. Never execute shell commands from a .env file.
  return { ...local, ...process.env };
}
