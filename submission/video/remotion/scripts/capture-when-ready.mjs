import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../',import.meta.url));
const deadline=Date.now()+15*60*1000;
let last='';
while(Date.now()<deadline) {
  try {
    const s=await (await fetch('http://localhost:8080/api/state')).json();
    const pending=s.proposals?.some(p=>p.source==='twitch'&&['pending','approved'].includes(p.status)&&p.rule?.trigger?.every===3&&p.rule?.effect?.duration_ms===4000);
    const state=`Twitch ${s.twitch?.state}; unused controlled proposal ${pending?'ready':'waiting'}`;
    if(state!==last){console.log(state);last=state;}
    if(s.twitch?.state==='connected'&&pending&&s.round?.status!=='running') {
      const code=await new Promise((resolve,reject)=>{
        const p=spawn(process.execPath,['scripts/capture-demo.mjs','live'],{cwd,stdio:'inherit'});
        p.once('error',reject);p.once('exit',resolve);
      });
      process.exitCode=code??1;break;
    }
  } catch {if(last!=='Backend unavailable'){console.log('Backend unavailable');last='Backend unavailable';}}
  await new Promise(resolve=>setTimeout(resolve,3000));
}
