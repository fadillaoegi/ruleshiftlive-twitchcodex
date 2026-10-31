// Public broadcast-status read only. No chat writes or broadcast mutations.
// Credentials and app access token stay in memory and are never logged/saved.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('../../../../',import.meta.url));
const out=resolve(root,'submission/video/stream-setup');
try {
  const env=parseEnv(await readFile(resolve(root,'backend/.env'),'utf8'));
  if(!env.TWITCH_CLIENT_ID||!env.TWITCH_CLIENT_SECRET)throw new Error('Twitch app credentials are missing from backend/.env.');
  const auth=await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.TWITCH_CLIENT_ID,client_secret:env.TWITCH_CLIENT_SECRET,grant_type:'client_credentials'}),signal:AbortSignal.timeout(15000)});
  if(!auth.ok)throw new Error(`Twitch app authorization unavailable (${auth.status}).`);
  const token=await auth.json();
  if(!token.access_token)throw new Error('Twitch app authorization response was incomplete.');
  const response=await fetch('https://api.twitch.tv/helix/streams?user_login=fldevboo',{headers:{'Client-Id':env.TWITCH_CLIENT_ID,Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`Twitch public stream status unavailable (${response.status}).`);
  const body=await response.json();
  const stream=body.data?.find(s=>s.user_login==='fldevboo'&&s.type==='live');
  const result={checked_at:new Date().toISOString(),source:'Actual read-only Twitch Helix Get Streams response',channel:'fldevboo',is_live:!!stream,broadcast_id:stream?.id??null,started_at:stream?.started_at??null,evidence_kind:stream?'ACTUAL_BROADCAST_STATUS':'ACTUAL_CHANNEL_OFFLINE',limits:['Public metadata status does not by itself prove the game is visible in the player.','No broadcast is started or stopped by this check.']};
  await mkdir(out,{recursive:true});await writeFile(resolve(out,'twitch-status.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
} catch(error) {
  // Do not expose fetch request objects, headers, tokens or upstream bodies.
  console.error(error?.name==='TimeoutError'?'Twitch status request timed out.':error?.message==='fetch failed'?'Twitch status network request unavailable.':error.message);
  process.exitCode=1;
}
