import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import evidence from '../public/demo/source-evidence.json';

export type Chapter={name:string;kind:string;file:string;duration_frames:number;start_frame:number;title:string;source:string;narration:string};
export type EditPlan={review:boolean;duration_in_frames:number;chapters:Chapter[]};
const PINK='#ff55c8',CYAN='#55eee8',MONO='"SFMono-Regular",Consolas,"Liberation Mono",monospace';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const x=clamp(v);return x*x*(3-2*x);};

const Archive:React.FC=()=>{
  const f=useCurrentFrame();
  const phase=f<300?'chat':f<660?'proposal':'result';
  return <AbsoluteFill style={{background:'#080e1a',padding:'140px 105px 100px'}}>
    <div style={{height:'100%',minHeight:0,border:'1px solid #33435b',overflow:'hidden',background:'#0b101a',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}><Img src={staticFile(`demo/archive/${phase}.png`)} style={{width:phase==='chat'?'75%':'100%',height:'100%',objectFit:'contain'}}/></div>
  </AbsoluteFill>;
};

const ActualSource:React.FC=()=>{
  const f=useCurrentFrame();
  const lines=evidence.snippet.trim().split('\n').slice(0,18);
  return <AbsoluteFill style={{background:'#090f1a',padding:'142px 108px 100px',display:'flex',flexDirection:'row',gap:34}}>
    <div style={{flex:1,minWidth:0,border:'1px solid #304257',background:'#0b1320',overflow:'hidden',boxShadow:'0 22px 80px #0008'}}>
      <div style={{padding:'24px 30px',background:'#121d2c',borderBottom:'1px solid #304257',fontSize:21,color:'#9bb1c6'}}>web/src/game/engine.ts <span style={{float:'right',color:CYAN,fontSize:15}}>ACTUAL SOURCE</span></div>
      <div style={{padding:'25px 22px',fontSize:19,lineHeight:1.6,whiteSpace:'pre-wrap',overflowWrap:'anywhere',transform:`translateY(${-Math.max(0,f-260)*.04}px)`}}>
        {lines.map((line,i)=><div key={i} style={{background:line.includes('gravityTo(-1)')||line.includes('effectUntil =')?'#55eee813':'transparent',color:line.includes('//')?'#69849a':line.includes('gravityTo')?CYAN:'#d4e2ed'}}><span style={{display:'inline-block',width:52,textAlign:'right',paddingRight:24,color:'#456079'}}>{70+i}</span>{line}</div>)}
      </div>
    </div>
    <div style={{width:355,flexShrink:0,display:'flex',flexDirection:'column',justifyContent:'center',gap:18}}>
      <div style={{fontSize:14,letterSpacing:3,color:PINK,marginBottom:10}}>ACTUAL CHECK RESULTS</div>
      {evidence.checks.map(c=><div key={c.name} style={{border:'1px solid #284655',padding:'22px 19px',background:'#0d1b26'}}><div style={{fontSize:18,color:'#b9cbdc'}}>{c.name}</div><div style={{fontSize:17,color:CYAN,marginTop:9}}>✓ {c.status.toUpperCase()}{c.tests?` · ${c.tests} tests`:''}</div></div>)}
    </div>
  </AbsoluteFill>;
};

const ChapterView:React.FC<{chapter:Chapter;review:boolean;plateOnly?:boolean}> = ({chapter,review,plateOnly})=>{
  const f=useCurrentFrame();
  const edge=Math.min(ease(f/12),ease((chapter.duration_frames-1-f)/12));
  const isBrand=chapter.kind==='brand';
  if(isBrand)return <OffthreadVideo src={staticFile(chapter.file)} style={{width:1920,height:1080}}/>;
  const local=chapter.source.startsWith('Local rehearsal');
  return <AbsoluteFill style={{background:'#060a12',fontFamily:MONO,color:'#e9f2ff'}}>
    <AbsoluteFill style={{opacity:.82+.18*edge}}>
      {chapter.kind==='video'?<div style={{position:'absolute',left:64,top:108,width:1792,height:924,overflow:'hidden',border:'1px solid #26364c',borderRadius:5,boxShadow:'0 25px 100px #0009'}}>
        {!plateOnly&&<OffthreadVideo src={staticFile(chapter.file)} muted style={{width:'100%',height:'100%',objectFit:'contain'}}/>}
      </div>:chapter.kind==='archive'?<Archive/>:<ActualSource/>}
    </AbsoluteFill>
    <div style={{position:'absolute',left:0,right:0,top:0,height:91,background:'#090f1bf7',borderBottom:'1px solid #26384d',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 65px',boxShadow:'0 12px 36px #0004'}}>
      <div style={{display:'flex',alignItems:'center',gap:18}}><Img src={staticFile('logo.svg')} style={{width:31,height:31}}/><div style={{fontSize:18,fontWeight:700,letterSpacing:2.2}}>{chapter.title}</div></div>
      <div style={{fontSize:13,color:local?PINK:CYAN,letterSpacing:.5,textAlign:'right',maxWidth:610}}>{chapter.source}</div>
    </div>
    {review&&chapter.kind==='archive'&&<div style={{position:'absolute',left:108,bottom:30,color:'#9eb2c6',fontSize:14,letterSpacing:1}}>ARCHIVAL SCREENSHOTS · 30 OCTOBER 2026 · NEW LIVE CAPTURE PENDING</div>}
  </AbsoluteFill>;
};

export const DemoFilm:React.FC<{plan:EditPlan;plateOnly?:boolean}>=({plan,plateOnly})=><AbsoluteFill style={{background:'#060a12'}}>
  {plan.chapters.map(c=><Sequence key={c.name} from={c.start_frame} durationInFrames={c.duration_frames} premountFor={20}><ChapterView chapter={c} review={plan.review} plateOnly={plateOnly}/></Sequence>)}
</AbsoluteFill>;
