import React from 'react';
import {AbsoluteFill,Img,staticFile} from 'remotion';
const PINK='#ff55c8',CYAN='#55eee8',WHITE='#f1f6ff',MONO='"SFMono-Regular",Consolas,monospace',SANS='"Arial Black",Arial,Helvetica,sans-serif';
const ROBOT=['0111110','1111111','1222221','1232321','1222221','1101011','0100010'];
const Sprite:React.FC<{size:number;color?:string}>=({size,color=PINK})=><svg viewBox="0 0 7 7" width={size} height={size} style={{filter:`drop-shadow(0 0 19px ${color}55)`}}>{ROBOT.flatMap((row,y)=>[...row].map((c,x)=>c==='0'?null:<rect key={x+'-'+y} x={x} y={y} width={1} height={1} fill={c==='1'?color:c==='2'?'#183143':'#f8f2ff'}/>))}</svg>;
const Coin:React.FC<{size:number;angle?:number}>=({size,angle=-12})=><div style={{width:size,height:size,transform:`rotate(${angle}deg) rotateY(-15deg)`,filter:'drop-shadow(14px 20px 15px #0009)'}}><svg viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id={'gold'+size} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff3b2"/><stop offset=".45" stopColor="#ffcf65"/><stop offset="1" stopColor="#ab6326"/></linearGradient></defs><ellipse cx="54" cy="53" rx="42" ry="45" fill="#9c5d20"/><circle cx="48" cy="48" r="43" fill={`url(#gold${size})`} stroke="#fff1a1" strokeWidth="3"/><circle cx="48" cy="48" r="33" fill="#bb7a32" stroke="#ffe69a" strokeWidth="2"/><path d="M36 26h9v44h-9zM52 26h9v44h-9z" fill="#fff3b6"/></svg></div>;
const Background:React.FC=()=> <>
 <AbsoluteFill style={{background:'#060a13'}}/>
 <AbsoluteFill style={{background:'radial-gradient(ellipse at 80% 16%,#4c174c 0%,transparent 46%),radial-gradient(ellipse at 15% 88%,#103442 0%,transparent 55%)'}}/>
 <AbsoluteFill style={{backgroundImage:'linear-gradient(#4be9ee0a 1px,transparent 1px),linear-gradient(90deg,#4be9ee0a 1px,transparent 1px)',backgroundSize:'72px 72px'}}/>
 <div style={{position:'absolute',left:'-20%',right:'-20%',bottom:'-48%',height:'100%',backgroundImage:'linear-gradient(#55eee82a 1px,transparent 1px),linear-gradient(90deg,#55eee82a 1px,transparent 1px)',backgroundSize:'100px 100px',transform:'perspective(650px) rotateX(57deg)',transformOrigin:'center top',opacity:.55}}/>
 </>;
const Brand:React.FC<{x:number;y:number;size?:number}>=({x,y,size=46})=><div style={{position:'absolute',left:x,top:y,display:'flex',gap:18,alignItems:'center',color:WHITE,fontFamily:MONO,fontSize:size*.65,fontWeight:800,letterSpacing:2}}><Img src={staticFile('logo.svg')} style={{width:size,height:size}}/><span>RULESHIFT <span style={{color:PINK}}>LIVE</span></span></div>;
const Arena:React.FC<{width:number;compact?:boolean}>=({width,compact})=>{
 const rect=compact?{x:265,y:320,w:1040,h:470}:{x:255,y:134,w:1075,h:700},scale=width/rect.w;
 return <div style={{width,height:rect.h*scale,position:'relative',overflow:'hidden',background:'#080d1b'}}><Img src={staticFile('design/gameplay.png')} style={{position:'absolute',width:1920*scale,height:1080*scale,left:-rect.x*scale,top:-rect.y*scale}}/></div>;
};
const Screen:React.FC<{width:number;compact?:boolean}>=({width,compact})=><div style={{padding:14,background:'linear-gradient(145deg,#50657e,#172337 20%,#101829 88%,#70355d)',border:'1px solid #697f94',borderRadius:22,boxShadow:'0 40px 100px #000b,0 0 50px #55eee815'}}><div style={{height:28,display:'flex',gap:7,alignItems:'center',paddingLeft:10}}>{[PINK,CYAN,'#ffdd78'].map(c=><span key={c} style={{height:6,width:6,borderRadius:6,background:c}}/>)}</div><div style={{border:'1px solid #2e4961',borderRadius:6,overflow:'hidden'}}><Arena width={width-30} compact={compact}/></div></div>;
const Tag:React.FC<{children:React.ReactNode;color?:string}>=({children,color=CYAN})=><span style={{display:'inline-block',padding:'14px 21px',border:`1px solid ${color}88`,background:color+'12',color,fontFamily:MONO,fontSize:20,letterSpacing:1}}>{children}</span>;

