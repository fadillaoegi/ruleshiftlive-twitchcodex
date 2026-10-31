import {bundle} from '@remotion/bundler';
import {getCompositions,renderMedia,renderStill} from '@remotion/renderer';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const project=fileURLToPath(new URL('../',import.meta.url));
const out=fileURLToPath(new URL('../../demo/',import.meta.url));
const plan=JSON.parse(await readFile(resolve(project,'public/demo/edit-plan.json'),'utf8'));
await mkdir(out,{recursive:true});
await mkdir(resolve(out,'previews'),{recursive:true});
const browserExecutable=process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromiumOptions={gl:'angle'};
console.log(`Bundling ${plan.review?'review cut':'real Twitch demo'}: ${plan.duration_seconds}s`);
const serveUrl=await bundle({entryPoint:resolve(project,'src/index.tsx'),publicDir:resolve(project,'public')});
const compositions=await getCompositions(serveUrl,{browserExecutable,chromiumOptions,logLevel:'error'});
const id=plan.review?'RuleShiftDemoReview':'RuleShiftDemo';
const composition=compositions.find(c=>c.id===id);if(!composition)throw new Error('Demo composition unavailable');
const common={serveUrl,browserExecutable,chromiumOptions,composition,logLevel:'error',timeoutInMilliseconds:120000};
for(const chapter of plan.chapters.filter(c=>c.kind!=='brand')) {
  const frame=chapter.start_frame+Math.round(chapter.duration_frames*.58);
  await renderStill({...common,frame,imageFormat:'png',output:resolve(out,`previews/${chapter.name}.png`),overwrite:true});
  console.log(`Preview: ${chapter.name}`);
}
if(process.argv.includes('--stills'))process.exit(0);
const name=plan.review?'ruleshift-demo-review.mp4':'ruleshift-demo.mp4';
let last=-1;
await renderMedia({...common,codec:'h264',audioCodec:'aac',audioBitrate:'256k',audioSampleRate:48000,pixelFormat:'yuv420p',colorSpace:'bt709',crf:18,x264Preset:'fast',concurrency:2,outputLocation:resolve(out,name),overwrite:true,onProgress:({progress})=>{
  const n=Math.floor(progress*20);if(n!==last){last=n;console.log(`Demo render: ${Math.min(100,n*5)}%`);}
}});
await writeFile(resolve(out,`render-info${plan.review?'-review':''}.json`),JSON.stringify({rendered_at:new Date().toISOString(),renderer:'Remotion 4.0.539',file:name,review:plan.review,duration_seconds:plan.duration_seconds,frames:plan.duration_in_frames,fps:60,width:1920,height:1080,subtitles:false,embedded_voiceover:false,voiceover_script:plan.review?'VOICEOVER-REVIEW-EN.md':'VOICEOVER-EN.md',source_manifest:plan.review?'edit-plan-review.json':'edit-plan.json'},null,2)+'\n');
console.log(`Saved ${resolve(out,name)}`);
