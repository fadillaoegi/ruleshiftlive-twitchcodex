// Records actual rendered Twitch frames with wall-clock timestamps.
// No synthetic viewer, gameplay, chat or approvals.
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const dir=resolve(root,'.local/live-broadcast');await mkdir(dir,{recursive:true});
const controller=process.argv.includes('--controller');
const prefix=controller?'shared-controller':'broadcast-page';
const target=(await(await fetch('http://127.0.0.1:9226/json/list')).json()).find(t=>t.type==='page'&&(controller?t.url.startsWith('http://localhost:5174'):t.url==='https://www.twitch.tv/fldevboo'));
if(!target)throw new Error('Actual capture page missing');
const broadcast=JSON.parse(await readFile(resolve(root,'submission/video/stream-setup/twitch-status.json'),'utf8'));
if(!broadcast.is_live)throw new Error('Broadcast status must be live');
const started=new Date();const stamp=started.toISOString().replace(/[:.]/g,'-');
const file=resolve(dir,`${prefix}-${stamp}.mp4`);
const log=await import('node:fs');const errors=log.createWriteStream(resolve(dir,`${prefix}-encoder.log`));
const ffmpeg=spawn('ffmpeg',['-hide_banner','-loglevel','warning','-y','-use_wallclock_as_timestamps','1','-f','image2pipe','-framerate','30','-vcodec','mjpeg','-i','pipe:0','-vf','fps=30','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',file],{stdio:['pipe','ignore','pipe']});ffmpeg.stderr.pipe(errors);
let fatal=null;ffmpeg.on('error',e=>fatal=e);ffmpeg.stdin.on('error',e=>fatal=e);
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;let frames=0;const pending=new Map();let stopping=false;
await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});});
const command=(method,params={})=>new Promise((ok,fail)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);fail(new Error(method+' timeout'));},10000);pending.set(key,{ok,fail,timer});socket.send(JSON.stringify({id:key,method,params}));});
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);}
 if(m.method==='Page.screencastFrame'&&!stopping){ffmpeg.stdin.write(Buffer.from(m.params.data,'base64'));frames++;socket.send(JSON.stringify({id:++id,method:'Page.screencastFrameAck',params:{sessionId:m.params.sessionId}}));if(frames===1)console.log(`RECORDER READY: actual ${controller?'shared controller':'public Twitch player and chat'} frames are recording.`);}
});
await command('Page.enable');await command('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1280,maxHeight:720,everyNthFrame:1});
let observations=[];try{observations=JSON.parse(await readFile(resolve(dir,'broadcast-observations.json'),'utf8'));}catch{}
async function observe(){try{const s=await(await fetch('http://localhost:8080/api/state')).json();const own=s.proposals?.filter(p=>p.source==='twitch'&&p.author==='fldevboo'&&Date.parse(p.created_at)>=started.getTime()-10000).map(p=>({id:p.id,message_id:p.message_id,status:p.status,created_at:p.created_at,rule:p.rule}));const o={at:new Date().toISOString(),twitch:s.twitch?.state,database:s.database,proposals:own,round:s.round?{id:s.round.id,proposal_id:s.round.proposal_id,message_id:s.round.message_id,source:s.round.source,status:s.round.status,coins:s.round.coins,sequence:s.round.sequence,result_saved:s.round.result_saved,started_at:s.round.started_at,ends_at:s.round.ends_at}:null};observations.push(o);await writeFile(resolve(dir,'broadcast-observations.json'),JSON.stringify(observations,null,2)+'\n');}catch{}}
await writeFile(resolve(dir,`${prefix}-recording.json`),JSON.stringify({started_at:started.toISOString(),pid:process.pid,file,broadcast_id:broadcast.broadcast_id,capture:'Actual Chromium Page.screencastFrame; wall-clock encoded; no application mutation'},null,2)+'\n');
await observe();
const until=Date.now()+1800000;
while(Date.now()<until&&!fatal){await new Promise(r=>setTimeout(r,3000));if(!controller)await observe();try{await access(resolve(dir,`stop-${prefix}-recording`));break;}catch{}}
stopping=true;await command('Page.stopScreencast');socket.close();ffmpeg.stdin.end();
const code=await new Promise(ok=>ffmpeg.once('close',ok));
await writeFile(resolve(dir,`${prefix}-recording-complete.json`),JSON.stringify({started_at:started.toISOString(),ended_at:new Date().toISOString(),frames,file,encoder_exit_code:code},null,2)+'\n');
if(fatal||code!==0)throw fatal??new Error('Encoder failed');console.log('Actual broadcast capture completed.');