export const YoutubeDesign:React.FC=()=> <AbsoluteFill style={{fontFamily:SANS,color:WHITE,overflow:'hidden'}}><Background/><Brand x={85} y={66} size={56}/>
 <div style={{position:'absolute',left:865,top:205,transform:'perspective(1800px) rotateY(-12deg) rotateZ(-5deg)',transformOrigin:'center',width:1035}}><Screen width={1035}/></div>
 <div style={{position:'absolute',left:85,top:243,fontSize:139,lineHeight:.98,letterSpacing:-7,textShadow:'0 10px 30px #000d',fontWeight:900}}>CHAT<br/><span style={{color:PINK}}>CHANGES</span><br/><span style={{color:CYAN}}>GRAVITY.</span></div>
 <div style={{position:'absolute',left:1020,top:80}}><Coin size={126} angle={-20}/></div><div style={{position:'absolute',left:1490,top:118}}><Coin size={103} angle={20}/></div><div style={{position:'absolute',left:1740,top:340}}><Coin size={80} angle={5}/></div>
 <div style={{position:'absolute',left:1410,top:650,transform:'rotate(180deg)'}}><Sprite size={242}/></div>
 <div style={{position:'absolute',left:1665,top:658,fontFamily:MONO,fontSize:220,color:PINK,lineHeight:1,textShadow:'0 0 35px #ff55c844'}}>↑</div>
 <div style={{position:'absolute',left:88,top:880,display:'flex',gap:22}}><Tag>3 COINS / 4 SECONDS</Tag><Tag color={PINK}>STREAMER APPROVED</Tag></div>
 <div style={{position:'absolute',left:89,top:1003,color:'#8ea7c0',fontFamily:MONO,fontSize:18,letterSpacing:2}}>INTERACTIVE TWITCH GAMEPLAY · BUILT WITH CODEX</div>
</AbsoluteFill>;

export const DevpostDesign:React.FC=()=> <AbsoluteFill style={{fontFamily:SANS,color:WHITE,overflow:'hidden'}}><Background/><Brand x={82} y={70} size={60}/>
 <div style={{position:'absolute',left:84,top:245,fontFamily:MONO,fontSize:20,color:CYAN,letterSpacing:3}}>YOUR ARENA. CHAT'S RULES.</div>
 <div style={{position:'absolute',left:78,top:304,fontSize:96,lineHeight:1.06,letterSpacing:-5,fontWeight:900}}>CHAT WRITES<br/>THE <span style={{color:PINK}}>RULES.</span><br/><span style={{color:CYAN}}>YOU PLAY.</span></div>
 <div style={{position:'absolute',left:788,top:290,width:963,transform:'perspective(1800px) rotateY(-12deg) rotateZ(-4deg)'}}><Screen width={963}/></div>
 <div style={{position:'absolute',left:1240,top:875,transform:'rotate(180deg)'}}><Sprite size={178}/></div>
 <div style={{position:'absolute',left:1350,top:128}}><Coin size={116} angle={20}/></div><div style={{position:'absolute',left:1640,top:200}}><Coin size={80}/></div>
 <div style={{position:'absolute',left:86,top:852,fontFamily:MONO,fontSize:23,color:'#bbcee1',lineHeight:1.65}}>Real Twitch chat.<br/>Streamer approval.<br/>Temporary changes to game physics.</div>
 <div style={{position:'absolute',left:84,right:84,bottom:72,borderTop:'1px solid #38506a',paddingTop:27,display:'flex',justifyContent:'space-between',fontFamily:MONO,fontSize:18,color:CYAN}}><span>3 COINS → GRAVITY FLIPS FOR 4 SECONDS</span><span style={{color:PINK}}>BUILT WITH CODEX</span></div>
