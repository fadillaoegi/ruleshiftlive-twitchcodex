import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, Html5Audio, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

type Variant = 'intro' | 'closing';
const CYAN = '#55eee8';
const PINK = '#ff55c8';
const WHITE = '#e9f2ff';
const MONO = '"SFMono-Regular",Consolas,"Liberation Mono",monospace';
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { const x = clamp(n); return x*x*(3-2*x); };
const mix = (a: number, b: number, p: number) => a+(b-a)*p;

// The same original 5x7 glyph design used in the application's PixelText.
const glyphs: Record<string, string[]> = {
  R:['11110','10001','10001','11110','10100','10010','10001'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
};

function makeGlyph(letter: string) {
  const shapes: THREE.Shape[] = [];
  glyphs[letter].forEach((row,y) => [...row].forEach((cell,x) => {
    if (cell !== '1') return;
    const p = new THREE.Shape();
    const yy = 6-y;
    p.moveTo(x,yy); p.lineTo(x+1,yy); p.lineTo(x+1,yy+1); p.lineTo(x,yy+1); p.closePath();
    shapes.push(p);
  }));
  return new THREE.ExtrudeGeometry(shapes, {depth: 1.35, bevelEnabled: true, bevelThickness: 0.065, bevelSize: 0.055, bevelSegments: 2, curveSegments: 1});
}

const PixelLetter: React.FC<{letter: string; color: string; opacity?: number}> = ({letter,color,opacity=1}) => {
  const geometry = useMemo(() => makeGlyph(letter), [letter]);
  return <mesh geometry={geometry}>
    <meshPhysicalMaterial color={color} metalness={0.68} roughness={0.24} clearcoat={0.8} clearcoatRoughness={0.15} emissive={color} emissiveIntensity={0.045} transparent={opacity<1} opacity={opacity} />
  </mesh>;
};

function Environment({frame,variant}: {frame: number; variant: Variant}) {
  const {gl,scene,camera} = useThree();
  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.045);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.55;
    return () => {scene.environment = null; target.dispose(); pmrem.dispose(); room.dispose();};
  }, [gl,scene]);
  useLayoutEffect(() => {
    const p = smooth(frame/(variant==='intro'?215:250));
    const impact = variant==='intro' ? Math.max(0,frame-112) : Math.max(0,frame-54);
    const shake = impact>0 && impact<35 ? Math.sin(impact*1.3)*0.035*Math.exp(-impact/10) : 0;
    camera.position.set(mix(variant==='intro'?5.6:-2.4,0.15,p)+shake, mix(2.8,0.5,p), mix(24,14.5,p));
    camera.lookAt(0,0.15,0);
    camera.rotateZ(variant==='intro' ? mix(-0.075,0,p) : mix(0.035,0,p));
    camera.updateProjectionMatrix();
  },[camera,frame,variant]);
  return null;
}

function NeonBar({position,size,color,opacity=1}: {position:[number,number,number];size:[number,number,number];color:string;opacity?:number}) {
  return <mesh position={position}>
    <boxGeometry args={size}/>
    <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(1.65)} toneMapped={false} transparent opacity={opacity}/>
  </mesh>;
}

function Arena({frame}: {frame:number}) {
  const drift = frame/420;
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-2.9,-10]}>
      <planeGeometry args={[100,110]}/>
      <meshBasicMaterial color="#080f1e"/>
    </mesh>
    {Array.from({length:31},(_,i) => <group key={i}>
      <NeonBar position={[(i-15)*1.6,-2.885,-12]} size={[0.012,0.008,90]} color={i%5===0?CYAN:'#163748'} opacity={i%5===0?0.24:0.4}/>
      <NeonBar position={[0,-2.88,-44+i*2]} size={[58,0.008,0.012]} color="#184050" opacity={0.45}/>
    </group>)}
    {Array.from({length:8},(_,i) => {
      const z = -5-i*6;
      return <group key={i} position={[0,0,z]}>
        <NeonBar position={[-8.6,0.6,0]} size={[0.035,7.1,0.035]} color={i%2?PINK:CYAN} opacity={0.55}/>
        <NeonBar position={[8.6,0.6,0]} size={[0.035,7.1,0.035]} color={i%2?PINK:CYAN} opacity={0.55}/>
        <NeonBar position={[0,4.15,0]} size={[17.2,0.035,0.035]} color={i%2?PINK:CYAN} opacity={0.4}/>
      </group>;
    })}
    {Array.from({length:48},(_,i) => {
      const side = i%2?1:-1;
      const x = side*(9.6+random(`city-x-${i}`)*11);
      const height = 1+random(`city-h-${i}`)*8;
      const z = 10-random(`city-z-${i}`)*65;
      return <group key={i} position={[x,-2.9,z]}>
        <mesh position={[0,height/2,0]}>
          <boxGeometry args={[0.7+random(`city-w-${i}`)*1.5,height,1.1]}/>
          <meshStandardMaterial color={i%3===0?'#11102b':'#0a1824'} metalness={0.7} roughness={0.32} envMapIntensity={0.18}/>
        </mesh>
        <NeonBar position={[-0.28,height*0.65,0.56]} size={[0.025,height*0.5,0.02]} color={i%2?PINK:CYAN} opacity={0.42}/>
      </group>;
    })}
    <group position={[0,0.65,-7]} rotation={[0,0,drift*0.11]}>
      <mesh rotation={[0.04,0.12,0]}>
        <torusGeometry args={[5.2,0.018,8,160,Math.PI*1.5]}/>
        <meshBasicMaterial color={CYAN} toneMapped={false}/>
      </mesh>
      <mesh rotation={[0.04,-0.18,Math.PI]}>
        <torusGeometry args={[5.65,0.014,8,160,Math.PI*1.1]}/>
        <meshBasicMaterial color={PINK} toneMapped={false}/>
      </mesh>
    </group>
  </group>;
}

