// Opens the actual local controller in a dedicated Chrome app window.
// Does not start a round, approve a proposal, send chat or start broadcasting.
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../../../',import.meta.url));
const work=resolve(root,'.local/stream-controller');
const output=resolve(root,'submission/video/remotion/public/stream');
await mkdir(work,{recursive:true});await mkdir(output,{recursive:true});
const endpoint='http://127.0.0.1:9226';
let reachable=false;
try {reachable=(await fetch(endpoint+'/json/version',{signal:AbortSignal.timeout(500)})).ok;}catch{}
if(!reachable) {
  const child=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
    `--user-data-dir=${work}/profile`,'--remote-debugging-port=9226','--remote-debugging-address=127.0.0.1',
    '--no-first-run','--no-default-browser-check','--window-size=1320,880','--window-position=20,30',
    '--app=http://localhost:5174/?twitch=connected',
  ],{detached:true,stdio:'ignore'});child.unref();
  await writeFile(resolve(work,'browser.json'),JSON.stringify({pid:child.pid,endpoint,purpose:'Dedicated actual RuleShift controller; no livestream started'},null,2)+'\n');
}
const until=Date.now()+30000;
while(Date.now()<until){try{if((await fetch(endpoint+'/json/version',{signal:AbortSignal.timeout(500)})).ok){reachable=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
if(!reachable)throw new Error('Dedicated Chrome controller did not start.');
const targets=await(await fetch(endpoint+'/json/list')).json();
const target=targets.find(p=>p.type==='page'&&p.url?.startsWith('http://localhost:5174'));
if(!target)throw new Error('Dedicated RuleShift controller target unavailable.');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',()=>fail(new Error('Controller connection failed')),{once:true});});
let id=0;const pending=new Map();
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.fail(new Error(`Controller preview ${p.method} failed: ${m.error.message}`));else p.ok(m.result);}});
const command=(method,params={})=>new Promise((ok,fail)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);fail(new Error('Controller preview command timed out'));},20000);pending.set(key,{ok,fail,timer,method});socket.send(JSON.stringify({id:key,method,params}));});
try {
  await command('Page.enable');
  await command('Runtime.evaluate',{expression:'document.title="RuleShift Live — Demo controller"'});
  await command('Page.bringToFront');
  await command('Emulation.setDeviceMetricsOverride',{width:1320,height:752,deviceScaleFactor:1,mobile:false});
  await command('Runtime.evaluate',{expression:'new Promise(resolve=>{const until=Date.now()+15000;const check=()=>{if(document.querySelector(".source-banner")||Date.now()>until)resolve(true);else setTimeout(check,100);};check();})',awaitPromise:true});
  await command('Runtime.evaluate',{expression:'(()=>{const el=document.querySelector(".source-banner");if(el)window.scrollTo(0,el.getBoundingClientRect().top+scrollY-20);})()'});
  await new Promise(r=>setTimeout(r,800));
  const screenshot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(resolve(output,'controller.png'),Buffer.from(screenshot.data,'base64'));
  const s=await(await fetch('http://localhost:8080/api/state')).json();
  await writeFile(resolve(root,'submission/video/stream-setup/controller-preview.json'),JSON.stringify({captured_at:new Date().toISOString(),evidence_kind:'ACTUAL_CONTROLLER_PREVIEW_NOT_BROADCAST',url:'http://localhost:5174',twitch_state:s.twitch?.state,database:s.database,round_status:s.round?.status,started_broadcast:false,started_round:false,screenshot:'../remotion/public/stream/controller.png'},null,2)+'\n');
  console.log('Actual controller window prepared. No broadcast or round started.');
} finally {socket.close();}
