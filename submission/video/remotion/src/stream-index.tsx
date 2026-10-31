import {Composition,registerRoot} from 'remotion';
import {ArenaPreview,OpeningOverlay,PreviewWatermark,StreamFrame,StreamSetupPreview,ViewerBeforePreview} from './stream-preview';

const Root=()=> <>
  <Composition id="RuleShiftStreamFrame" component={StreamFrame} width={1920} height={1080} fps={60} durationInFrames={1}/>
  <Composition id="RuleShiftOpeningOverlay" component={OpeningOverlay} width={1920} height={1080} fps={60} durationInFrames={1}/>
  <Composition id="RuleShiftArenaPreview" component={ArenaPreview} width={1920} height={1080} fps={60} durationInFrames={1}/>
  <Composition id="RuleShiftPreviewWatermark" component={PreviewWatermark} width={1920} height={1080} fps={60} durationInFrames={1}/>
  <Composition id="RuleShiftViewerBeforePreview" component={ViewerBeforePreview} width={1920} height={1080} fps={60} durationInFrames={1}/>
  <Composition id="RuleShiftStreamSetupPreview" component={StreamSetupPreview} width={1920} height={1080} fps={60} durationInFrames={780}/>
</>;
registerRoot(Root);
