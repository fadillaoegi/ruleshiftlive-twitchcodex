import {bundle} from '@remotion/bundler';
import {getCompositions,renderStill} from '@remotion/renderer';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

// Remotion authors the frame layout and original 3D graphics. Native FFmpeg
// composites the actual 60 fps capture underneath its static editorial plates.
// The original full per-frame Remotion renderer remains render-demo.mjs.
const project=fileURLToPath(new URL('../',import.meta.url));
const out=fileURLToPath(new URL('../../demo/',import.meta.url));
const assets=resolve(project,'public');
const work=resolve(project,'../../../.local/video-demo-edit');
await mkdir(work,{recursive:true});await mkdir(resolve(out,'previews'),{recursive:true});
const plan=JSON.parse(await readFile(resolve(assets,'demo/edit-plan.json'),'utf8'));
let previous=null;
if(process.argv.includes('--reuse-verified-parts')) {
  const root=resolve(project,'../../../');
  const currentCapture=JSON.parse(await readFile(resolve(root,'submission/video/captures/live-capture.json'),'utf8'));
  const previousCapture=JSON.parse(await readFile(resolve(root,'.local/video-before-refresh/captures/live-capture.json'),'utf8'));
  if(!currentCapture.completed||currentCapture.round_id!==previousCapture.round_id)throw new Error('Part reuse requires the same verified gameplay capture.');
  previous=JSON.parse(await readFile(resolve(root,'.local/video-before-refresh/demo/edit-plan.json'),'utf8'));
}
if(plan.duration_seconds>=180)throw new Error('Demo must remain below three minutes');
const browserExecutable=process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromiumOptions={gl:'angle'};
const serveUrl=await bundle({entryPoint:resolve(project,'src/index.tsx'),publicDir:assets});
const compositions=await getCompositions(serveUrl,{browserExecutable,chromiumOptions,logLevel:'error'});
const composition=compositions.find(c=>c.id===(plan.review?'RuleShiftDemoReview':'RuleShiftDemo'));
const common={serveUrl,browserExecutable,chromiumOptions,composition,logLevel:'error',timeoutInMilliseconds:120000};
const encode=['-c:v','libx264','-preset','fast','-crf','18','-threads','4','-pix_fmt','yuv420p','-r','60','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-ar','48000','-ac','2','-b:a','256k','-movflags','+faststart'];
const run=args=>execFileSync('ffmpeg',['-y','-v','error',...args],{stdio:'pipe',maxBuffer:2e6});
const silent=['-f','lavfi','-i','anullsrc=r=48000:cl=stereo'];
const parts=[];
for(const c of plan.chapters) {
  const duration=c.duration_frames/60;
  const target=resolve(work,`${c.name}.mp4`);
  const frame=c.start_frame+Math.round(c.duration_frames*.58);
  const prior=previous?.chapters.find(p=>p.name===c.name);
  const same=prior&&['kind','file','duration_frames','title','source'].every(key=>prior[key]===c[key]);
  if(same) {
    await access(target);
    parts.push(target);console.log(`Reused verified unchanged edit part: ${c.name}`);continue;
  }
  if(c.kind==='brand') {
    run(['-i',resolve(assets,c.file),'-t',String(duration),...encode,target]);
  } else if(c.kind==='video') {
    const plate=resolve(work,`${c.name}-plate.png`);
    await renderStill({...common,composition:{...composition,props:{...composition.props,plan,plateOnly:true}},inputProps:{plan,plateOnly:true},frame,imageFormat:'png',output:plate,overwrite:true});
    run(['-loop','1','-framerate','60','-i',plate,'-i',resolve(assets,c.file),...silent,'-filter_complex','[1:v]scale=1792:924:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1[screen];[0:v][screen]overlay=x=64+(1792-overlay_w)/2:y=108+(924-overlay_h)/2:shortest=1,format=yuv420p[v]','-map','[v]','-map','2:a','-t',String(duration),...encode,target]);
  } else if(c.kind==='archive') {
    const images=[];
    for(const [i,start,length] of [[0,0,5],[1,5,6],[2,11,8]]) {
      const png=resolve(work,`archive-${i}.png`),clip=resolve(work,`archive-${i}.mp4`);
      await renderStill({...common,frame:c.start_frame+Math.round((start+length/2)*60),imageFormat:'png',output:png,overwrite:true});
      run(['-loop','1','-framerate','60','-i',png,...silent,'-t',String(length),...encode,clip]);images.push(clip);
    }
    const list=resolve(work,'archive-parts.txt');await writeFile(list,images.map(p=>`file '${p.replaceAll("'","'\\''")}'`).join('\n')+'\n');
    run(['-f','concat','-safe','0','-i',list,'-c','copy',target]);
  } else {
    const png=resolve(work,`${c.name}.png`);
    await renderStill({...common,frame,imageFormat:'png',output:png,overwrite:true});
    run(['-loop','1','-framerate','60','-i',png,...silent,'-t',String(duration),...encode,target]);
  }
  run(['-ss',String(duration*.58),'-i',target,'-frames:v','1',resolve(out,`previews/${c.name}.png`)]);
  parts.push(target);console.log(`Rendered actual edit: ${c.name}`);
}
const name=plan.review?'ruleshift-demo-review.mp4':'ruleshift-demo.mp4';
await import('./assemble-demo.mjs');
await writeFile(resolve(out,`render-info${plan.review?'-review':''}.json`),JSON.stringify({rendered_at:new Date().toISOString(),renderer:'Remotion 4.0.539 editorial plates and original 3D graphics; FFmpeg native capture compositing and assembly',file:name,review:plan.review,duration_seconds:plan.duration_seconds,frames:plan.duration_in_frames,fps:60,width:1920,height:1080,subtitles:false,embedded_voiceover:false,voiceover_script:plan.review?'VOICEOVER-REVIEW-EN.md':'VOICEOVER-EN.md',source_manifest:plan.review?'edit-plan-review.json':'edit-plan.json',playback_rate:1},null,2)+'\n');
console.log(`Saved ${resolve(out,name)}`);
