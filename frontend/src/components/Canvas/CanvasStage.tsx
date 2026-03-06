import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import type { CanvasState, CanvasAction } from '../../types';
import { BackgroundLayer } from './BackgroundLayer';
import logoGreyscale from '../../assets/logo-greyscale.svg';
import { ImageElementComponent } from './ImageElement';
import { TextElementComponent } from './TextElement';
import { BoundingBoxOverlay } from './BoundingBox';
import { logoPosition } from '../../utils/autoLayout';
import { persistImage } from '../../utils/imageLibrary';

interface Props {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

export interface CanvasStageHandle {
  toBlob: (mimeType: string) => Promise<Blob>;
}

export const CanvasStage = forwardRef<CanvasStageHandle, Props>(
  function CanvasStage({ state, dispatch }, ref) {
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const updateScale = useCallback(() => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const scaleX = containerWidth / state.config.width;
      const scaleY = containerHeight / state.config.height;
      setScale(Math.min(scaleX, scaleY, 1));
    }, [state.config.width, state.config.height]);

    useEffect(() => {
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }, [updateScale]);

    // Keyboard handler: Delete, Escape, Arrow keys
    useEffect(() => {
      const SMALL_STEP = 1;
      const LARGE_STEP = 10;

      const handleKeyDown = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement).tagName;
        const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

        // Escape deselects from anywhere
        if (e.key === 'Escape') {
          if (state.selectedId) {
            dispatch({ type: 'SET_SELECTED', payload: null });
            e.preventDefault();
          }
          return;
        }

        // All other shortcuts only work when not typing in inputs
        if (isInput) return;
        if (!state.selectedId) return;

        // Delete / Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (state.images.some((img) => img.id === state.selectedId)) {
            dispatch({ type: 'REMOVE_IMAGE', payload: state.selectedId });
          } else if (state.texts.some((t) => t.id === state.selectedId)) {
            dispatch({ type: 'REMOVE_TEXT', payload: state.selectedId });
          }
          return;
        }

        // Arrow keys for moving selected element
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const step = e.shiftKey ? LARGE_STEP : SMALL_STEP;
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          else if (e.key === 'ArrowDown') dy = step;
          else if (e.key === 'ArrowLeft') dx = -step;
          else if (e.key === 'ArrowRight') dx = step;