function Dust({frame,variant}: {frame:number;variant:Variant}) {
  const positions=useMemo(() => {
    const p = new Float32Array(180*3);
    const reversed = smooth((frame-112)/30);
    for(let i=0;i<180;i++) {
      p[i*3]=(random(`dust-x-${i}`)-0.5)*36;
      const start=(random(`dust-y-${i}`)-0.5)*14;
      p[i*3+1]=start+(variant==='intro'?frame/60*(reversed*0.8-0.2):frame/100);
      p[i*3+2]=7-random(`dust-z-${i}`)*48;
    }
    return p;
  },[frame,variant]);
  return <points>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry>
    <pointsMaterial color={CYAN} size={0.035} transparent opacity={0.65} depthWrite={false} sizeAttenuation/>
  </points>;
}

function Coin({index,frame,variant}: {index:number;frame:number;variant:Variant}) {
  const trigger = [42,76,112][index];
  const take = smooth((frame-trigger)/24);
  const x = (index-1)*3.3;
  const y = variant==='intro'?mix(-0.1,4.3,take):2.45+Math.sin(frame/50+index)*0.2;
  const visible = variant==='closing' || take<0.995;
  const scale = variant==='intro'?mix(1.15,0.4,take):0.45;
  return <group position={[x,y,variant==='intro'?2.2-index*0.5:-2]} rotation={[0.12,frame/65+index*0.9,0.1*Math.sin(frame/60+index)]} scale={scale} visible={visible}>
    <mesh rotation={[Math.PI/2,0,0]}>
      <cylinderGeometry args={[0.67,0.67,0.16,48]}/>
      <meshPhysicalMaterial color="#ffce63" metalness={0.85} roughness={0.22} clearcoat={0.6}/>
    </mesh>
    {[-1,1].map(side=><group key={side} position={[0,0,side*0.087]} rotation={[0,side<0?Math.PI:0,0]}>
      <mesh>
        <torusGeometry args={[0.53,0.025,8,64]}/>
        <meshStandardMaterial color="#fff1b1" metalness={0.7} roughness={0.25} emissive="#ffc857" emissiveIntensity={0.3}/>
      </mesh>
      <mesh rotation={[Math.PI/2,0,0]} position={[0,0,0.003]}>
        <cylinderGeometry args={[0.475,0.475,0.012,48]}/>
        <meshStandardMaterial color="#725028" metalness={0.65} roughness={0.3}/>
      </mesh>
      {[-0.14,0.14].map(x => <mesh key={x} position={[x,0,0.028]}>
        <boxGeometry args={[0.12,0.57,0.05]}/>
        <meshStandardMaterial color="#fff0a8" emissive="#ffce63" emissiveIntensity={0.15} metalness={0.7} roughness={0.25}/>
      </mesh>)}
    </group>)}
  </group>;
}

