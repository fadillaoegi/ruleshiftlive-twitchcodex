import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('../../../../',import.meta.url));
const project=resolve(root,'submission/video/remotion');
const output=resolve(root,'submission/video');
const capture=resolve(output,'captures');
const assets=resolve(project,'public/demo');
await mkdir(assets,{recursive:true});
await mkdir(resolve(output,'demo'),{recursive:true});
const read=async p=>JSON.parse(await readFile(p,'utf8'));
let live=null;
try {const candidate=await read(resolve(capture,'live-capture.json'));if(candidate.completed&&candidate.evidence_kind==='REAL_TWITCH_BROWSER_CAPTURE')live=candidate;}catch{}
const review=process.argv.includes('--review')||!live;
const overview=await read(resolve(capture,'overview-capture.json'));
const rehearsal=await read(resolve(capture,'rehearsal-capture.json'));
assertComplete(overview);assertComplete(rehearsal);
function assertComplete(record){if(!record.completed)throw new Error('Incomplete source capture cannot be used as a completed demo.');}
const chapters=[];
const cuts=[];
let cursor=0;
const add=(name,kind,file,duration,title,source,narration,extra={})=>{
  const frames=Math.round(duration*60);
  chapters.push({name,kind,file,duration_frames:frames,start_frame:cursor,title,source,narration,...extra});cursor+=frames;
};
function normalize(source,start,duration,name) {
  const file=resolve(assets,`${name}.mp4`);
  execFileSync('ffmpeg',['-y','-v','error','-ss',String(Math.max(0,start)),'-i',source,'-t',String(duration),'-vf',`scale=1600:900:force_original_aspect_ratio=decrease,pad=1600:900:(ow-iw)/2:(oh-ih)/2:color=0x070d18,tpad=stop_mode=clone:stop_duration=${duration}`,'-r','60','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',file],{stdio:'pipe'});
  return `demo/${name}.mp4`;
}
function shot(record,name,duration,out=name) {
  const s=record.shots.find(s=>s.name===name);if(!s)throw new Error(`Missing real source shot ${name}`);
  const actual=Math.min(duration,s.end_seconds-s.start_seconds);
  const sourceStart=Math.max(s.start_seconds,s.end_seconds-actual);
  cuts.push({file:record.file,shot:name,source_in_seconds:sourceStart,source_out_seconds:sourceStart+actual,hold_last_frame_seconds:Math.max(0,duration-actual),playback_rate:1});
  const file=resolve(assets,`${out}.mp4`);
  execFileSync('ffmpeg',['-y','-v','error','-ss',String(Math.max(0,sourceStart)),'-i',resolve(capture,record.file),'-t',String(actual),'-an','-c:v','libx264','-preset','fast','-crf','18','-r','60','-pix_fmt','yuv420p','-movflags','+faststart',file],{stdio:'pipe'});
  if(actual<duration-.02) {
    const padded=resolve(assets,`${out}-held.mp4`);
    execFileSync('ffmpeg',['-y','-v','error','-i',file,'-t',String(duration),'-vf',`tpad=stop_mode=clone:stop_duration=${duration}`,'-an','-c:v','libx264','-preset','fast','-crf','18','-r','60','-pix_fmt','yuv420p','-movflags','+faststart',padded],{stdio:'pipe'});
    return `demo/${out}-held.mp4`;
  }
  return `demo/${out}.mp4`;
}
for(const name of ['intro','closing'])await copyFile(resolve(output,`ruleshift-${name}.mp4`),resolve(assets,`${name}.mp4`));
add('intro','brand','demo/intro.mp4',6.5,'','','');
if(!review) {
  const broadcast=await read(resolve(capture,'twitch-broadcast-proof.json'));
  if(broadcast.evidence_kind!=='ACTUAL_PUBLIC_TWITCH_BROADCAST_CAPTURE'||!broadcast.visually_reviewed)throw new Error('Reviewed actual broadcast footage is required.');
  await copyFile(resolve(capture,broadcast.file),resolve(assets,'twitch-broadcast-proof.mp4'));
  cuts.push({file:broadcast.file,shot:'actual-public-broadcast',source_in_seconds:0,source_out_seconds:8,hold_last_frame_seconds:0,playback_rate:1});
  add('broadcast','video','demo/twitch-broadcast-proof.mp4',8,'STREAMED ON TWITCH','Actual broadcast · earlier in this session',
    'This is RuleShift Live on my Twitch channel, streamed from a browser. Now, the connected game in close-up.');
}
add('overview','video',shot(overview,'overview',13.5),13.5,'CHAT BECOMES GAMEPLAY','Product overview',
  'On Twitch, chat usually reacts to the game. RuleShift Live lets chat change it. Viewers propose a rule, the streamer approves it, and the rule changes actual game physics.');

