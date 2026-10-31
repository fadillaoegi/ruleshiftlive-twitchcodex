import React from 'react';
import {AbsoluteFill,Img,OffthreadVideo,Sequence,staticFile} from 'remotion';

const MONO='"SFMono-Regular",Consolas,monospace';
const CYAN='#65eee7',PINK='#ff55c8';
export const PreviewWatermark:React.FC=()=> <AbsoluteFill style={{background:'transparent',fontFamily:MONO}}><div style={{position:'absolute',left:50,top:140,background:'#060b14f5',color:PINK,fontSize:22,letterSpacing:2,padding:'15px 22px'}}>LAYOUT PREVIEW · NOT BROADCAST</div></AbsoluteFill>;
export const StreamFrame:React.FC<{preview?:boolean}>=({preview=false})=><AbsoluteFill style={{background:'#060b14',color:'#e8f2ff',fontFamily:MONO}}>
  <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(#55eee808 1px,transparent 1px),linear-gradient(90deg,#55eee808 1px,transparent 1px)',backgroundSize:'48px 48px'}}/>
  <div style={{position:'absolute',left:42,right:42,top:24,height:76,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #2e4056',paddingBottom:20}}>
    <div style={{display:'flex',alignItems:'center',gap:20}}><Img src={staticFile('logo.svg')} style={{width:46,height:46}}/><span style={{fontSize:29,fontWeight:700,letterSpacing:5}}>RULESHIFT <span style={{color:PINK}}>LIVE</span></span></div>
    <span style={{fontSize:17,letterSpacing:2,color:preview?PINK:CYAN}}>{preview?'SCENE PREVIEW · NOT BROADCAST':'CHAT → RULE → REAL GRAVITY'}</span>
  </div>
  <div style={{position:'absolute',left:40,top:126,width:1840,height:894,border:'1px solid #30465d',background:'#080e18',boxShadow:'0 0 70px #0008'}}/>
  <div style={{position:'absolute',left:44,right:44,bottom:20,display:'flex',justifyContent:'space-between',fontSize:15,letterSpacing:2,color:'#839bb3'}}><span>CHAT PROPOSES. THE STREAMER DECIDES.</span><span style={{color:CYAN}}>TWITCH / FLDEVBOO</span></div>
</AbsoluteFill>;

export const OpeningOverlay:React.FC=()=> <AbsoluteFill style={{background:'transparent',fontFamily:MONO,color:'#e8f2ff'}}>
  <div style={{position:'absolute',left:0,right:0,bottom:0,height:88,background:'#060b14f5',borderTop:'1px solid #30465d',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 74px',fontSize:24,letterSpacing:4}}><span style={{color:PINK}}>STARTING SOON</span><span style={{color:CYAN,fontSize:19}}>TWITCH.TV/FLDEVBOO</span></div>
</AbsoluteFill>;

export const ArenaPreview:React.FC=()=> <AbsoluteFill><StreamFrame preview/><Img src={staticFile('stream/controller.png')} style={{position:'absolute',left:40,top:127,width:1840,height:892,objectFit:'contain'}}/></AbsoluteFill>;

export const ViewerBeforePreview:React.FC=()=> <AbsoluteFill><StreamFrame preview/><Img src={staticFile('stream/twitch-before.png')} style={{position:'absolute',left:40,top:127,width:1840,height:892,objectFit:'contain'}}/><div style={{position:'absolute',left:44,bottom:17,background:'#060b14',padding:'6px 0',fontFamily:MONO,color:PINK,fontSize:17,letterSpacing:2}}>TWITCH VIEWER REFERENCE · BEFORE BROADCAST · CHANNEL OFFLINE</div></AbsoluteFill>;

export const StreamSetupPreview:React.FC=()=> <AbsoluteFill style={{background:'#060b14'}}>
  <Sequence durationInFrames={390}><OffthreadVideo src={staticFile('demo/intro.mp4')} muted style={{width:1920,height:1080}}/><OpeningOverlay/><div style={{position:'absolute',left:60,top:142,fontFamily:MONO,color:PINK,fontSize:20,background:'#060b14eb',padding:'14px 20px'}}>LAYOUT PREVIEW · NOT A LIVESTREAM RECORDING</div></Sequence>
  <Sequence from={390} durationInFrames={390}><ArenaPreview/></Sequence>
</AbsoluteFill>;
