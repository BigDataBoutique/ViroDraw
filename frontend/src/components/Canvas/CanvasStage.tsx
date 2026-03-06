import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import type { CanvasState, CanvasAction } from '../../types';
import { BackgroundLayer } from './BackgroundLayer';
import { ImageElementComponent } from './ImageElement';
import { TextElementComponent } from './TextElement';
import { BoundingBoxOverlay } from './BoundingBox';

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

    useImperativeHandle(ref, () => ({
      toBlob: (mimeType: string) => {
        return new Promise<Blob>((resolve, reject) => {
          if (!stageRef.current) return reject(new Error('No stage'));
          stageRef.current.toBlob({
            mimeType,
            pixelRatio: 1,
            callback: (blob: Blob | null) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to export canvas'));
            },
          });
        });
      },
    }));

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (e.target === e.target.getStage()) {
        dispatch({ type: 'SET_SELECTED', payload: null });
      }
    };

    const { width, height } = state.config;

    return (
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-gray-100 overflow-hidden p-4"
      >
        <div
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
                />
              ))}
              {state.boundingBox && <BoundingBoxOverlay box={state.boundingBox} />}
            </Layer>
          </Stage>
        </div>
      </div>
    );
  },
);