if(!review) {
  add('twitch','video',shot(live,'real-proposal',12),12,'A REAL TWITCH PROPOSAL','Real Twitch capture',
    live.approval_status_at_capture_start==='approved'?'This real Twitch message became a proposal: every third coin reverses gravity for four seconds. The streamer has already approved it, and the viewer keeps the credit.':'A message from my Twitch channel becomes a proposal. The app checks it with a constrained parser: every third coin reverses gravity for four seconds. The viewer keeps the credit.');
  const approvalLength=Math.max(12,live.shots.find(s=>s.name==='approval').end_seconds-live.shots.find(s=>s.name==='approval').start_seconds);
  add('approval','video',shot(live,'approval',approvalLength),approvalLength,'THE STREAMER DECIDES','Real Twitch capture',
    live.approval_status_at_capture_start==='approved'?'Chat cannot activate a rule by itself. This proposal was approved before recording. I review its exact trigger and effect, then start the round. One approved rule controls this arena.':'Chat cannot activate a rule by itself. I review the proposal, approve it, and start the round. One approved rule controls this arena.');
  const gravityShot=live.shots.find(s=>s.name==='third-coin-and-expiry');
  const gravityLength=Math.max(14,gravityShot.end_seconds-gravityShot.start_seconds);
  add('gravity','video',shot(live,'third-coin-and-expiry',gravityLength),gravityLength,'THIRD COIN. REAL GRAVITY.','Real Twitch capture · normal speed',
    'On the third coin, acceleration reverses and the player rises toward the ceiling. Four seconds later, gravity returns automatically. Movement and collisions follow the rule.');
  add('play','video',shot(live,'continued-play',11),11,'SURVIVE THE SHIFT','Real Twitch capture · normal speed',
    'I keep playing with the same keyboard controls. Another third-coin trigger refreshes the effect, while the arena and its solid platforms stay playable.');
  add('deadline','video',shot(live,'automatic-round-end',10),10,'THE ROUND ENDS AUTOMATICALLY','Later in the same real round · normal speed',
    'At the end of the seventy-five-second round, the server closes the result. Effects clear, movement stops, and the final score is delivered.');
  add('result','video',shot(live,'saved-result-and-download',12),12,'SAVED AND TRACEABLE','Real Twitch capture',
    'The result is confirmed in PostgreSQL. I can download a round record with the rule, its author, the originating message, and observed gameplay events.');
} else {
  const archive=resolve(assets,'archive');await mkdir(archive,{recursive:true});
  const originals={
    chat:'/var/folders/zj/jl18ctdd2pg1b34_kc5nyp500000gn/T/codex-clipboard-kVgZpW.png',
    proposal:'/var/folders/zj/jl18ctdd2pg1b34_kc5nyp500000gn/T/codex-clipboard-yCQmar.png',
    result:'/var/folders/zj/jl18ctdd2pg1b34_kc5nyp500000gn/T/codex-clipboard-5ljjJ3.png',
  };
  for(const [name,path] of Object.entries(originals)) {
    await access(path);
    const crop=name==='chat'?'crop=iw*0.222:ih*0.112:iw*0.775:ih*0.277':name==='proposal'?'crop=iw*0.915:ih*0.275:iw*0.045:ih*0.545':'crop=iw*0.91:ih*0.88:iw*0.045:ih*0.11';
    execFileSync('ffmpeg',['-y','-v','error','-i',path,'-vf',crop,'-frames:v','1',resolve(archive,`${name}.png`)],{stdio:'pipe'});
  }
  add('archived-twitch','archive','',19,'REAL TWITCH TEST · EARLIER CAPTURE','Earlier user-provided screenshots · not a new live recording',
    'In our earlier real Twitch test, this chat message became a pending proposal. After approval, the game was playable and the completed round saved forty-five coins in PostgreSQL. These images document that earlier test.');
  add('rehearsal-setup','video',shot(rehearsal,'rehearsal-setup',14),14,'A CLEARLY LABELLED WALKTHROUGH','Local rehearsal · browser only',
    'For this recorded walkthrough, I am using the separate rehearsal mode. It runs the real application and physics engine, while keeping local testing distinct from Twitch and database evidence.');
  add('rehearsal-expiry','video',shot(rehearsal,'rehearsal-expiry',10),10,'FOUR SECONDS, THEN NORMAL GRAVITY','Local rehearsal · normal speed',
    'On the third coin, the player rises. The four-second effect expires automatically, and normal gravity returns without another button press.');
  add('rehearsal-stop','video',shot(rehearsal,'stop-control',8),8,'IMMEDIATE STREAMER CONTROL','Local rehearsal · browser only',
    'The third coin reverses gravity. Stop immediately restores normal gravity and ends the round.');
  add('rehearsal-result','video',shot(rehearsal,'rehearsal-result',6),6,'SOURCE SEPARATION','Local rehearsal · browser only',
    'The rehearsal result is explicitly browser-only. It never claims live database storage.');
}
add('guardrails','video',shot(rehearsal,'unsupported-rule',13),13,'ONLY SUPPORTED RULES CAN RUN','Local rehearsal · browser only',
  'Unsupported requests cannot be approved. Chat is never executed as code. Supported proposals pass through a bounded queue, and the streamer keeps control over every activation.');
