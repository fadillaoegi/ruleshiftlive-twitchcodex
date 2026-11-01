// Render code-native brand artwork using the real logo, sprite and gameplay.
import {bundle} from '@remotion/bundler';
import {getCompositions,renderStill,openBrowser} from '@remotion/renderer';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const project=fileURLToPath(new URL('../',import.meta.url)),root=resolve(project,'../../../');
const out=resolve(root,'submission/design');await mkdir(resolve(out,'masters'),{recursive:true});await mkdir(resolve(out,'previews'),{recursive:true});
const browserExecutable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',chromiumOptions={gl:'angle'};
const serveUrl=await bundle({entryPoint:resolve(project,'src/design-index.tsx'),publicDir:resolve(project,'public')});
const compositions=await getCompositions(serveUrl,{browserExecutable,chromiumOptions,logLevel:'error'});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions,logLevel:'error'});
const jobs=[{id:'BrandLogo',file:'logo.png',scale:1},{id:'YoutubeThumbnail',file:'youtube-thumbnail.png',scale:2},{id:'DevpostCover',file:'devpost-cover.png',scale:1},{id:'Poster',file:'poster-a3.png',scale:3508/1400}];
const run=args=>execFileSync('ffmpeg',['-y','-v','error',...args],{stdio:'pipe'});
const results=[];
try{
 for(const job of jobs){
  const composition=compositions.find(c=>c.id===job.id);const target=resolve(out,'masters',job.file);
  await renderStill({serveUrl,browserExecutable,chromiumOptions,puppeteerInstance:browser,composition,frame:0,scale:job.scale,output:target,imageFormat:'png',overwrite:true,logLevel:'error'});
  run(['-i',target,'-vf','scale=960:-1','-frames:v','1',resolve(out,'previews',job.file)]);
  results.push({file:'masters/'+job.file,width:Math.round(composition.width*job.scale),height:Math.round(composition.height*job.scale)});console.log('Rendered '+job.id);
 }
}finally{await browser.close({silent:true});}
for(const [source,name,extra] of [['youtube-thumbnail.png','youtube-thumbnail.jpg',[]],['youtube-thumbnail.png','youtube-thumbnail-1280.jpg',['-vf','scale=1280:720']],['devpost-cover.png','devpost-cover.jpg',[]],['poster-a3.png','poster-a3.jpg',[]]]){
 const file=resolve(out,name);run(['-i',resolve(out,'masters',source),...extra,'-frames:v','1','-q:v','2',file]);
 if(name.startsWith('youtube')&&(await stat(file)).size>=2000000)run(['-i',resolve(out,'masters',source),...extra,'-frames:v','1','-q:v','5',file]);
 if(name==='devpost-cover.jpg'&&(await stat(file)).size>=5000000)throw new Error('Devpost image exceeds its size limit');
 if(name.startsWith('youtube')&&(await stat(file)).size>=2000000)throw new Error('YouTube portable export exceeds 2 MB');
}
await writeFile(resolve(out,'render-info.json'),JSON.stringify({created_at:new Date().toISOString(),renderer:'Remotion code-native artwork; real RuleShift logo, original pixel sprite and actual gameplay capture',masters:results,youtube_ratio:'16:9',devpost_ratio:'3:2',poster_format:'A3 portrait at approximately 300 dpi',reference_video:'https://youtu.be/AvWHm6U2jUs',generated_gameplay:false,paid_generation_calls:0},null,2)+'\n');
console.log('Poster and platform-ready thumbnail exports saved.');
