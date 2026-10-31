import {Composition,registerRoot} from 'remotion';
import {FinalPlate,FinalSource,RuleDiagram,SubtitleCard} from './final';
import type {FinalChapter} from './final';
import plan from '../public/final/edit-plan.json';
const chapter=plan.chapters.find(c=>c.name==='gravity') as FinalChapter;
const Root=()=> <>
 <Composition id="FinalPlate" component={FinalPlate} width={1920} height={1080} fps={60} durationInFrames={60} defaultProps={{chapter}}/>
 <Composition id="FinalSource" component={FinalSource} width={1920} height={1080} fps={60} durationInFrames={60} defaultProps={{chapter:plan.chapters.find(c=>c.name==='source') as FinalChapter}}/>
 <Composition id="RuleExplainer3D" component={RuleDiagram} width={1920} height={1080} fps={60} durationInFrames={420}/>
 <Composition id="SubtitleCard" component={SubtitleCard} width={1920} height={128} fps={60} durationInFrames={1} defaultProps={{cue:{text:'Every third coin reverses gravity for four seconds.'}}}/>
</>;
registerRoot(Root);
