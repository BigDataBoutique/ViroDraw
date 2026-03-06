import type { CanvasState, CanvasAction } from '../../types';
import type { CanvasStageHandle } from '../Canvas/CanvasStage';
import { CanvasSettings } from './CanvasSettings';
import { BackgroundPanel } from './BackgroundPanel';
import { ImagePanel } from './ImagePanel';
import { TextPanel } from './TextPanel';
import { ExportPanel } from './ExportPanel';

interface Props {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  stageRef: React.RefObject<CanvasStageHandle | null>;
}

export function Sidebar({ state, dispatch, stageRef }: Props) {
  return (
    <div className="w-80 border-r bg-white p-4 overflow-y-auto space-y-4 shrink-0">
      <h2 className="text-lg font-bold">Hero Image Generator</h2>
      <CanvasSettings config={state.config} dispatch={dispatch} />
      <hr />
      <BackgroundPanel config={state.config} dispatch={dispatch} />
      <hr />
      <ImagePanel state={state} dispatch={dispatch} />
      <hr />
      <TextPanel state={state} dispatch={dispatch} />
      <hr />
      <ExportPanel exportFormat={state.exportFormat} dispatch={dispatch} stageRef={stageRef} />
    </div>
  );
}
