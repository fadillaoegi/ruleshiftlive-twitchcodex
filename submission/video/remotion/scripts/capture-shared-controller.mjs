// Drives the existing user-shared headful controller through real UI inputs.
// Public-viewer and controller video recorders must be armed separately.
// Real browser recording. No request interception, seeded live data, fake chat,
// altered game clocks, or direct engine calls. Cursor decoration is visual only.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const project=fileURLToPath(new URL('../../../../',import.meta.url));
const output=resolve(project,'.local/live-broadcast/shared-ui');
const mode='live';
assert.ok(process.argv.includes('--shared-source-confirmed'),'Confirm the actual shared source before running this controller.');
assert.ok(['overview','rehearsal','live'].includes(mode));
process.env.PLAYWRIGHT_BROWSERS_PATH=resolve(project,'.local/playwright-capture');
const {chromium}=await import('../../../../web/node_modules/playwright-core/index.mjs');
const origin='http://localhost:5174';
const rule='!rule Every third coin flips gravity for 4 seconds';
const status=async()=>{const r=await fetch('http://localhost:8080/api/state');assert.ok(r.ok);return r.json();};
let chosen=null;
if(mode==='live') {
  const s=await status();
  assert.equal(s.database,'connected');
  assert.equal(s.twitch.state,'connected','Reconnect Twitch in the existing controller before recording.');
  assert.notEqual(s.round?.status,'running','An existing round must finish before this capture.');
  chosen=s.proposals.find(p=>p.source==='twitch'&&['pending','approved'].includes(p.status)&&p.rule?.trigger?.every===3&&p.rule?.effect?.duration_ms===4000);
  assert.ok(chosen,'An unused real Twitch proposal is required; no fixture will be substituted.');
}
await mkdir(output,{recursive:true});
await mkdir(resolve(project,'.local/demo-raw'),{recursive:true});
const browser=await chromium.connectOverCDP('http://127.0.0.1:9226');
const context=browser.contexts()[0];
const page=context.pages().find(p=>p.url().startsWith(origin));
assert.ok(page,'Existing visible RuleShift controller must be available.');
await page.evaluate(()=>{
  const install=()=>{
    const pointer=document.createElement('div');pointer.id='demo-pointer';
    pointer.innerHTML='<svg width="29" height="33" viewBox="0 0 29 33"><path d="M3 2L25 19L15 20L11 30L3 2Z" fill="#f3faff" stroke="#08121d" stroke-width="2" stroke-linejoin="round"/></svg>';
    Object.assign(pointer.style,{position:'fixed',left:'0',top:'0',transform:'translate(116px,90px)',zIndex:'2147483647',pointerEvents:'none',filter:'drop-shadow(0 2px 5px #000b)'});
    document.documentElement.appendChild(pointer);
    document.addEventListener('mousemove',e=>pointer.style.transform=`translate(${e.clientX}px,${e.clientY}px)`,{passive:true});
    document.addEventListener('mousedown',e=>{
      const ring=document.createElement('div');Object.assign(ring.style,{position:'fixed',left:`${e.clientX-17}px`,top:`${e.clientY-17}px`,width:'34px',height:'34px',border:'2px solid #55eee8',borderRadius:'50%',pointerEvents:'none',zIndex:'2147483646'});
      document.documentElement.appendChild(ring);
      ring.animate([{transform:'scale(.3)',opacity:.9},{transform:'scale(1.8)',opacity:0}],{duration:450,easing:'ease-out'}).finished.then(()=>ring.remove());
    },{passive:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
});
const startedAt=Date.now();
const video=null;
const shots=[];
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
let pointer={x:116,y:90};
const pause=ms=>page.waitForTimeout(ms);
const mark=async(name,action)=>{
  const start=(Date.now()-startedAt)/1000;
  console.log(`Recording ${mode}: ${name}`);
  await action();
  shots.push({name,start_seconds:start,end_seconds:(Date.now()-startedAt)/1000});
};
async function scrollTo(selector,offset=55) {
  await page.locator(selector).first().waitFor();
  await page.evaluate(async({selector,offset})=>{
    const target=document.querySelector(selector);
    if(!target)throw new Error('Capture target unavailable');
    const begin=window.scrollY;
    const end=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,target.getBoundingClientRect().top+begin-offset));
    const start=performance.now();
    await new Promise(resolve=>{function step(now){const p=Math.min(1,(now-start)/1000);const e=p*p*(3-2*p);window.scrollTo(0,begin+(end-begin)*e);if(p<1)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);});
  },{selector,offset});
  await pause(350);
}
async function moveTo(locator,{click=false}={}) {
  const box=await locator.boundingBox();assert.ok(box,'UI target must be visible.');
  const end={x:box.x+box.width*.54,y:box.y+box.height*.52};
  const start={...pointer};
  const bend={x:(start.x+end.x)/2+55,y:(start.y+end.y)/2-48};
  for(let i=1;i<=38;i++) {
    const t=i/38,e=t*t*(3-2*t);
    const x=(1-e)*(1-e)*start.x+2*(1-e)*e*bend.x+e*e*end.x;
    const y=(1-e)*(1-e)*start.y+2*(1-e)*e*bend.y+e*e*end.y;
    await page.mouse.move(x,y);await pause(13);
  }
  pointer=end;await pause(click?320:450);
  if(click){await page.mouse.down();await pause(85);await page.mouse.up();await pause(400);}
}
async function typeRule(text) {
  const field=page.getByLabel('REHEARSAL MESSAGE');
  await moveTo(field,{click:true});await field.fill('');await field.pressSequentially(text,{delay:35});await pause(600);
}
async function reachCoins(target,direction,timeout=12000) {
  await page.keyboard.down(direction);
  try {await page.waitForFunction(n=>Number(document.querySelector('[data-testid="coins"]')?.textContent?.split('/')[0])>=n,target,{timeout});}
  finally {await page.keyboard.up(direction);}
}
async function visualPlayTo(target,timeout=22000) {
  const until=Date.now()+timeout;
  let held=null,alignedAt=0;
  const release=async()=>{if(held){await page.keyboard.up(held);held=null;}};
  try {
    while(Date.now()<until) {
      const view=await page.evaluate(()=>{
        const canvas=document.querySelector('canvas');
        const ctx=canvas?.getContext('2d');
        if(!canvas||!ctx)return null;
        const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let px=0,py=0,pn=0,cx=0,cy=0,cn=0;
        for(let y=22;y<canvas.height-20;y++)for(let x=6;x<canvas.width-6;x++) {
          const at=(y*canvas.width+x)*4,r=data[at],g=data[at+1],b=data[at+2];
          if(r>210&&g>205&&b>220&&b>=r&&r-g<20){px+=x;py+=y;pn++;}
          if(r>210&&g>165&&b<210){cx+=x;cy+=y;cn++;}
        }
        return {coins:Number(document.querySelector('[data-testid="coins"]')?.textContent?.split('/')[0]),player:pn?{x:px/pn,y:py/pn}:null,coin:cn?{x:cx/cn,y:cy/cn}:null};
      });
      if(view?.coins>=target)return;
      if(!view?.player||!view.coin){await pause(90);continue;}
      const dx=view.coin.x-view.player.x,dy=view.coin.y-view.player.y;
      if(Math.abs(dx)<9&&Math.abs(dy)>22) {
        alignedAt ||= Date.now();
        if(Date.now()-alignedAt>650) {
          await release();
          const key=view.coin.x<390?'d':'a';
          await page.keyboard.down(key);await pause(750);await page.keyboard.up(key);
          alignedAt=0;continue;
        }
      } else alignedAt=0;
      const desired=Math.abs(dx)<5?null:dx>0?'d':'a';
      if(desired!==held){await release();if(desired){await page.keyboard.down(desired);held=desired;}}
      await pause(90);
    }
    throw new Error(`Visual keyboard test did not reach ${target} coins in time.`);
  } finally {await release();}
}
let round=null;
let record=null;
let success=false;
try {
  await page.bringToFront();
  await page.getByRole('heading',{name:'Chat writes the rules. You survive them.'}).waitFor();
  await pause(1200);
  if(mode==='overview') {
    await mark('overview',async()=>{
      await moveTo(page.locator('.brand'));await pause(2200);
      await moveTo(page.locator('.mode-picker'));await pause(1800);
      await scrollTo('.arena-panel',75);await moveTo(page.locator('canvas'));await pause(3200);
    });
    await mark('source-separation',async()=>{
      await scrollTo('.source-banner',70);await pause(1600);
      await moveTo(page.getByRole('button',{name:'Twitch live'}),{click:true});await pause(3200);
    });
  }
  if(mode==='rehearsal') {
    await mark('unsupported-rule',async()=>{
      await scrollTo('.proposal-section',85);
      await typeRule('!rule execute arbitrary code');
      await moveTo(page.getByRole('button',{name:'Send rehearsal message'}),{click:true});
      await page.locator('.proposal.unsupported').waitFor();
      assert.equal(await page.getByRole('button',{name:'Approve rule'}).count(),0);
      await pause(3400);
    });
    await page.reload({waitUntil:'networkidle'});await pause(850);
    await mark('rehearsal-setup',async()=>{
      await scrollTo('.proposal-section',80);await typeRule(rule);
      await moveTo(page.getByRole('button',{name:'Send rehearsal message'}),{click:true});
      await moveTo(page.getByRole('button',{name:'Approve rule'}),{click:true});
      await scrollTo('.arena-panel',30);
      await moveTo(page.getByRole('button',{name:'Start approved round'}),{click:true});
      await moveTo(page.locator('canvas'),{click:true});
    });
    await mark('rehearsal-expiry',async()=>{
      await reachCoins(3,'d');
      await page.waitForFunction(()=>document.querySelector('[data-testid="gravity"]')?.textContent?.includes('Reversed'));
      await page.waitForFunction(()=>document.querySelector('[data-testid="gravity"]')?.textContent?.includes('Normal'),undefined,{timeout:6500});
      await pause(5100);
    });
    await mark('stop-control',async()=>{
      await visualPlayTo(6);
      await page.waitForFunction(()=>document.querySelector('[data-testid="gravity"]')?.textContent?.includes('Reversed'));
      await pause(500);
      await moveTo(page.getByRole('button',{name:'Stop round & clear effects'}),{click:true});
      await page.waitForFunction(()=>document.querySelector('[data-testid="game-event"]')?.textContent?.includes('All effects cleared'));
      assert.match(await page.getByTestId('gravity').textContent(),/Normal/);
      await pause(2400);
    });
    await mark('rehearsal-result',async()=>{
      await scrollTo('.result-card',100);
      assert.match(await page.getByTestId('result-storage').textContent(),/browser only/);
      await pause(2200);
    });
  }
  if(mode==='live') {
    await page.getByText('TWITCH SOURCE',{exact:true}).waitFor();
    await mark('live-connection',async()=>{
      await scrollTo('.source-banner',85);await pause(2200);
      await moveTo(page.locator('.connection-card'));await pause(2300);
    });
    await mark('real-proposal',async()=>{
      await scrollTo('.proposal-section',90);
      const card=page.locator('article.proposal.pending, article.proposal.approved').filter({hasText:'Every third coin flips gravity for 4 seconds'}).first();
      await card.waitFor();await moveTo(card);await pause(3500);
    });
    await mark('approval',async()=>{
      await pause(2000);
      if(chosen.status==='pending')await moveTo(page.getByRole('button',{name:'Approve rule'}).first(),{click:true});
      else await moveTo(page.locator('article.proposal.approved').first());
      const state=await status();assert.equal(state.proposals.find(p=>p.id===chosen.id)?.status,'approved');
      await pause(3300);await scrollTo('.arena-panel',25);
      await pause(2100);await moveTo(page.getByRole('button',{name:'Start approved round'}),{click:true});
      round=(await status()).round;
      assert.equal(round.source,'twitch');assert.equal(round.message_id,chosen.message_id);
      await moveTo(page.locator('canvas'),{click:true});
      await pause(1000);
    });
    await mark('third-coin-and-expiry',async()=>{
      await reachCoins(3,'d');
      await page.waitForFunction(()=>document.querySelector('[data-testid="gravity"]')?.textContent?.includes('Reversed'));
      await pause(950);
      await page.waitForFunction(()=>document.querySelector('[data-testid="gravity"]')?.textContent?.includes('Normal'),undefined,{timeout:6500});
      await pause(8000);
    });
    await mark('continued-play',async()=>{
      await visualPlayTo(12);await pause(4800);
    });
    console.log('Waiting for the real server deadline; no game clock acceleration.');
    await page.waitForFunction(()=>Number(document.querySelector('[data-testid="timer"]')?.textContent?.match(/\d+/)?.[0])<=6,undefined,{timeout:85000});
    await mark('automatic-round-end',async()=>{
      await page.waitForFunction(()=>Number(document.querySelector('[data-testid="timer"]')?.textContent?.match(/\d+/)?.[0])===0,undefined,{timeout:10000});
      await page.getByTestId('result-storage').filter({hasText:'Saved to PostgreSQL'}).waitFor({timeout:12000});
      await pause(1600);
    });
    await mark('saved-result-and-download',async()=>{
      await scrollTo('.result-card',90);await pause(2200);
      const downloadPromise=page.waitForEvent('download');
      await moveTo(page.getByRole('button',{name:'Download round record'}),{click:true});
      const download=await downloadPromise;
      const path=resolve(output,'live-round-record.json');await download.saveAs(path);
      record=JSON.parse(await readFile(path,'utf8'));
      assert.equal(record.evidence_kind,'TWITCH_CONTROLLER_RECORD');assert.equal(record.storage,'postgresql_confirmed');
      assert.equal(record.round.id,round.id);assert.equal(record.round.message_id,chosen.message_id);
      const first=record.controller_events.find(e=>e.kind==='gravity_flip'&&e.coins===3);
      const expiry=record.controller_events.find(e=>e.kind==='effect_expired'&&e.at>first?.at);
      assert.ok(first&&expiry,'First third-coin reversal and expiry must remain in the real controller trace.');
      const delta=Date.parse(expiry.at)-Date.parse(first.at);
      assert.ok(delta>=4000&&delta<4250,`Unexpected first effect expiry interval: ${delta}ms`);
      await pause(2500);
    });
  }
  assert.deepEqual(errors,[]);
  success=true;
} finally {
  // Never close the user's shared browser or its page.
  try { await page.keyboard.up('a'); await page.keyboard.up('d'); await page.keyboard.up('Space'); } catch {}
  const manifest={captured_at:new Date().toISOString(),capture:'Actual Chromium screen video with real DOM input events and decorative cursor',mode,evidence_kind:mode==='live'?'REAL_TWITCH_BROWSER_CAPTURE':mode==='overview'?'PRODUCT_OVERVIEW':'LOCAL_REHEARSAL',file:null,viewport:page.viewportSize(),requested_fps:null,automation:'Playwright UI testing with eased cursor movement; no claim of a human operator',shots,approval_status_at_capture_start:chosen?.status??null,round_id:round?.id??null,message_id:round?.message_id??null,script_errors:errors,completed:success};
  await writeFile(resolve(output,`${mode}-capture.json`),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({mode,shots:shots.map(s=>({name:s.name,duration:s.end_seconds-s.start_seconds})),round_id:round?.id??null,completed:success}));
  setTimeout(()=>process.exit(success?0:1),100);
}
