import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia, renderStill} from '@remotion/renderer';
import {access, copyFile, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const project=fileURLToPath(new URL('../',import.meta.url));
const output=fileURLToPath(new URL('../../',import.meta.url));
const browserExecutable=process.env.CHROME_PATH??(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
const chromiumOptions={gl:'angle'};
const stillOnly=process.argv.includes('--stills');
const quick=process.argv.includes('--quick');
await mkdir(resolve(output,'previews'),{recursive:true});
await mkdir(resolve(project,'public'),{recursive:true});
await copyFile(new URL('../../../../web/public/favicon.svg',import.meta.url),resolve(project,'public/logo.svg'));
for(const variant of ['intro','closing']) await access(resolve(project,`public/${variant}-sound.wav`));

console.log('Bundling the Remotion 3D compositions…');
const serveUrl=await bundle({entryPoint:resolve(project,'src/index.tsx'),publicDir:resolve(project,'public'),onProgress:()=>{}});
const options={serveUrl,browserExecutable,chromiumOptions,logLevel:'error',timeoutInMilliseconds:120000,onBrowserLog:log=>{if(log.type==='error'||log.type==='warn')console.log('Browser:',log.text);}};
const compositions=await getCompositions(serveUrl,{browserExecutable,chromiumOptions,logLevel:'error',timeoutInMilliseconds:120000});
const jobs=[{id:'RuleShiftIntro',name:'intro',stills:[30,92,150,260,352]},{id:'RuleShiftClosing',name:'closing',stills:[30,110,210,295]}];
const renders=[];
for(const job of jobs) {
  if(quick&&job.name!=='intro')continue;
  const composition=compositions.find(c=>c.id===job.id);
  if(!composition)throw new Error(`Missing composition: ${job.id}`);
  for(const frame of quick?[260]:job.stills) {
    await renderStill({...options,composition,frame,output:resolve(output,`previews/${job.name}-${String(frame).padStart(3,'0')}.png`),imageFormat:'png',overwrite:true});
    console.log(`${job.name}: preview frame ${frame}`);
  }
  if(stillOnly)continue;
  let last=-1;
  const outputLocation=resolve(output,`ruleshift-${job.name}.mp4`);
  await renderMedia({...options,composition,codec:'h264',audioCodec:'aac',audioBitrate:'256k',pixelFormat:'yuv420p',colorSpace:'bt709',crf:17,x264Preset:'medium',concurrency:2,overwrite:true,outputLocation,onProgress:({progress})=>{
    const step=Math.floor(progress*10);
    if(step!==last){last=step;console.log(`${job.name}: ${Math.min(100,step*10)}%`);}
  }});
  renders.push({file:`ruleshift-${job.name}.mp4`,composition:job.id,width:composition.width,height:composition.height,fps:composition.fps,frames:composition.durationInFrames,duration_seconds:composition.durationInFrames/composition.fps});
  console.log(`Saved ${outputLocation}`);
}
if(!stillOnly)await writeFile(resolve(output,'render-info.json'),JSON.stringify({rendered_at:new Date().toISOString(),renderer:'Remotion 4.0.539 + React Three Fiber + Three.js',evidence_kind:'BRAND_ANIMATION',source:'Original deterministic procedural 3D scene and synthesized stereo audio; not Twitch gameplay evidence',renders},null,2)+'\n');
