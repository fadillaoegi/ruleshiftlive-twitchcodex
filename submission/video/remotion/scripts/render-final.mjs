// Remotion authors 3D explanation, editorial plates and subtitle graphics.
// FFmpeg composites normal-speed actual footage and the user's mixed narration.
import {bundle} from '@remotion/bundler';
import {getCompositions,renderStill,renderMedia,openBrowser} from '@remotion/renderer';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('../',import.meta.url));
const root=resolve(project,'../../../'),out=resolve(root,'submission/video/final'),work=resolve(root,'.local/final-demo');
const assets=resolve(project,'public');const plan=JSON.parse(await readFile(resolve(out,'edit-plan.json'),'utf8'));
for(const p of ['plates','parts','subtitles'])await mkdir(resolve(work,p),{recursive:true});
await mkdir(resolve(out,'previews'),{recursive:true});
const browserExecutable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromiumOptions={gl:'angle'};
const serveUrl=await bundle({entryPoint:resolve(project,'src/final-index.tsx'),publicDir:assets});
const comps=await getCompositions(serveUrl,{browserExecutable,chromiumOptions,logLevel:'error'});
const puppeteerInstance=await openBrowser('chrome',{browserExecutable,chromiumOptions,logLevel:'error'});
const common={serveUrl,browserExecutable,chromiumOptions,puppeteerInstance,logLevel:'error',timeoutInMilliseconds:120000};
const still=async(id,props,output,frame=0)=>{const composition=comps.find(c=>c.id===id);if(!composition)throw new Error(id+' missing');await renderStill({...common,composition:{...composition,props:{...composition.props,...props}},inputProps:props,frame,output,imageFormat:'png',overwrite:true});};
const run=args=>execFileSync('ffmpeg',['-y','-v','error',...args],{stdio:'pipe',maxBuffer:3e6});
const encode=['-c:v','libx264','-preset','fast','-crf','18','-threads','4','-pix_fmt','yuv420p','-r','60','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart'];
if(process.argv.includes('--graphics')||process.argv.includes('--stills')){
 for(const c of plan.chapters){if(['brand','diagram'].includes(c.kind))continue;await still(c.kind==='source'?'FinalSource':'FinalPlate',{chapter:c},resolve(work,`plates/${c.name}.png`));console.log('Remotion layout: '+c.name);}
 for(const frame of [20,100,210,365])await still('RuleExplainer3D',{},resolve(out,`previews/diagram-${frame}.png`),frame);
 if(process.argv.includes('--stills')){await puppeteerInstance.close({silent:true});process.exit(0);}
 const composition=comps.find(c=>c.id==='RuleExplainer3D');let last=-1;
 await renderMedia({...common,composition,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',crf:18,x264Preset:'fast',concurrency:2,overwrite:true,outputLocation:resolve(work,'parts/explainer.mp4'),onProgress:({progress})=>{const next=Math.floor(progress*4);if(next!==last){last=next;console.log(`3D explanation: ${Math.min(100,next*25)}%`);}}});
 console.log('Original Remotion 3D explanation rendered.');
}
if(!process.argv.includes('--assemble')){await puppeteerInstance.close({silent:true});process.exit(0);}
if(!process.argv.includes('--captions-only')) {
const crops={twitch:'crop=1020:350:100:490,',result:'crop=1390:510:105:160,',guardrails:'crop=1400:350:100:500,'};
const parts=[];
for(const c of plan.chapters){
 const duration=c.duration_frames/60,target=resolve(work,`parts/${c.name}.mp4`);
 if(process.argv.includes('--reassemble-only')){parts.push(target);continue;}
 if(c.kind==='diagram'){parts.push(target);continue;}
 if(c.kind==='brand')run(['-i',resolve(assets,c.file),'-an','-t',String(duration),...encode,target]);
 else if(c.kind==='source')run(['-loop','1','-framerate','60','-i',resolve(work,`plates/${c.name}.png`),'-an','-frames:v',String(c.duration_frames),...encode,target]);
 else {
  run(['-loop','1','-framerate','60','-i',resolve(work,`plates/${c.name}.png`),'-ss',String(c.trim_in_seconds||0),'-i',resolve(assets,c.file),'-filter_complex',`[1:v]${crops[c.name]??''}scale=1380:710:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,tpad=stop_mode=clone:stop_duration=${duration}[screen];[0:v][screen]overlay=x=64+(1380-overlay_w)/2:y=190+(710-overlay_h)/2:shortest=1,format=yuv420p[v]`,'-map','[v]','-an','-frames:v',String(c.duration_frames),...encode,target]);
 }
 parts.push(target);console.log('Composited actual footage: '+c.name);
}
// Remotion and native encodes use different MP4 timebases. Normalize every
// chapter before concatenation so a source timebase cannot stretch or freeze it.
const normalized=[];
for(const [i,part] of parts.entries()){
 const path=resolve(work,`parts/${plan.chapters[i].name}-normalized.mp4`);
 run(['-i',part,'-an','-c:v','copy','-video_track_timescale','90000',path]);
 const data=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=nb_frames,duration,time_base','-of','json',path],{encoding:'utf8'})).streams[0];
 if(Number(data.nb_frames)!==plan.chapters[i].duration_frames||Math.abs(Number(data.duration)-plan.chapters[i].duration_frames/60)>.02||data.time_base!=='1/90000')throw new Error('Chapter timeline verification failed: '+plan.chapters[i].name);
 normalized.push(path);
}
const list=resolve(work,'final-parts.txt');await writeFile(list,normalized.map((p,i)=>`file '${p.replaceAll("'","'\\''")}'\nduration ${plan.chapters[i].duration_frames/60}`).join('\n')+'\n');
run(['-f','concat','-safe','0','-i',list,'-an','-c:v','copy','-video_track_timescale','90000',resolve(work,'picture.mp4')]);
const picture=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=nb_frames,duration,avg_frame_rate','-of','json',resolve(work,'picture.mp4')],{encoding:'utf8'})).streams[0];
if(Number(picture.nb_frames)!==plan.duration_in_frames||Math.abs(Number(picture.duration)-plan.duration_seconds)>.03||picture.avg_frame_rate!=='60/1')throw new Error('Assembled picture timeline differs from the narration plan');
}
const cues=JSON.parse(await readFile(resolve(out,'subtitles.json'),'utf8'));
// An entirely transparent blank interval; no empty subtitle box is displayed.
run(['-f','lavfi','-i','color=c=black@0.0:s=1920x128,format=rgba','-frames:v','1',resolve(work,'subtitles/clear.png')]);
const entries=[];let cursor=0;
const entry=(path,frames)=>{if(frames>0)entries.push(`file '${path.replaceAll("'","'\\''")}'\nduration ${(frames/60).toFixed(9)}`);};
for(const [i,cue] of cues.entries()){
 const file=resolve(work,`subtitles/${String(i).padStart(3,'0')}.png`);
 await still('SubtitleCard',{cue},file);
 const start=Math.round(cue.start*60),end=Math.round(cue.end*60);
 if(start<cursor)throw new Error('Subtitle cues overlap');
 entry(resolve(work,'subtitles/clear.png'),start-cursor);entry(file,end-start);cursor=end;
}
entry(resolve(work,'subtitles/clear.png'),plan.duration_in_frames-cursor);
entries.push(`file '${resolve(work,'subtitles/clear.png')}'`);
await writeFile(resolve(work,'subtitle-images.txt'),entries.join('\n')+'\n');
run(['-f','concat','-safe','0','-i',resolve(work,'subtitle-images.txt'),'-vf','fps=60,format=argb','-frames:v',String(plan.duration_in_frames),'-c:v','qtrle','-threads','2',resolve(work,'subtitles.mov')]);
run(['-i',resolve(work,'picture.mp4'),'-i',resolve(work,'subtitles.mov'),'-i',resolve(out,'audio/final-mix.wav'),'-filter_complex','[0:v][1:v]overlay=0:940:shortest=1,format=yuv420p[v]','-map','[v]','-map','2:a','-t',String(plan.duration_seconds),'-frames:v',String(plan.duration_in_frames),...encode,'-c:a','aac','-b:a','320k','-ar','48000','-ac','2',resolve(out,'ruleshift-demo-final.mp4')]);
await writeFile(resolve(out,'render-info.json'),JSON.stringify({rendered_at:new Date().toISOString(),renderer:'Remotion 4.0.539: original 3D explanation, editorial graphics and subtitle cards; FFmpeg normal-speed source compositing',file:'ruleshift-demo-final.mp4',duration_seconds:plan.duration_seconds,frames:plan.duration_in_frames,width:1920,height:1080,fps:60,embedded_voiceover:true,burned_in_subtitles:true,subtitle_language:'en',original_music:true,source_plan:'edit-plan.json',limits:plan.limits},null,2)+'\n');
console.log('Final narrated and subtitled Remotion demo saved.');
await puppeteerInstance.close({silent:true});
