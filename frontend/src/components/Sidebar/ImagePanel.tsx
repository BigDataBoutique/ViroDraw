import { useState, useEffect, useCallback } from 'react';
import type { CanvasState, CanvasAction } from '../../types';
import { useImageLoader } from '../../hooks/useImageLoader';
import { ImageUploader } from '../common/ImageUploader';
import { logoPosition } from '../../utils/autoLayout';
import { getStoredImages, persistImage, removeStoredImage, onLibraryChange, type StoredImage } from '../../utils/imageLibrary';
import { ImageActions } from './ImageActions';

interface Props {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

export function ImagePanel({ state, dispatch }: Props) {
  const { loadImage, loading, error } = useImageLoader();
  const [storedImgs, setStoredImgs] = useState<StoredImage[]>([]);
  const [dragOverGallery, setDragOverGallery] = useState(false);

  const refreshGallery = useCallback(() => {
    setStoredImgs(getStoredImages());
  }, []);

  useEffect(() => {
    refreshGallery();
    return onLibraryChange(refreshGallery);
  }, [refreshGallery]);

  const addImageToCanvas = useCallback((img: HTMLImageElement) => {
    const maxDim = 200;
    const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    const pos = logoPosition(state.images.length, state.config.width, w);
    const id = `img-${Date.now()}`;
    dispatch({
      type: 'ADD_IMAGE',
      payload: { id, src: img.src, image: img, width: w, height: h, ...pos },
    });
  }, [state.images.length, state.config.width, dispatch]);

  const handleLoad = async (source: string | File) => {
    try {
      const img = await loadImage(source);
      addImageToCanvas(img);
      persistImage(img);
      refreshGallery();
    } catch { /* handled by useImageLoader */ }
  };

  const handleStoredSelect = (stored: StoredImage) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => addImageToCanvas(img);
    img.src = stored.dataUrl;
  };

  const handleRemoveStored = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeStoredImage(index);
    setStoredImgs(updated);
  };

  // Drop on gallery — add to library only
  const handleGalleryDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverGallery(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    for (const file of files) {
      try {
        const img = await loadImage(file);
        persistImage(img);
      } catch { /* ignore */ }
    }
    refreshGallery();
  };

  return (
    <div className="space-y-4">
      <ImageUploader label="Add image" onLoad={handleLoad} loading={loading} error={error} />

      {/* Active images on canvas */}
      {state.images.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">On Canvas</p>
          {state.images.map((img) => (
            <div
              key={img.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                state.selectedId === img.id
                  ? 'bg-indigo-50 ring-1 ring-indigo-200'
                  : 'hover:bg-slate-100'
              }`}
              onClick={() => dispatch({ type: 'SET_SELECTED', payload: img.id })}
            >
              <img
                src={img.src}
                alt=""
                className="w-8 h-8 object-contain rounded border border-slate-200 bg-white"
              />
              <span className="text-sm text-slate-600 truncate flex-1">
                {Math.round(img.width)}&times;{Math.round(img.height)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'REMOVE_IMAGE', payload: img.id });
                }}
                className="text-rose-400 hover:text-rose-600 transition-colors"
                title="Remove from canvas"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions for selected image */}
      {state.selectedId && state.images.some(img => img.id === state.selectedId) && (
        <ImageActions state={state} dispatch={dispatch} />
      )}

      {/* Stored image library — also a drop zone */}
      <div
        className="space-y-2"
        onDragOver={(e) => { e.preventDefault(); setDragOverGallery(true); }}
        onDragLeave={() => setDragOverGallery(false)}
        onDrop={handleGalleryDrop}
      >
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Library</p>
        {storedImgs.length > 0 ? (
          <div className={`grid grid-cols-4 gap-1.5 rounded-lg p-1 transition-colors ${dragOverGallery ? 'bg-indigo-50 ring-2 ring-indigo-300 ring-dashed' : ''}`}>
            {storedImgs.map((si, i) => (
              <div
                key={si.timestamp}
                className="relative group cursor-pointer"
                onClick={() => handleStoredSelect(si)}
              >
                <div className="aspect-square rounded-md border border-slate-200 hover:border-indigo-400 transition-colors bg-white flex items-center justify-center overflow-hidden p-1">
                  <img
                    src={si.thumbnail}
                    alt="Stored image"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <button
                  onClick={(e) => handleRemoveStored(i, e)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] leading-none hidden group-hover:flex items-center justify-center shadow-sm"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={`flex items-center justify-center border-2 border-dashed rounded-lg py-6 text-xs text-slate-400 transition-colors ${dragOverGallery ? 'border-indigo-300 bg-indigo-50 text-indigo-500' : 'border-slate-200'}`}>
            Drop images here to add to library
          </div>
        )}
      </div>
    </div>
  );
}
