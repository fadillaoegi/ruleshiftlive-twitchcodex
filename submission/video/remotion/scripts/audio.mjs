// Original deterministic stereo sound design. No samples, downloads or AI calls.
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const SR=48000;
const TAU=Math.PI*2;
let seed=513721;
function noise(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;}
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};

function sound(duration,variant) {
  const n=Math.round(duration*SR);
  const l=new Float64Array(n),r=new Float64Array(n);
  function add(start,length,fn,pan=0,gain=1) {
    const first=Math.round(start*SR),count=Math.round(length*SR);
    const left=Math.sqrt((1-pan)/2),right=Math.sqrt((1+pan)/2);
    for(let j=0;j<count&&first+j<n;j++) {
      const t=j/SR;
      const value=fn(t,j,count)*gain;
      if(first+j>=0){l[first+j]+=value*left;r[first+j]+=value*right;}
    }
  }
  function pluck(at,freq,pan=0,gain=.16) {
    add(at,.8,t=>{
      const env=(1-Math.exp(-t*650))*Math.exp(-t*8.5);
      return env*(Math.sin(TAU*freq*t)+.22*Math.sin(TAU*freq*2.002*t)+.07*Math.sin(TAU*freq*4*t));
    },pan,gain);
  }
  function impact(at,gain=.52) {
    add(at,1.05,t=>{
      const phase=TAU*(40*t+(110/25)*(1-Math.exp(-25*t)));
      return Math.sin(phase)*Math.exp(-t*6)*(1-Math.exp(-t*900));
    },0,gain);
    add(at,.18,t=>noise()*Math.exp(-t*42)*Math.sin(Math.min(1,t/.004)*Math.PI/2),0,.055);
  }
  function sweep(at,length,up=true,gain=.08) {
    let last=0;
    add(at,length,(t)=>{
      const p=t/length;
      const env=Math.pow(Math.sin(Math.PI*p),2);
      last=last*.88+noise()*.12;
      const phase=TAU*((up?1500:3200)*t+(up?1900:-2400)*t*t/(2*length));
      return env*(last*.75+Math.sin(phase)*.12);
    },up?-.25:.25,gain);
  }
  // Low C-minor/add-nine atmosphere with gently detuned stereo oscillators.
  const padStart=variant==='intro'?.12:.02;
  for(const [i,f] of [130.8128,155.5635,195.9977,293.6648].entries()) {
    add(padStart,duration-padStart,t=>{
      const env=smooth(t/.9)*smooth((duration-padStart-t)/1.05);
      const breath=.8+.2*Math.sin(TAU*.19*t+i);
      return env*breath*(Math.sin(TAU*f*t)+.3*Math.sin(TAU*f*1.003*t)+.1*Math.sin(TAU*f*2*t));
    },i%2?-.55:.55,.042);
  }
  if(variant==='intro') {
    impact(.2,.3);
    sweep(.15,1.65,true,.2);
    pluck(42/60,523.251,-.45,.21);
    pluck(76/60,622.254,.15,.23);
    pluck(112/60,783.991,.5,.26);
    impact(112/60,.6);
    sweep(112/60,.72,false,.29);
    sweep(1.45,.42,true,.22);
    for(let i=0;i<8;i++) {
      const at=2.45+i*.36;
      const f=[261.6256,391.9954,466.1638,587.3295][i%4];
      pluck(at,f,i%2?.35:-.35,.085);
    }
    impact(3.48,.25);
    pluck(3.52,1046.502,0,.09);
    sweep(5.85,.5,true,.1);
  } else {
    sweep(.02,.82,true,.18);
    impact(.9,.5);
    [783.991,622.254,523.251,391.9954].forEach((f,i)=>pluck(.3+i*.22,f,.5-i*.3,.13));
    [261.6256,311.127,391.9954,587.3295].forEach((f,i)=>pluck(1.95+i*.055,f,(i-1.5)*.25,.13));
    impact(2.05,.26);
    sweep(1.65,.6,false,.11);
    pluck(3.0,523.251,-.25,.065);
  }
  // Sparse stereo echoes; the dry attacks stay synchronized to the motion.
  const dryL=l.slice(),dryR=r.slice();
  for(const [delay,gain,cross] of [[.087,.18,true],[.19,.13,false],[.31,.09,true],[.47,.055,false],[.69,.03,true]]) {
    const d=Math.round(delay*SR);
    for(let j=d;j<n;j++){l[j]+=(cross?dryR[j-d]:dryL[j-d])*gain;r[j]+=(cross?dryL[j-d]:dryR[j-d])*gain;}
  }
  let peak=0;
  for(let j=0;j<n;j++) {
    const envelope=smooth(j/(SR*.025))*smooth((n-1-j)/(SR*.45));
    l[j]=Math.tanh(l[j]*1.1)*envelope;r[j]=Math.tanh(r[j]*1.1)*envelope;
    peak=Math.max(peak,Math.abs(l[j]),Math.abs(r[j]));
  }
  const gain=Math.pow(10,-2.3/20)/Math.max(peak,.001);
  const buffer=Buffer.alloc(44+n*4);
  buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);
  buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(2,22);
  buffer.writeUInt32LE(SR,24);buffer.writeUInt32LE(SR*4,28);buffer.writeUInt16LE(4,32);buffer.writeUInt16LE(16,34);
  buffer.write('data',36);buffer.writeUInt32LE(n*4,40);
  let square=0;
  for(let j=0;j<n;j++) {
    const a=l[j]*gain,b=r[j]*gain;
    square+=(a*a+b*b)/2;
    buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,a))*32767),44+j*4);
    buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,b))*32767),46+j*4);
  }
  return {buffer,stats:{duration_seconds:duration,sample_rate:SR,channels:2,peak_dbfs:-2.3,rms_dbfs:20*Math.log10(Math.sqrt(square/n))}};
}

const publicDir=new URL('../public/',import.meta.url);
const outputDir=new URL('../../',import.meta.url);
await mkdir(publicDir,{recursive:true});
await mkdir(new URL('audio/',outputDir),{recursive:true});
const info={};
for(const [variant,duration] of [['intro',6.5],['closing',5.5]]) {
  const {buffer,stats}=sound(duration,variant);
  await writeFile(new URL(`${variant}-sound.wav`,publicDir),buffer);
  await writeFile(new URL(`audio/ruleshift-${variant}-sound.wav`,outputDir),buffer);
  info[variant]=stats;
}
await writeFile(new URL('audio/audio-info.json',outputDir),JSON.stringify({source:'Original procedural synthesis; no third-party recordings or music',...info},null,2)+'\n');
console.log('Generated original stereo soundtracks:',JSON.stringify(info));
