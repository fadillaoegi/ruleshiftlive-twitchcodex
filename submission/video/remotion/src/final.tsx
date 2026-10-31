import React from 'react';
import {AbsoluteFill,Img,staticFile,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import evidence from '../public/demo/source-evidence.json';

export type FinalChapter={name:string;title:string;source:string;info:string[];start_frame:number;duration_frames:number};
export type Cue={text:string;lines?:string[]};
const CYAN='#55eee8',PINK='#ff55c8',INK='#070d17',WHITE='#eef6ff';
const MONO='"SFMono-Regular",Consolas,"Liberation Mono",monospace';
const SANS='Arial,Helvetica,sans-serif';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const p=clamp(n);return p*p*(3-2*p);};

const Base:React.FC<{children?:React.ReactNode}>=({children})=><AbsoluteFill style={{background:INK,color:WHITE,fontFamily:SANS}}>
 <AbsoluteFill style={{background:'radial-gradient(ellipse at 15% 10%,#0f2636 0%,transparent 55%),radial-gradient(ellipse at 98% 95%,#221029 0%,transparent 42%)'}}/>
 <AbsoluteFill style={{backgroundImage:'linear-gradient(#5bece807 1px,transparent 1px),linear-gradient(90deg,#5bece807 1px,transparent 1px)',backgroundSize:'68px 68px',opacity:.4}}/>
 {children}
</AbsoluteFill>;

const Header:React.FC<{chapter:FinalChapter}>=({chapter})=><>
 <div style={{position:'absolute',left:64,top:30,display:'flex',gap:18,alignItems:'center'}}><Img src={staticFile('logo.svg')} style={{width:42,height:42}}/><span style={{fontFamily:MONO,fontSize:23,letterSpacing:3,fontWeight:700}}>RULESHIFT <span style={{color:PINK}}>LIVE</span></span></div>
 <div style={{position:'absolute',right:64,top:44,color:chapter.source.includes('rehearsal')?PINK:CYAN,fontSize:16,fontFamily:MONO,maxWidth:1000,textAlign:'right'}}>{chapter.source}</div>
 <div style={{position:'absolute',left:64,right:64,top:93,height:1,background:'#385067'}}/>
 <div style={{position:'absolute',left:64,top:117,fontSize:39,fontWeight:800,letterSpacing:-1}}>{chapter.title}</div>
</>;

export const FinalPlate:React.FC<{chapter:FinalChapter}>=({chapter})=>{
 const active=['broadcast','overview','twitch'].includes(chapter.name)?0:chapter.name==='approval'?1:['gravity','play','deadline'].includes(chapter.name)?2:3;
 return <Base><Header chapter={chapter}/>
  <div style={{position:'absolute',left:64,top:190,width:1380,height:710,border:'1px solid #324b63',background:'#060b13',boxShadow:'0 24px 70px #0009',borderRadius:12}}/>
  <div style={{position:'absolute',left:1472,top:190,width:384,height:710,padding:'30px 27px',border:'1px solid #3d435d',borderTop:`3px solid ${chapter.name==='guardrails'?PINK:CYAN}`,background:'linear-gradient(150deg,#142033,#0b1322)',borderRadius:12,boxShadow:'0 25px 70px #0008',display:'flex',flexDirection:'column'}}>
   <div style={{fontFamily:MONO,fontSize:13,color:CYAN,letterSpacing:2,lineHeight:1.5}}>{chapter.info[0]}</div>
   <div style={{fontSize:37,lineHeight:1.12,fontWeight:800,letterSpacing:-1,marginTop:24}}>{chapter.info[1]}</div>
   <div style={{height:1,background:'#3a4a63',margin:'30px 0 25px'}}/>
   {chapter.info.slice(2).map((line,i)=><div key={line} style={{display:'flex',gap:14,marginBottom:27,alignItems:'flex-start'}}><div style={{fontFamily:MONO,fontSize:14,color:PINK,paddingTop:4}}>0{i+1}</div><div style={{fontSize:23,lineHeight:1.35,color:'#d1dfed'}}>{line}</div></div>)}
   <div style={{marginTop:'auto',paddingTop:23,borderTop:'1px solid #33465a',fontFamily:MONO,fontSize:12,lineHeight:1.7,color:'#91a9c0'}}>{chapter.name==='broadcast'?'Public broadcast excerpt. Separate controller close-ups follow.':chapter.name==='guardrails'?'This test runs in local rehearsal.':chapter.name==='approval'||chapter.name==='twitch'?'Proposal approved before recording.':chapter.name==='result'?'Verified round: real Twitch source.':'One arena. One streamer. One rule.'}</div>
  </div>
  <div style={{position:'absolute',left:66,top:917,display:'flex',gap:18,alignItems:'center',fontFamily:MONO,fontSize:14,letterSpacing:1}}>{['CHAT','REVIEW','PLAY','SAVE'].map((s,i)=><React.Fragment key={s}><span style={{color:i===active?CYAN:'#5f7890',fontWeight:i===active?800:400}}>{s}</span>{i<3&&<span style={{color:'#3d5268'}}>→</span>}</React.Fragment>)}</div>
  <div style={{position:'absolute',left:64,right:64,bottom:18,height:2,background:'#182b3c'}}><div style={{height:2,width:`${100*(chapter.start_frame+chapter.duration_frames/2)/9720}%`,background:CYAN}}/></div>
 </Base>;
};

