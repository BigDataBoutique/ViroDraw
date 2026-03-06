import { useRef } from 'react';
import { useCanvasState } from './hooks/useCanvasState';
import { CanvasStage } from './components/Canvas/CanvasStage';
import type { CanvasStageHandle } from './components/Canvas/CanvasStage';
import { Sidebar } from './components/Sidebar/Sidebar';

export default function App() {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useCanvasState();
  const stageRef = useRef<CanvasStageHandle>(null);

  return (
    <div className="flex h-screen">
      <Sidebar state={state} dispatch={dispatch} stageRef={stageRef} />
      <CanvasStage
        ref={stageRef}
        state={state}
        dispatch={dispatch}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}