const codex=normalize(resolve(capture,'codex-development.mp4'),8,22,'codex');
add('codex','video',codex,22,'BUILT AND VERIFIED WITH CODEX','Actual Codex screen recording',
  'I used Codex to build the Go application boundaries, Twitch integration, and TypeScript game engine. Here, Codex reviews the real rule and expiry logic and runs the checks. Tests cover race safety, PostgreSQL persistence, transport failures, and the game behavior.');
const engine=await readFile(resolve(root,'web/src/game/engine.ts'),'utf8');
const snippet=engine.slice(engine.indexOf('  collect(now:'),engine.indexOf('  stop():'));
const checks=await read(resolve(root,'docs/evidence/local-checks.json'));
await writeFile(resolve(assets,'source-evidence.json'),JSON.stringify({file:'web/src/game/engine.ts',snippet,checks:checks.checks.map(c=>({name:c.name,status:c.status,tests:c.tests_passed_including_subtests}))},null,2)+'\n');
add('source','source','',12,'ACTUAL PROJECT SOURCE','Read-only source and actual check results',
  'The implementation keeps domain rules independent from Twitch and storage. RuleShift Live turns audience suggestions into reversible gameplay changes, with streamer approval and an automatic return to normal gravity.');
add('closing','brand','demo/closing.mp4',5.5,'','','');
if(cursor>=180*60)throw new Error('The edit must stay below three minutes; shorten editorial segments without accelerating gameplay.');

const plan={version:1,prepared_at:new Date().toISOString(),review,ready_for_submission_review:!review,fps:60,width:1920,height:1080,duration_in_frames:cursor,duration_seconds:cursor/60,chapters,source_cuts:cuts,limits:review?['Fresh continuous Twitch capture is pending; archival images and rehearsal are explicitly labelled.','Do not treat this review cut as a final rules-compliance certification.']:['Footage is automated browser testing with natural cursor paths, not a claim of a human operator.','Narration script is separate; no voice performance is synthesized or embedded.'],vo_embedded:false,subtitles:false};
if(!review)plan.limits.push('The 8-second actual public Twitch broadcast shows the app idle; the gameplay close-ups are a separate verified Twitch-source round, not claimed to have been observed in that broadcast.');
await writeFile(resolve(assets,'edit-plan.json'),JSON.stringify(plan,null,2)+'\n');
await writeFile(resolve(output,`demo/edit-plan${review?'-review':''}.json`),JSON.stringify(plan,null,2)+'\n');
const time=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${(n%60).toFixed(1).padStart(4,'0')}`;
let voice=`# RuleShift Live — English voice-over script\n\nVersion: ${review?'review cut with clearly labelled archival evidence and rehearsal':'real Twitch demonstration'}.\n\nThis is a spoken narration script, not subtitles. No narration is burned into the video.\nRead in a calm, conversational tone. Pause at cuts and let the four-second effect be visible.\n\nTotal edit duration: ${time(cursor/60)}. Intro/closing contain original sound design.\n\n`;
for(const c of chapters) {
  const start=c.start_frame/60,end=(c.start_frame+c.duration_frames)/60;
  voice+=`## ${time(start)}–${time(end)} — ${c.title||c.name}\n\n`;
  if(!c.narration)voice+='[No voice-over. Let the original sound design play.]\n\n';
  else voice+=c.narration+'\n\n';
}
voice+='## Recording notes\n\nKeep the voice-over on its own editing track. Keep gameplay and Codex footage audible only if intentionally mixed; the captured screen clips contain no microphone audio. The clip source labels are evidence labels, not subtitles.\n';
const voiceName=review?'VOICEOVER-REVIEW-EN':'VOICEOVER-EN';
await writeFile(resolve(output,`demo/${voiceName}.md`),voice);
await writeFile(resolve(output,`demo/${voiceName}.txt`),chapters.filter(c=>c.narration).map(c=>c.narration).join('\n\n')+'\n');
console.log(JSON.stringify({review,duration_seconds:cursor/60,chapters:chapters.length,voiceover_words:chapters.map(c=>c.narration).join(' ').split(/\s+/).filter(Boolean).length}));