function Logo({frame,variant}: {frame:number;variant:Variant}) {
  const texture=useMemo(() => {
    const c=document.createElement('canvas');c.width=512;c.height=512;
    const ctx=c.getContext('2d')!;
    ctx.fillStyle=PINK;ctx.fillRect(0,0,512,512);
    ctx.strokeStyle='#ff99df';ctx.lineWidth=28;ctx.strokeRect(14,14,484,484);
    ctx.fillStyle='#160b21';ctx.font=`850 397px ${MONO}`;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText('↯',256,371);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    return t;
  },[]);
  const p=spring({frame:frame-(variant==='intro'?110:20),fps:60,config:{damping:19,stiffness:90,mass:1.2}});
  return <group visible={frame>=(variant==='intro'?110:20)} position={[-5.1,mix(-2.6,0.72,p),mix(5,0,p)]} rotation={[mix(0.8,-0.025,p),mix(-1.1,0.12,p),mix(-0.65,-0.02,p)]} scale={1.5}>
    <mesh>
      <boxGeometry args={[1,1,0.22]}/>
      <meshPhysicalMaterial color={PINK} metalness={0.65} roughness={0.22}/>
    </mesh>
    <mesh position={[0,0,0.112]}>
      <planeGeometry args={[1,1]}/>
      <meshBasicMaterial map={texture} toneMapped={false}/>
    </mesh>
  </group>;
}

function Wordmark({frame,variant}: {frame:number;variant:Variant}) {
  const cell=0.165;
  return <group position={[0.95,0.2,0]}>
    {[...'RULESHIFT'].map((letter,i) => {
      const start=variant==='intro'?116+i*5:24+i*4;
      const p=spring({frame:frame-start,fps:60,config:{damping:20,stiffness:82,mass:0.9}});
      const opacity=smooth((frame-start)/18);
      return <group key={i} position={[(i*6-26.5)*cell,mix(-1.8,0,p),mix(-6,0,p)]} rotation={[mix(0.75,0,p),mix(-0.4,0,p),0]} scale={cell}>
        <PixelLetter letter={letter} color={i<4?WHITE:CYAN} opacity={opacity}/>
      </group>;
    })}
    <group position={[-0.59,-0.77,0]} scale={0.045}>
      {[...'LIVE'].map((letter,i)=><group key={i} position={[i*8,0,0]}><PixelLetter letter={letter} color={PINK} opacity={smooth((frame-(variant==='intro'?190:93))/35)}/></group>)}
    </group>
  </group>;
}

function GravityWave({frame,variant}: {frame:number;variant:Variant}) {
  const f=frame-(variant==='intro'?112:54);
  const progress=clamp(f/70);
  const opacity=f<0?0:(1-progress)*0.65;
  return <group position={[0,0.2,0.3]}>
    <mesh scale={1+progress*11} rotation={[0,0,frame/160]}>
      <torusGeometry args={[1,0.018,8,128]}/>
      <meshBasicMaterial color={PINK} transparent opacity={opacity} toneMapped={false} depthWrite={false}/>
    </mesh>
    <mesh scale={1+progress*9.5} position={[0,0,-0.2]}>
      <torusGeometry args={[1,0.012,8,128]}/>
      <meshBasicMaterial color={CYAN} transparent opacity={opacity*0.75} toneMapped={false} depthWrite={false}/>
    </mesh>
  </group>;
}

function CinematicPass() {
  const {gl,scene,camera,size}=useThree();
  const composer=useMemo(()=>{
    const c=new EffectComposer(gl);
    c.setSize(size.width,size.height);
    c.addPass(new RenderPass(scene,camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width,size.height),0.15,0.32,1.65));
    c.addPass(new OutputPass());
    return c;
  },[gl,scene,camera,size.width,size.height]);
  // This callback only draws the postprocessing passes. All animation remains
  // deterministic and derived from Remotion's frame, never elapsed wall time.
  useFrame(()=>composer.render(),1);
  useLayoutEffect(()=>()=>composer.dispose(),[composer]);
  return null;
}

function Scene({frame,variant}: {frame:number;variant:Variant}) {
  return <>
    <color attach="background" args={['#060a14']}/>
    <fog attach="fog" args={['#060a14',18,63]}/>
    <Environment frame={frame} variant={variant}/>
    <ambientLight intensity={0.16}/>
    <hemisphereLight args={['#a5eaff','#120b28',0.9]}/>
    <pointLight position={[-6,5,6]} color={CYAN} intensity={115} distance={40}/>
    <pointLight position={[6,3,3]} color={PINK} intensity={140} distance={40}/>
    <pointLight position={[0,7,9]} color="#ffffff" intensity={90} distance={50}/>
    <Arena frame={frame}/>
    <Dust frame={frame} variant={variant}/>
    {[0,1,2].map(i=><Coin key={i} index={i} frame={frame} variant={variant}/>)}
    <Logo frame={frame} variant={variant}/>
    <Wordmark frame={frame} variant={variant}/>
    <GravityWave frame={frame} variant={variant}/>
    <CinematicPass/>
  </>;
}

