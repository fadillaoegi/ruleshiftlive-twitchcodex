import {Composition, registerRoot} from 'remotion';
import {BrandFilm} from './motion';
import {DemoFilm} from './demo';
import type {EditPlan} from './demo';
import demoPlan from '../public/demo/edit-plan.json';

const Root = () => <>
  <Composition id="RuleShiftIntro" component={BrandFilm} width={1920} height={1080} fps={60} durationInFrames={390} defaultProps={{variant: 'intro' as const}} />
  <Composition id="RuleShiftClosing" component={BrandFilm} width={1920} height={1080} fps={60} durationInFrames={330} defaultProps={{variant: 'closing' as const}} />
  <Composition id={demoPlan.review?'RuleShiftDemoReview':'RuleShiftDemo'} component={DemoFilm} width={1920} height={1080} fps={60} durationInFrames={demoPlan.duration_in_frames} defaultProps={{plan:demoPlan as EditPlan}} />
</>;

registerRoot(Root);
