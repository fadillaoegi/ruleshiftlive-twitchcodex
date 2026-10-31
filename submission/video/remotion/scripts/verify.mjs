import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('../../',import.meta.url));
const results=[];
for(const [name,frames] of [['intro',390],['closing',330]]) {
  const file=resolve(root,`ruleshift-${name}.mp4`);
  const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_frames,sample_rate,channels,duration,color_space','-of','json',file],{encoding:'utf8'}));
  const v=info.streams.find(s=>s.codec_type==='video');
  const a=info.streams.find(s=>s.codec_type==='audio');
  assert.equal(v.codec_name,'h264');assert.equal(v.width,1920);assert.equal(v.height,1080);
  assert.equal(v.r_frame_rate,'60/1');assert.equal(v.pix_fmt,'yuv420p');assert.equal(Number(v.nb_frames),frames);
  assert.ok(Math.abs(Number(v.duration)-frames/60)<.02);
  assert.equal(a.codec_name,'aac');assert.equal(Number(a.sample_rate),48000);assert.equal(a.channels,2);
  assert.ok(Math.abs(Number(a.duration)-frames/60)<.08);
  execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{stdio:'pipe'});
  const audio=spawnSync('ffmpeg',['-hide_banner','-i',file,'-vn','-af','volumedetect','-f','null','-'],{encoding:'utf8'});
  assert.equal(audio.status,0);
  const peak=Number(audio.stderr.match(/max_volume:\s*(-?[\d.]+) dB/)?.[1]);
  const mean=Number(audio.stderr.match(/mean_volume:\s*(-?[\d.]+) dB/)?.[1]);
  assert.ok(Number.isFinite(peak)&&peak<0,'Encoded audio must retain peak headroom');
  assert.ok(Number.isFinite(mean)&&mean>-35,'Encoded audio must be present');
  const at=name==='intro'?260:210;
  execFileSync('ffmpeg',['-y','-v','error','-ss',String(at/60),'-i',file,'-frames:v','1',resolve(root,`previews/rendered-${name}.png`)],{stdio:'pipe'});
  if(name==='intro')execFileSync('ffmpeg',['-y','-v','error','-ss',String(92/60),'-i',file,'-frames:v','1',resolve(root,'previews/rendered-coin-sequence.png')],{stdio:'pipe'});
  results.push({file:`ruleshift-${name}.mp4`,status:'passed',width:v.width,height:v.height,fps:60,frames,duration_seconds:Number(v.duration),video_codec:v.codec_name,pixel_format:v.pix_fmt,color_space:v.color_space,audio_codec:a.codec_name,sample_rate:Number(a.sample_rate),channels:a.channels,audio_peak_dbfs:peak,audio_mean_dbfs:mean,bytes:(await stat(file)).size,full_decode:'passed'});
}
const report={checked_at:new Date().toISOString(),evidence_kind:'BRAND_ANIMATION_QA',source:'Actual ffprobe metadata, complete FFmpeg decode, encoded-audio level measurements and extracted final-video frames',typecheck:'passed',results,limits:['Visual QA is separate from media metadata validation.','These are brand animation clips, not the complete Twitch/Codex submission demo.']};
await writeFile(resolve(root,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
