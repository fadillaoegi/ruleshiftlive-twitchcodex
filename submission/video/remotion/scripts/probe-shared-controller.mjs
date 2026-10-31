// Scrolls the actual controller to its queue so the broadcast source can be matched.
// Does not approve a proposal or start a round.
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const pages=await(await fetch('http://127.0.0.1:9226/json/list')).json();
const page=pages.find(p=>p.type==='page'&&p.url.startsWith('http://localhost:5174'));
if(!page)throw new Error('Visible controller missing');
const socket=new WebSocket(page.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});});
socket.addEventListener('message',e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);}});
const command=(method,params={})=>new Promise((ok,fail)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);fail(new Error(method+' timeout'));},10000);pending.set(key,{ok,fail,timer});socket.send(JSON.stringify({id:key,method,params}));});
try{
 await command('Runtime.evaluate',{expression:'document.querySelector(".proposal-section")?.scrollIntoView({block:"center",behavior:"smooth"})'});
 await new Promise(r=>setTimeout(r,1500));
 const result=await command('Page.captureScreenshot',{format:'png'});
 await writeFile(resolve(root,'.local/live-broadcast/controller-source-probe.png'),Buffer.from(result.data,'base64'));
 console.log('Actual controller scrolled to proposal queue; no approval or round started.');
}finally{socket.close();}