</AbsoluteFill>;

export const PosterDesign:React.FC=()=> <AbsoluteFill style={{fontFamily:SANS,color:WHITE,overflow:'hidden'}}><Background/><Brand x={100} y={90} size={66}/>
 <div style={{position:'absolute',left:102,top:252,fontFamily:MONO,fontSize:21,letterSpacing:3,color:CYAN}}>AN INTERACTIVE TWITCH EXPERIENCE</div>
 <div style={{position:'absolute',left:91,top:325,fontSize:116,lineHeight:.99,letterSpacing:-6,fontWeight:900}}>CHAT WRITES<br/>THE <span style={{color:PINK}}>RULES.</span><br/>YOU <span style={{color:CYAN}}>SURVIVE.</span></div>
 <div style={{position:'absolute',left:102,top:729,fontFamily:MONO,color:'#bdcee0',fontSize:26,lineHeight:1.6}}>A viewer's idea becomes a temporary twist.<br/>The streamer approves. The game obeys.</div>
 <div style={{position:'absolute',left:88,top:850,width:1224,transform:'perspective(1600px) rotateX(4deg) rotateZ(-2deg)'}}><Screen width={1224} compact/></div>
 <div style={{position:'absolute',left:1120,top:650}}><Coin size={121} angle={20}/></div>
 <div style={{position:'absolute',left:1128,top:1460,transform:'rotate(180deg)'}}><Sprite size={124}/></div>
 <div style={{position:'absolute',left:103,top:1498,display:'flex',alignItems:'baseline',gap:26}}><span style={{fontSize:87,color:'#ffdb78'}}>3</span><span style={{fontFamily:MONO,fontSize:24}}>COINS</span><span style={{fontSize:67,color:PINK,marginLeft:45}}>→</span><span style={{fontSize:87,color:CYAN}}>4</span><span style={{fontFamily:MONO,fontSize:24}}>SECONDS</span></div>
 <div style={{position:'absolute',left:105,top:1620,fontFamily:MONO,fontSize:25,color:'#bfd2e4'}}>Reverse gravity. Return automatically. Keep playing.</div>
 <div style={{position:'absolute',left:100,right:100,top:1733,borderTop:'1px solid #3b5269',paddingTop:44}}><div style={{fontFamily:MONO,fontSize:18,color:CYAN,letterSpacing:3}}>WATCH THE DEMO / 02:42</div><div style={{fontSize:44,marginTop:16,letterSpacing:-1}}>LET CHAT CHANGE THE GAME.</div><div style={{fontFamily:MONO,fontSize:23,color:'#afc5d9',marginTop:17}}>youtu.be/AvWHm6U2jUs</div></div>
 <Img src={staticFile('design/demo-qr.svg')} style={{position:'absolute',right:103,top:1765,width:158,height:158,border:'8px solid white',background:'white'}}/>
 <div style={{position:'absolute',left:103,bottom:36,fontFamily:MONO,fontSize:15,color:'#738ba3',letterSpacing:1}}>TWITCH CHAT · GO · TYPESCRIPT · POSTGRESQL · BUILT WITH CODEX</div>
</AbsoluteFill>;
