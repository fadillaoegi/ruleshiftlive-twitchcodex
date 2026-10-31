import {readFile,writeFile,rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const project=fileURLToPath(new URL('../',import.meta.url));
const out=fileURLToPath(new URL('../../demo/',import.meta.url));
const work=resolve(project,'../../../.local/video-demo-edit');
const plan=JSON.parse(await readFile(resolve(project,'public/demo/edit-plan.json'),'utf8'));
const run=args=>execFileSync('ffmpeg',['-y','-v','error',...args],{stdio:'pipe'});
const entry=(p,d)=>`file '${p.replaceAll("'","'\\''")}'\nduration ${d}`;
const parts=[];
for(const c of plan.chapters) {
  const target=resolve(work,`${c.name}-video.mp4`);
  if(c.kind==='archive') {
    const archive=[];
    for(const [i,length] of [[0,5],[1,6],[2,8]]) {
      const p=resolve(work,`archive-${i}-video.mp4`);
      run(['-i',resolve(work,`archive-${i}.mp4`),'-an','-c:v','copy','-video_track_timescale','90000',p]);
      archive.push(entry(p,length));
    }
    const list=resolve(work,'archive-video-parts.txt');await writeFile(list,archive.join('\n')+'\n');
    run(['-f','concat','-safe','0','-i',list,'-an','-c:v','copy','-video_track_timescale','90000',target]);
  } else run(['-i',resolve(work,`${c.name}.mp4`),'-an','-c:v','copy','-video_track_timescale','90000',target]);
  const info=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=nb_frames','-of','json',target],{encoding:'utf8'}));
  const frames=Number(info.streams[0].nb_frames);
  if(frames!==c.duration_frames) {
    const repaired=resolve(work,`${c.name}-exact.mp4`);
    // Hold only the last captured frame if an encoder tail is shorter than the
    // editorial slot. Never accelerate capture or advance application state.
    run(['-i',target,'-an','-vf',`tpad=stop_mode=clone:stop_duration=${c.duration_frames/60}`,'-frames:v',String(c.duration_frames),'-c:v','libx264','-crf','18','-preset','fast','-threads','4','-pix_fmt','yuv420p','-r','60','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-video_track_timescale','90000',repaired]);
    await rename(repaired,target);
  }
  parts.push(entry(target,c.duration_frames/60));
}
const list=resolve(work,'all-video-parts.txt');await writeFile(list,parts.join('\n')+'\n');
const closing=plan.chapters.find(c=>c.name==='closing');
const name=plan.review?'ruleshift-demo-review.mp4':'ruleshift-demo.mp4';
const length=String(plan.duration_seconds);
run(['-f','concat','-safe','0','-i',list,'-i',resolve(project,'public/demo/intro.mp4'),'-i',resolve(project,'public/demo/closing.mp4'),'-filter_complex',`[1:a]apad=whole_dur=${length}[intro];[2:a]adelay=${Math.round(closing.start_frame/60*1000)}:all=1,apad=whole_dur=${length}[closing];[intro][closing]amix=inputs=2:normalize=0:duration=longest[a]`,'-map','0:v','-map','[a]','-t',length,'-c:v','copy','-c:a','aac','-ar','48000','-ac','2','-b:a','256k','-movflags','+faststart',resolve(out,name)]);
console.log(`Assembled ${name} with exact chapter boundaries and continuous audio timeline`);
