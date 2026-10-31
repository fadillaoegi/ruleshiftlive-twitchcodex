// Original music plus the user's eleven existing voice recordings. No paid API.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const out=resolve(root,'submission/video/final/audio'),work=resolve(root,'.local/final-demo');
await mkdir(out,{recursive:true});await mkdir(resolve(work,'asr'),{recursive:true});
const plan=JSON.parse(await readFile(resolve(out,'../edit-plan.json'),'utf8'));
const SR=48000,TAU=2*Math.PI,duration=plan.duration_seconds,n=Math.round(duration*SR);
const left=new Float32Array(n),right=new Float32Array(n);let seed=20261031;
const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const hz=m=>440*Math.pow(2,(m-69)/12);
function add(at,length,gain,pan,fn){const first=Math.round(at*SR),count=Math.round(length*SR);const l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2);for(let j=0;j<count&&first+j<n;j++){if(first+j<0)continue;const v=fn(j/SR,j/count)*gain;left[first+j]+=v*l;right[first+j]+=v*r;}}
function pluck(at,m,gain=.07,pan=0){const f=hz(m);add(at,1.5,gain,pan,t=>(1-Math.exp(-t*550))*Math.exp(-t*5.2)*(Math.sin(TAU*f*t)+.2*Math.sin(TAU*f*2.001*t)));}
const beat=60/96,bar=beat*4;
const chords=[[48,55,58,62],[44,51,55,60],[51,58,62,67],[46,53,60,65]];
for(let at=0,i=0;at<duration;at+=bar*2,i++){
 const chord=chords[i%chords.length];
 for(const [j,m] of chord.entries()){const f=hz(m);add(at,bar*2+1.8,.018,j%2?.6:-.6,(t,p)=>smooth(t/1.4)*smooth((bar*2+1.8-t)/1.5)*(.82+.18*Math.sin(TAU*.17*t+j))*(Math.sin(TAU*f*t)+.25*Math.sin(TAU*f*1.003*t)));}
 for(let k=0;k<8;k++)pluck(at+k*beat,chord[[0,2,1,3,2,1,3,2][k]]+12,.028,k%2?.5:-.5);
 const bass=hz(chord[0]-12);add(at,bar*2,.028,0,t=>smooth(t/.025)*smooth((bar*2-t)/.3)*Math.sin(TAU*bass*t));
}
for(let at=6.5,i=0;at<duration-5.5;at+=beat,i++){
 if(i%2===0)add(at,.23,.09,0,t=>Math.sin(TAU*(42*t+3.8*(1-Math.exp(-26*t))))*Math.exp(-t*18)*smooth(t/.004));
 if(i%4===2)add(at,.12,.027,.1,t=>noise()*Math.exp(-t*35)*smooth(t/.004));
 add(at+beat/2,.055,.008,i%2?.6:-.6,t=>noise()*Math.exp(-t*95)*smooth(t/.002));
}
const diagram=plan.chapters.find(c=>c.name==='explainer').start_frame/60;
[.5,.9,1.3].forEach((t,i)=>pluck(diagram+t,[72,75,79][i],.12,(i-1)*.4));
for(const at of [diagram+1.5,diagram+5.5])add(at,.5,.025,0,(t,p)=>Math.sin(TAU*(330*t+250*t*t))*Math.sin(Math.PI*p)**2);
let peak=0,square=0;for(let i=0;i<n;i++){const env=smooth(i/(SR*1.5))*smooth((n-1-i)/(SR*2));left[i]*=env;right[i]*=env;peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));square+=(left[i]**2+right[i]**2)/2;}
const gain=Math.pow(10,-25/20)/Math.sqrt(square/n);const wav=Buffer.alloc(44+n*4);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(SR,24);wav.writeUInt32LE(SR*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*4,40);
for(let i=0;i<n;i++){wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,left[i]*gain))*32767),44+i*4);wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,right[i]*gain))*32767),46+i*4);}
await writeFile(resolve(out,'ruleshift-neon-bed.wav'),wav);
console.log('Original 96 BPM C-minor neon soundtrack prepared.');
const voices=plan.chapters.filter(c=>c.voice_file);const inputs=[],filters=[];
for(const [i,c] of voices.entries()){
 const source=resolve(out,'..',c.voice_file),normalized=resolve(work,`voice-${i+1}.wav`);
 execFileSync('ffmpeg',['-y','-v','error','-i',source,'-af','highpass=f=75,loudnorm=I=-16:TP=-3:LRA=7','-ar','48000','-ac','2','-c:a','pcm_s16le',normalized]);
 execFileSync('ffmpeg',['-y','-v','error','-i',source,'-ar','16000','-ac','1','-c:a','pcm_s16le',resolve(work,`asr/voice-${i+1}.wav`)]);
 inputs.push('-i',normalized);filters.push(`[${i}:a]adelay=${Math.round((c.start_frame/60+c.voice_offset)*1000)}:all=1,apad=whole_dur=${duration}[v${i}]`);
}
filters.push(voices.map((_,i)=>`[v${i}]`).join('')+`amix=inputs=${voices.length}:normalize=0:duration=longest,asplit=3[voice][sidechain][savevoice]`);
const m=voices.length;inputs.push('-i',resolve(out,'ruleshift-neon-bed.wav'),'-i',resolve(root,'submission/video/audio/ruleshift-intro-sound.wav'),'-i',resolve(root,'submission/video/audio/ruleshift-closing-sound.wav'));
filters.push(`[${m}:a][sidechain]sidechaincompress=threshold=0.015:ratio=6:attack=12:release=350:makeup=1[ducked]`);
filters.push(`[${m+1}:a]volume=0.6,apad=whole_dur=${duration}[opening]`);
const close=plan.chapters.find(c=>c.name==='closing').start_frame/60;
filters.push(`[${m+2}:a]volume=0.6,adelay=${Math.round(close*1000)}:all=1,apad=whole_dur=${duration}[closing]`);
filters.push('[voice][ducked][opening][closing]amix=inputs=4:normalize=0:duration=longest,alimiter=limit=0.94:level=false[mixed]');
await writeFile(resolve(work,'mix-filter.txt'),filters.join(';\n'));
execFileSync('ffmpeg',['-y','-v','error',...inputs,'-filter_complex',filters.join(';'),'-map','[mixed]','-t',String(duration),'-ar','48000','-ac','2','-c:a','pcm_s24le',resolve(work,'unmastered.wav'),'-map','[savevoice]','-t',String(duration),'-ar','48000','-ac','2','-c:a','pcm_s16le',resolve(out,'voiceover-track.wav')]);
const analysis=spawnSync('ffmpeg',['-hide_banner','-i',resolve(work,'unmastered.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{encoding:'utf8'});
if(analysis.status!==0)throw new Error('Mix loudness measurement failed');
const stats=JSON.parse(analysis.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
const norm=`loudnorm=I=-16:TP=-1.5:LRA=9:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`;
execFileSync('ffmpeg',['-y','-v','error','-i',resolve(work,'unmastered.wav'),'-af',norm,'-ar','48000','-ac','2','-c:a','pcm_s24le',resolve(out,'final-mix.wav')]);
await writeFile(resolve(out,'audio-info.json'),JSON.stringify({source:'User-supplied narration plus original deterministic procedural music and original branding sound',duration_seconds:duration,sample_rate:48000,channels:2,bpm:96,voice_files:voices.length,music_ducking:'Speech-controlled sidechain, ratio 6:1, attack 12 ms, release 350 ms',master_target_lufs:-16,true_peak_target_dbfs:-1.5,normalization_measurement:stats,paid_api_calls:0},null,2)+'\n');
console.log('Eleven user voice clips normalized and mixed with narration-ducked original music.');
