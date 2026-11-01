import {Composition,registerRoot,Img,staticFile} from 'remotion';
import {YoutubeDesign,DevpostDesign,PosterDesign} from './design';
const Root=()=> <>
 <Composition id="BrandLogo" component={()=> <Img src={staticFile('logo.svg')} style={{width:160,height:160}}/>} width={160} height={160} fps={60} durationInFrames={1}/>
 <Composition id="YoutubeThumbnail" component={YoutubeDesign} width={1920} height={1080} fps={60} durationInFrames={1}/>
 <Composition id="DevpostCover" component={DevpostDesign} width={1800} height={1200} fps={60} durationInFrames={1}/>
 <Composition id="Poster" component={PosterDesign} width={1400} height={1980} fps={60} durationInFrames={1}/>
</>;
registerRoot(Root);
