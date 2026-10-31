import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const project=fileURLToPath(new URL('../',import.meta.url));
const out=fileURLToPath(new URL('../../demo/',import.meta.url));
const plan=JSON.parse(await readFile(resolve(project,'public/demo/edit-plan.json'),'utf8'));
const suffix=plan.review?'-review':'';
const name=`ruleshift-demo${suffix}.mp4`;
const file=resolve(out,name);
const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{encoding:'utf8'}));
const v=info.streams.find(s=>s.codec_type==='video');
const a=info.streams.find(s=>s.codec_type==='audio');
assert.equal(v.codec_name,'h264');assert.equal(v.width,1920);assert.equal(v.height,1080);
assert.equal(v.r_frame_rate,'60/1');assert.equal(v.pix_fmt,'yuv420p');
assert.equal(Number(v.nb_frames),plan.duration_in_frames);
assert.ok(Number(info.format.duration)<180);
assert.ok(Math.abs(Number(v.duration)-plan.duration_seconds)<.03);
assert.equal(a.codec_name,'aac');assert.equal(Number(a.sample_rate),48000);assert.equal(a.channels,2);
assert.ok(Math.abs(Number(a.duration)-plan.duration_seconds)<.1);
assert.equal(info.streams.some(s=>s.codec_type==='subtitle'),false);
execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{stdio:'pipe'});
const audio=spawnSync('ffmpeg',['-hide_banner','-i',file,'-vn','-af','volumedetect','-f','null','-'],{encoding:'utf8'});
assert.equal(audio.status,0);
const peak=Number(audio.stderr.match(/max_volume:\s*(-?[\d.]+) dB/)?.[1]);
assert.ok(Number.isFinite(peak)&&peak<0);
const frameDirectory=`previews/encoded${suffix}`;
await mkdir(resolve(out,frameDirectory),{recursive:true});
for(const c of plan.chapters) {
  const at=(c.start_frame+c.duration_frames*.58)/60;
  execFileSync('ffmpeg',['-y','-v','error','-ss',String(at),'-i',file,'-frames:v','1',resolve(out,`${frameDirectory}/${c.name}.png`)],{stdio:'pipe'});
}
const result={checked_at:new Date().toISOString(),evidence_kind:plan.review?'REVIEW_DEMO_MEDIA_QA':'REAL_TWITCH_DEMO_MEDIA_QA',file:name,duration_seconds:Number(v.duration),width:v.width,height:v.height,fps:60,frames:Number(v.nb_frames),video_codec:v.codec_name,audio_codec:a.codec_name,sample_rate:Number(a.sample_rate),channels:a.channels,audio_peak_dbfs:peak,full_decode:'passed',subtitles:false,embedded_voiceover:false,frame_directory:frameDirectory,visual_inspection:'Encoded frames extracted for separate inspection',limits:plan.limits};
await writeFile(resolve(out,`verification${suffix}.json`),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
