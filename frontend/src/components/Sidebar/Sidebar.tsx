import { useState, useCallback, useRef, useEffect } from 'react';
import type { CanvasState, CanvasAction } from '../../types';
import type { CanvasStageHandle } from '../Canvas/CanvasStage';
import { CanvasSettings } from './CanvasSettings';
import { BackgroundPanel } from './BackgroundPanel';
import { ImagePanel } from './ImagePanel';
import { TextPanel } from './TextPanel';
import { ExportPanel } from './ExportPanel';
import { Tooltip } from '../common/Tooltip';
import viroDrawLogo from '../../assets/virodraw-logo.svg';

interface Props {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  stageRef: React.RefObject<CanvasStageHandle | null>;
}

const TABS = [
  {
    id: 'background' as const,
    label: 'Background',
    tooltip: 'Set a background image or color',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    id: 'text' as const,
    label: 'Text',
    tooltip: 'Add and style text elements',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M4 7V4h16v3" />
        <path d="M12 4v16" />
        <path d="M8 20h8" />
      </svg>
    ),
  },
  {
    id: 'images' as const,
    label: 'Images',
    tooltip: 'Add logos and images to the canvas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    id: 'export' as const,
    label: 'Export',
    tooltip: 'Download your hero image',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    id: 'settings' as const,
    label: 'Settings',
    tooltip: 'Canvas size and preferences',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
] as const;

type Tab = (typeof TABS)[number]['id'];

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;

export function Sidebar({ state, dispatch, stageRef }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('background');
  const [width, setWidth] = useState(340);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      className="relative flex flex-col shrink-0 bg-slate-50 border-r border-slate-200"
      style={{ width }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-5 border-b border-slate-200">
        <img src={viroDrawLogo} alt="ViroDraw" className="h-7" />
        <p className="text-[13px] text-slate-400 mt-2.5 tracking-wide">Simplify image and slides creation</p>
      </div>

      {/* Tab bar */}
      <div className="flex px-3 gap-1 border-b border-slate-200 bg-white/60">
        {TABS.map((tab) => (
          <Tooltip key={tab.id} text={tab.tooltip} className="flex-1">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center justify-center w-full py-2.5 cursor-pointer transition-colors rounded-t-md ${
                activeTab === tab.id
                  ? 'text-indigo-600 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-indigo-600 after:rounded-full'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'background' && (
          <BackgroundPanel config={state.config} backgroundColor={state.backgroundColor} backgroundGradient={state.backgroundGradient} dispatch={dispatch} />
        )}
        {activeTab === 'text' && (
          <TextPanel state={state} dispatch={dispatch} />
        )}
        {activeTab === 'images' && (
          <ImagePanel state={state} dispatch={dispatch} />
        )}
        {activeTab === 'export' && (
          <ExportPanel exportFormat={state.exportFormat} dispatch={dispatch} stageRef={stageRef} />
        )}
        {activeTab === 'settings' && (
          <CanvasSettings state={state} dispatch={dispatch} />
        )}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-400/30 active:bg-indigo-400/50 transition-colors z-10"
      />
    </div>
  );
}