const Pill: React.FC<{children:React.ReactNode;color?:string}> = ({children,color=CYAN}) => <div style={{border:`1px solid ${color}55`,background:`${color}0b`,padding:'12px 18px',fontSize:16,letterSpacing:2.5,color}}>{children}</div>;

export const BrandFilm: React.FC<{variant:Variant}> = ({variant}) => {
  const frame=useCurrentFrame();
  const {width,height,durationInFrames}=useVideoConfig();
  const intro=variant==='intro';
  const fade=smooth(frame/24)*(1-smooth((frame-(durationInFrames-27))/26));
  const caption=smooth((frame-(intro?212:112))/32);
  const titleY=mix(20,0,caption);
  const stage=frame<42?'01':frame<76?'02':'03';
  const hud=smooth((frame-16)/20)*(1-smooth((frame-156)/26));
  return <AbsoluteFill style={{background:'#060a14',color:WHITE,fontFamily:MONO}}>
    <Html5Audio src={staticFile(`${variant}-sound.wav`)}/>
    <AbsoluteFill style={{opacity:fade}}>
      <ThreeCanvas width={width} height={height} camera={{fov:36,near:0.1,far:160,position:[0,1,17]}} gl={{antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance',toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.04}} dpr={1}>
        <Scene frame={frame} variant={variant}/>
      </ThreeCanvas>
      <AbsoluteFill style={{pointerEvents:'none',background:'radial-gradient(ellipse at 50% 43%,transparent 30%,rgba(3,5,13,.38) 80%,rgba(3,5,13,.8) 100%)'}}/>
      <div style={{position:'absolute',left:108,right:108,top:76,display:'flex',justifyContent:'space-between',alignItems:'center',opacity:smooth(frame/42)}}>
        <div style={{display:'flex',alignItems:'center',gap:16,fontSize:16,letterSpacing:3,color:'#9baabe'}}>
          <Img src={staticFile('logo.svg')} style={{width:36,height:36}}/>
          RULESHIFT <span style={{color:PINK}}>LIVE</span>
        </div>
        <div style={{fontSize:14,letterSpacing:3,color:'#7c8da7'}}>{intro?'AUDIENCE OVERRIDE / 001':'THE NEXT RULE IS YOURS'}</div>
      </div>
      {intro&&<div style={{position:'absolute',left:110,bottom:233,opacity:hud,display:'flex',alignItems:'center',gap:22}}>
        <div style={{fontSize:48,fontWeight:700,color:frame>=112?PINK:CYAN,fontVariantNumeric:'tabular-nums'}}>{stage}<span style={{fontSize:18,color:'#6f8399'}}> / 03</span></div>
        <div style={{height:46,width:1,background:'#365066'}}/>
        <div style={{fontSize:16,letterSpacing:2,color:frame>=112?PINK:'#9db0c5'}}>{frame>=112?'GRAVITY / REVERSED':'COLLECT / CONNECT / CHANGE'}</div>
      </div>}
      <div style={{position:'absolute',left:0,right:0,bottom:intro?182:206,textAlign:'center',opacity:caption,transform:`translateY(${titleY}px)`}}>
        {intro?<>
          <div style={{fontSize:25,letterSpacing:6,color:'#a4becb',marginBottom:19}}>CHAT WRITES THE RULES.</div>
          <div style={{fontSize:45,letterSpacing:4,fontWeight:800,color:WHITE,textShadow:'0 0 28px #ff55c830'}}>YOU SURVIVE THEM.</div>
        </>:<>
          <div style={{fontSize:43,letterSpacing:3,fontWeight:800,color:WHITE,marginBottom:25}}>LET CHAT CHANGE THE GAME.</div>
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:13,fontSize:18,letterSpacing:4,color:'#9db6c8'}}><span style={{display:'inline-block',width:7,height:7,background:CYAN,boxShadow:`0 0 18px ${CYAN}`}}/>BUILT WITH CODEX</div>
        </>}
      </div>
      <div style={{position:'absolute',left:108,right:108,bottom:80,borderTop:'1px solid #55eee82a',paddingTop:23,display:'flex',justifyContent:'space-between',alignItems:'center',opacity:smooth((frame-48)/45)}}>
        <div style={{fontSize:13,color:'#62778d',letterSpacing:2.4}}>{intro?'ONE ARENA. A LIVE AUDIENCE. A NEW TWIST.':'A GAME FOR STREAMERS AND THEIR COMMUNITIES.'}</div>
        <Pill color={intro?CYAN:PINK}>{intro?'TWITCH CHAT → REAL GRAVITY':'RULESHIFT / LIVE'}</Pill>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
