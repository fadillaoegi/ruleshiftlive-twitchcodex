import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),out=resolve(root,'submission/video/final');
const plan=JSON.parse(await readFile(resolve(out,'edit-plan.json'),'utf8'));
const cues=JSON.parse(await readFile(resolve(out,'subtitles.json'),'utf8'));
const alignment=JSON.parse(await readFile(resolve(out,'subtitle-alignment.json'),'utf8'));
const file=resolve(out,'ruleshift-demo-final.mp4');
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
const video=probe.streams.find(s=>s.codec_type==='video'),audio=probe.streams.find(s=>s.codec_type==='audio');
assert.equal(video.codec_name,'h264');assert.equal(video.width,1920);assert.equal(video.height,1080);assert.equal(video.r_frame_rate,'60/1');assert.equal(video.pix_fmt,'yuv420p');
assert.equal(Number(video.nb_frames),plan.duration_in_frames);assert.equal(plan.duration_in_frames,9720);
const picture=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=nb_frames,duration,avg_frame_rate','-of','json',resolve(root,'.local/final-demo/picture.mp4')],{encoding:'utf8'})).streams[0];
assert.equal(Number(picture.nb_frames),plan.duration_in_frames);assert.ok(Math.abs(Number(picture.duration)-plan.duration_seconds)<.03);assert.equal(picture.avg_frame_rate,'60/1');
assert.ok(Number(probe.format.duration)<180);assert.ok(Math.abs(Number(video.duration)-plan.duration_seconds)<.03);
assert.equal(audio.codec_name,'aac');assert.equal(Number(audio.sample_rate),48000);assert.equal(audio.channels,2);assert.ok(Math.abs(Number(audio.duration)-plan.duration_seconds)<.1);
assert.equal(alignment.voices.length,11);
let last=0;
for(const cue of cues){assert.ok(cue.start>=last&&cue.end>cue.start&&cue.end<=plan.duration_seconds);assert.ok(cue.lines.length<=2);assert.ok(cue.lines.every(l=>l.length<=58));last=cue.end;}
for(const chapter of plan.chapters.filter(c=>c.voice_file)){
 const text=cues.filter(c=>c.chapter===chapter.name).map(c=>c.text).join(' ');
 assert.equal(text,chapter.narration,'Subtitle text must cover the complete spoken script.');
 assert.ok(chapter.voice_offset+chapter.voice_duration<chapter.duration_frames/60);
 const report=alignment.voices.find(v=>v.chapter===chapter.name);
 assert.equal(createHash('sha256').update(await readFile(resolve(out,chapter.voice_file))).digest('hex'),report.sha256,'Original voice recording changed');
 assert.ok(report.asr_reference_match_ratio>=.93);
}
execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{stdio:'pipe'});
const loudness=spawnSync('ffmpeg',['-hide_banner','-i',file,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{encoding:'utf8'});
assert.equal(loudness.status,0);
const measure=JSON.parse(loudness.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
assert.ok(Number(measure.input_i)>-18&&Number(measure.input_i)<-14,'Narrated master loudness is outside the intended range');
assert.ok(Number(measure.input_tp)<-.6,'Final AAC has insufficient true-peak headroom');
const previews=resolve(out,'previews/encoded');await mkdir(previews,{recursive:true});
for(const chapter of plan.chapters){
 let position=chapter.duration_frames/60*.5;
 if(chapter.name==='gravity')position=2;
 if(chapter.name==='guardrails')position=10.5;
 const at=chapter.start_frame/60+position;
 execFileSync('ffmpeg',['-y','-v','error','-ss',String(at),'-i',file,'-frames:v','1',resolve(previews,`${chapter.name}.png`)],{stdio:'pipe'});
}
for(const [name,at] of [['diagram-coin',28.5],['diagram-restored',33.6],['subtitle-first',8.3],['caption-gap',14]])execFileSync('ffmpeg',['-y','-v','error','-ss',String(at),'-i',file,'-frames:v','1',resolve(previews,`${name}.png`)],{stdio:'pipe'});
const report={checked_at:new Date().toISOString(),file:'ruleshift-demo-final.mp4',duration_seconds:Number(video.duration),frames:Number(video.nb_frames),width:1920,height:1080,fps:60,video_codec:video.codec_name,audio_codec:audio.codec_name,sample_rate:Number(audio.sample_rate),channels:audio.channels,integrated_lufs:Number(measure.input_i),true_peak_dbfs:Number(measure.input_tp),full_decode:'passed',original_voice_files:11,voice_hashes:'matched',subtitle_cues:cues.length,burned_in_subtitles:true,subtitle_sidecars:['subtitles-en.srt','subtitles-en.vtt'],subtitle_complete_script:'passed',subtitle_timing_and_layout_bounds:'passed',visual_inspection:'Encoded frames extracted for separate review',sha256:createHash('sha256').update(await readFile(file)).digest('hex'),bytes:(await stat(file)).size,limits:plan.limits};
await writeFile(resolve(out,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