          const img = state.images.find((i) => i.id === state.selectedId);
          if (img) {
            dispatch({ type: 'UPDATE_IMAGE', payload: { id: img.id, x: img.x + dx, y: img.y + dy } });
            return;
          }
          const txt = state.texts.find((t) => t.id === state.selectedId);
          if (txt) {
            dispatch({ type: 'UPDATE_TEXT', payload: { id: txt.id, x: txt.x + dx, y: txt.y + dy } });
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.selectedId, state.images, state.texts, dispatch]);

    useImperativeHandle(ref, () => ({
      toBlob: (mimeType: string) => {
        return new Promise<Blob>((resolve, reject) => {
          if (!stageRef.current) return reject(new Error('No stage'));
          // Deselect so transformer isn't in the export
          const selectedId = state.selectedId;
          if (selectedId) dispatch({ type: 'SET_SELECTED', payload: null });
          // Give time for transformer to unmount
          setTimeout(() => {
            stageRef.current!.toBlob({
              mimeType,
              pixelRatio: 1,
              callback: (blob: Blob | null) => {
                if (selectedId) dispatch({ type: 'SET_SELECTED', payload: selectedId });
                if (blob) resolve(blob);
                else reject(new Error('Failed to export canvas'));
              },
            });
          }, 50);
        });
      },
    }));

    // Shared helper: load a File/Blob as an image and add to canvas + gallery
    const addFileToCanvas = useCallback(async (file: Blob) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = objectUrl;
      });
      const maxDim = 200;
      const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      const w = img.naturalWidth * ratio;
      const h = img.naturalHeight * ratio;
      const pos = logoPosition(state.images.length, state.config.width, w);
      dispatch({
        type: 'ADD_IMAGE',
        payload: {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          src: img.src,
          image: img,
          width: w,
          height: h,
          ...pos,
        },
      });
      persistImage(img);
    }, [state.images.length, state.config.width, dispatch]);

    // Paste from clipboard (Ctrl+V)
    useEffect(() => {
      const handlePaste = async (e: ClipboardEvent) => {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const blob = item.getAsFile();
            if (blob) {
              try { await addFileToCanvas(blob); } catch { /* ignore */ }
            }
            return;
          }
        }
      };
      window.addEventListener('paste', handlePaste);
      return () => window.removeEventListener('paste', handlePaste);
    }, [addFileToCanvas]);

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (e.target === e.target.getStage()) {
        dispatch({ type: 'SET_SELECTED', payload: null });
      }
    };

    const handleContainerClick = (e: React.MouseEvent) => {
      // Deselect when clicking the grey area outside the canvas
      if (e.target === containerRef.current) {
        dispatch({ type: 'SET_SELECTED', payload: null });
      }
    };

    // Right-click context menu paste
    const handleContextMenu = useCallback(async (e: React.MouseEvent) => {
      // Allow default context menu — the browser "Paste" option will trigger
      // the paste event which we already handle above. But we can also
      // try reading the clipboard directly for browsers that support it.
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            e.preventDefault();
            const blob = await item.getType(imageType);
            try { await addFileToCanvas(blob); } catch { /* ignore */ }
            return;
          }
        }
      } catch {
        // Permission denied or API not available — fall through to default context menu
      }
    }, [addFileToCanvas]);

    const [dragOver, setDragOver] = useState(false);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      for (const file of files) {
        try { await addFileToCanvas(file); } catch { /* ignore */ }
      }
    }, [addFileToCanvas]);

    const { width, height } = state.config;

    return (
      <div
        ref={containerRef}
        className={`flex-1 flex flex-col items-center justify-center overflow-hidden p-4 transition-colors ${dragOver ? 'bg-indigo-50' : 'bg-gray-100'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={handleContainerClick}
        onContextMenu={handleContextMenu}
      >
        <div
          className="flex-shrink-0"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <Stage
            ref={stageRef}
            width={width}
            height={height}
            onClick={handleStageClick}
            onTap={handleStageClick}
            style={{ border: '1px solid #ccc', background: '#fff' }}
          >
            <Layer>
              <BackgroundLayer
                width={width}
                height={height}
                backgroundImage={state.backgroundImage}
              />
            </Layer>
            <Layer>
              {state.images.map((img) => (
                <ImageElementComponent
                  key={img.id}
                  element={img}
                  isSelected={state.selectedId === img.id}
                  onSelect={() =>
                    dispatch({ type: 'SET_SELECTED', payload: img.id })
                  }
                  onDragEnd={(x, y) =>
                    dispatch({ type: 'UPDATE_IMAGE', payload: { id: img.id, x, y } })
                  }
                  onTransformEnd={(x, y, w, h) =>
                    dispatch({ type: 'UPDATE_IMAGE', payload: { id: img.id, x, y, width: w, height: h } })
                  }
                />
              ))}
            </Layer>
            <Layer>
              {state.texts.map((t) => (
                <TextElementComponent
                  key={t.id}
                  element={t}
                  isSelected={state.selectedId === t.id}
                  onSelect={() =>
                    dispatch({ type: 'SET_SELECTED', payload: t.id })
                  }
                  onDragEnd={(x, y) =>
                    dispatch({ type: 'UPDATE_TEXT', payload: { id: t.id, x, y } })
                  }
                  onTransformEnd={(x, y, w, fontSize) =>
                    dispatch({ type: 'UPDATE_TEXT', payload: { id: t.id, x, y, width: w, fontSize } })
                  }
                />
              ))}
              {state.boundingBox && <BoundingBoxOverlay box={state.boundingBox} />}
            </Layer>
          </Stage>
        </div>
        <a href="https://bigdataboutique.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 mt-4 text-slate-400 hover:text-slate-500 text-base shrink-0 transition-colors">
          <span>Built with &hearts; by</span>
          <img src={logoGreyscale} alt="BigData Boutique" className="h-8 brightness-0 opacity-40" />
        </a>
      </div>
    );
  },
);
