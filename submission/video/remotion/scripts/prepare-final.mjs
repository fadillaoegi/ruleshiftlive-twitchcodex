// Prepare the narrated final edit from the user's audio and verified sources.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const out=resolve(root,'submission/video/final');
const assets=resolve(root,'submission/video/remotion/public/final');
await mkdir(out,{recursive:true});await mkdir(assets,{recursive:true});
const prior=JSON.parse(await readFile(resolve(root,'submission/video/demo/edit-plan.json'),'utf8'));
const durations={overview:13,approval:15,codex:20,source:15};
const trim={approval:4,codex:2};
const info={
 broadcast:['BROADCAST READY','A real Twitch viewer','Actual public broadcast','Browser-based streaming','Gameplay close-ups follow'],
 overview:['THE IDEA','Chat becomes a game mechanic','1. Viewers suggest a rule','2. The streamer reviews it','3. The game applies it'],
 twitch:['THE PROPOSAL','Every third coin → reverse gravity','From real Twitch chat','Author credit is preserved','Approved before filming'],
 approval:['STREAMER CONTROL','Chat proposes. You decide.','Review trigger + effect','Start one approved round','No automatic activation'],
 gravity:['THE EFFECT','3 coins. 4 seconds.','The third coin is the trigger','Gravity really reverses','Normal gravity returns'],
 play:['KEEP PLAYING','Same controls. New physics.','A / D to move · Space to jump','Platforms stay solid','A repeat trigger refreshes time'],
 deadline:['AUTOMATIC CLEANUP','A 75-second round','The real deadline is enforced','Effects clear when it ends','The final score is delivered'],
 result:['TRACEABLE RESULT','Saved to PostgreSQL','12 coins · 4 gravity shifts','Rule + author + message ID','Download the round record'],
 guardrails:['BOUNDED INPUT','Unsupported rules stay blocked','A constrained rule parser','Chat never runs as code','Separate local rehearsal'],
 codex:['BUILT WITH CODEX','From implementation to checks','Go application boundaries','Twitch integration + game engine','Real source inspection + tests'],
 source:['DESIGNED TO BE CHECKED','Rules stay independent','Domain → application ports','Twitch + PostgreSQL adapters','Race, storage and UI checks'],
};
let frame=0,voice=0;const chapters=[];
function add(c){c.start_frame=frame;frame+=c.duration_frames;chapters.push(c);}
for(const c of prior.chapters){
 const next={...c,duration_frames:Math.round((durations[c.name]??c.duration_frames/60)*60),trim_in_seconds:trim[c.name]??0,info:info[c.name]??[],voice_file:null,voice_duration:0,voice_offset:0};
 if(c.narration){
  voice++;next.voice_file=`../voiceover/ruleshiftlive-vo-${voice}.mp3`;
  const file=resolve(out,next.voice_file);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',file],{encoding:'utf8'}));
  next.voice_duration=Number(probe.format.duration);next.voice_offset=.65;
  if(next.voice_duration+.95>next.duration_frames/60)throw new Error(`Voice ${voice} does not fit ${c.name}`);
 }
 if(c.name==='overview')next.source='Product overview · local rehearsal';
 if(c.name==='broadcast')next.source='Actual public Twitch broadcast · earlier capture';
 if(c.name==='twitch'||c.name==='approval'||c.name==='result')next.source='Actual Twitch-source controller recording';
 if(c.name==='gravity'||c.name==='play')next.source='Actual Twitch-source gameplay · normal speed';
 add(next);
 if(c.name==='overview')add({name:'explainer',kind:'diagram',file:'',duration_frames:420,title:'HOW ONE RULE CHANGES THE GAME',source:'3D explanation · illustrated, not gameplay footage',narration:'',voice_file:null,voice_duration:0,voice_offset:0,info:[],trim_in_seconds:0});
}
if(frame>=180*60)throw new Error('Final edit must be strictly shorter than three minutes.');
if(voice!==11)throw new Error('Expected the eleven user-supplied voice-over clips.');
const plan={...prior,prepared_at:new Date().toISOString(),version:2,duration_in_frames:frame,duration_seconds:frame/60,chapters,vo_embedded:true,subtitles:true,
 limits:['Public Twitch excerpt shows the app idle; gameplay is a separate verified real Twitch-source round.','The approved proposal was approved before filming; no approval click is invented.','The 3D explanation is an illustration, not additional gameplay evidence.','Unsupported-input footage is explicitly labelled local rehearsal.','Mouse and keyboard inputs were automated, without game-clock acceleration.'],
 narration_source:'Eleven audio recordings supplied by the user under submission/video/voiceover',subtitles_language:'en',music_source:'Original procedural neon/sci-fi composition, with narration ducking'};
await writeFile(resolve(out,'edit-plan.json'),JSON.stringify(plan,null,2)+'\n');
await writeFile(resolve(assets,'edit-plan.json'),JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({duration_seconds:frame/60,frames:frame,voice_files:voice,chapters:chapters.length}));