export const FinalSource:React.FC<{chapter:FinalChapter}>=({chapter})=><AbsoluteFill>
 <FinalPlate chapter={chapter}/>
 <div style={{position:'absolute',left:91,top:218,width:1325,height:655,overflow:'hidden',fontFamily:MONO}}>
  <div style={{fontSize:21,color:'#9eb5cc',paddingBottom:21,borderBottom:'1px solid #243c50'}}>web/src/game/engine.ts · actual project source</div>
  <div style={{fontSize:21,lineHeight:1.7,marginTop:24,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{evidence.snippet.trim().split('\n').slice(0,14).map((line,i)=><div key={i} style={{color:line.includes('gravityTo')||line.includes('effectUntil')?CYAN:line.includes('//')?'#8098af':'#dce8f4',background:line.includes('gravityTo')||line.includes('effectUntil')?'#55eee80b':'transparent'}}>{line}</div>)}</div>
  <div style={{display:'flex',gap:12,position:'absolute',left:0,bottom:4}}>{['Go race checks','PostgreSQL integration','Web tests + build'].map(s=><span key={s} style={{fontSize:16,padding:'13px 17px',background:'#102534',border:'1px solid #285463',color:CYAN}}>✓ {s}</span>)}</div>
 </div>
</AbsoluteFill>;

export const SubtitleCard:React.FC<{cue:Cue}>=({cue})=><AbsoluteFill style={{background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:SANS}}>
 <div style={{maxWidth:1690,padding:'11px 28px 13px',background:'#060b14ed',border:'1px solid #33495e',borderRadius:10,boxShadow:'0 4px 18px #000a',textAlign:'center',color:WHITE,fontSize:34,lineHeight:1.2,fontWeight:600,textShadow:'0 2px 3px #000'}}>{(cue.lines??[cue.text]).map((line,i)=><div key={i}>{line}</div>)}</div>
</AbsoluteFill>;

function DiagramCoin({index,frame}:{index:number;frame:number}){
 const collectAt=[30,54,78][index],p=ease((frame-collectAt)/20);
 return <group position={[(index-1)*2.1,1.1+p*1.5,0]} scale={1-p*.92} rotation={[.1,frame/45+index*.7,.05]} visible={p<1}>
  <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.55,.55,.14,40]}/><meshStandardMaterial color="#ffcf63" metalness={.8} roughness={.24}/></mesh>
  {[-1,1].map(side=><group key={side} position={[0,0,side*.078]}>
   <mesh><torusGeometry args={[.43,.025,8,48]}/><meshStandardMaterial color="#fff0ad" emissive="#eaba3d" emissiveIntensity={.18}/></mesh>
   {[-.12,.12].map(x=><mesh key={x} position={[x,0,side*.02]}><boxGeometry args={[.1,.48,.035]}/><meshStandardMaterial color="#fff2bd"/></mesh>)}
  </group>)}
 </group>;
}
export const RuleDiagram:React.FC=()=>{
 const f=useCurrentFrame(),reversed=f>=90&&f<330;
 const rise=ease((f-90)/48),fall=ease((f-330)/45);
 const y=f<330?-1.85+rise*3.75:1.9-fall*3.75;
 const collected=[30,54,78].filter(at=>f>=at).length;
 const remaining=Math.max(0,4-(f-90)/60);
 return <Base>
  <div style={{position:'absolute',left:64,top:34,fontFamily:MONO,fontSize:15,color:CYAN,letterSpacing:2}}>RULESHIFT LIVE / RULE EXPLAINER</div>
  <div style={{position:'absolute',right:64,top:34,fontSize:15,color:'#9cb2c6'}}>Animated illustration · not gameplay footage</div>
  <div style={{position:'absolute',left:64,top:104,fontSize:58,fontWeight:800,letterSpacing:-2}}>One rule. <span style={{color:PINK}}>A different direction.</span></div>
  <ThreeCanvas width={1920} height={1080} style={{position:'absolute',left:0,top:-10,width:1920,height:920}} camera={{position:[0,.7,10.8],fov:42}} gl={{alpha:true,antialias:true}}>
   <ambientLight intensity={1.1}/><directionalLight position={[4,6,9]} intensity={3.5} color="#c9faff"/><pointLight position={[-4,2,3]} intensity={32} color={PINK}/>
   <group rotation={[.03,-.13,0]}>
    {[-2.3,2.35].map((h,i)=><group key={h} position={[0,h,-.5]}><mesh><boxGeometry args={[11,.11,2.6]}/><meshStandardMaterial color="#142639" metalness={.5} roughness={.4}/></mesh><mesh position={[0,.07,.85]}><boxGeometry args={[11,.035,.04]}/><meshBasicMaterial color={i?PINK:CYAN}/></mesh></group>)}
    {[0,1,2].map(i=><DiagramCoin key={i} index={i} frame={f}/>)}
    <group position={[0,y,.5]} rotation={[0,f/120,reversed?Math.PI:0]}><mesh><boxGeometry args={[.57,.57,.57]}/><meshStandardMaterial color={reversed?PINK:CYAN} emissive={reversed?PINK:CYAN} emissiveIntensity={.3} metalness={.5} roughness={.23}/></mesh><mesh position={[-.12,.07,.295]}><boxGeometry args={[.09,.12,.025]}/><meshBasicMaterial color="#071321"/></mesh><mesh position={[.12,.07,.295]}><boxGeometry args={[.09,.12,.025]}/><meshBasicMaterial color="#071321"/></mesh></group>
    <group position={[4,0,.4]} rotation={[0,0,reversed?0:Math.PI]}><mesh><cylinderGeometry args={[.06,.06,1.1,16]}/><meshBasicMaterial color={reversed?PINK:CYAN}/></mesh><mesh position={[0,.75,0]}><coneGeometry args={[.22,.43,24]}/><meshBasicMaterial color={reversed?PINK:CYAN}/></mesh></group>
   </group>
  </ThreeCanvas>
  <div style={{position:'absolute',left:96,top:250,width:355,padding:30,border:'1px solid #39506a',background:'#0c1728dd',borderRadius:14,transform:'perspective(900px) rotateY(8deg)',boxShadow:'-10px 14px 0 #101b2e'}}><div style={{fontFamily:MONO,fontSize:16,color:'#93a9bf'}}>TRIGGER</div><div style={{fontSize:84,fontWeight:800,color:'#ffdb78',marginTop:10}}>{collected}<span style={{fontSize:30,color:'#7f97af'}}> / 3</span></div><div style={{fontSize:25,marginTop:14}}>Collect three coins</div></div>
  <div style={{position:'absolute',right:96,top:250,width:355,padding:30,border:`1px solid ${reversed?'#bd409b':'#39506a'}`,background:'#101426ed',borderRadius:14,transform:'perspective(900px) rotateY(-8deg)',boxShadow:'10px 14px 0 #201329'}}><div style={{fontFamily:MONO,fontSize:16,color:'#93a9bf'}}>EFFECT</div><div style={{fontSize:76,fontWeight:800,color:reversed?PINK:CYAN,marginTop:10}}>{reversed?remaining.toFixed(1)+'s':f>=330?'↓':'4s'}</div><div style={{fontSize:25,marginTop:14}}>{reversed?'Gravity reversed':f>=330?'Normal gravity restored':'Reverse for 4 seconds'}</div></div>
  <div style={{position:'absolute',left:150,right:150,bottom:98,padding:'24px 40px',borderTop:'1px solid #35506a',display:'flex',justifyContent:'space-between',fontSize:23,color:'#c8d8e8'}}><span style={{color:collected===3?'#ffdc78':CYAN}}>01 · THIRD COIN</span><span>→</span><span style={{color:reversed?PINK:'#9bb1c7'}}>02 · REVERSE GRAVITY</span><span>→</span><span style={{color:f>=330?CYAN:'#9bb1c7'}}>03 · AUTOMATIC RETURN</span></div>
 </Base>;
};
