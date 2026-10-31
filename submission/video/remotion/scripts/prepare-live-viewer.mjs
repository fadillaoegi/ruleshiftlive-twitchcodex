// Read-only public Twitch viewer in the isolated capture browser.
// Does not control the user's shared tab, send chat or start a game/broadcast.
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const dir=resolve(root,'.local/live-broadcast');
await mkdir(dir,{recursive:true});
const endpoint='http://127.0.0.1:9226';
const version=await(await fetch(endpoint+'/json/version')).json();
async function connect(url) {
 const socket=new WebSocket(url);let id=0;const pending=new Map();
 await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);}});
 return {close:()=>socket.close(),command:(method,params={})=>new Promise((ok,fail)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);fail(new Error(method+' timed out'));},25000);pending.set(key,{ok,fail,timer});socket.send(JSON.stringify({id:key,method,params}));})};
}
let target=(await(await fetch(endpoint+'/json/list')).json()).find(t=>t.type==='page'&&t.url==='https://www.twitch.tv/fldevboo');
if(!target){const browser=await connect(version.webSocketDebuggerUrl);try{const created=await browser.command('Target.createTarget',{url:'https://www.twitch.tv/fldevboo',newWindow:true,width:1600,height:1000});await new Promise(r=>setTimeout(r,15000));target=(await(await fetch(endpoint+'/json/list')).json()).find(t=>t.id===created.targetId);}finally{browser.close();}}
if(!target)throw new Error('Public viewer not available');
const page=await connect(target.webSocketDebuggerUrl);
try {
 await page.command('Page.enable');
 await page.command('Emulation.setDeviceMetricsOverride',{width:1280,height:650,deviceScaleFactor:1,mobile:false});
 const status=await page.command('Runtime.evaluate',{expression:'(()=>{const v=document.querySelector("video");return {title:document.title,video:v?{paused:v.paused,readyState:v.readyState,currentTime:v.currentTime,width:v.videoWidth,height:v.videoHeight}:null,buttons:[...document.querySelectorAll("button[aria-label]")].map(b=>b.getAttribute("aria-label")).filter(s=>/play|mute|theater|consent|accept/i.test(s))};})()',returnByValue:true});
 console.log(JSON.stringify(status.result.value));
 const screenshot=await page.command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 await writeFile(resolve(dir,'viewer-current.png'),Buffer.from(screenshot.data,'base64'));
 await writeFile(resolve(dir,'viewer-target.json'),JSON.stringify({prepared_at:new Date().toISOString(),target_id:target.id,url:target.url,independent_public_viewer:true,controls_shared_game:false},null,2)+'\n');
} finally {page.close();}
