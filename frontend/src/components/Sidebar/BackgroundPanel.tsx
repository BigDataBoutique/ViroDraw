import { useState, useEffect } from 'react';
import type { CanvasConfig, CanvasAction } from '../../types';
import { useImageLoader } from '../../hooks/useImageLoader';
import { ImageUploader } from '../common/ImageUploader';
import { coverScale } from '../../utils/autoLayout';

const BG_STORAGE_KEY = 'virodraw-backgrounds';
const MAX_STORED_BACKGROUNDS = 20;

interface StoredBackground {
  dataUrl: string;
  thumbnail: string;
  timestamp: number;
}

function getStoredBackgrounds(): StoredBackground[] {
  try {
    return JSON.parse(localStorage.getItem(BG_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function storeBackground(dataUrl: string, thumbnail: string) {
  const stored = getStoredBackgrounds();
  if (stored.some((s) => s.thumbnail === thumbnail)) return;
  stored.unshift({ dataUrl, thumbnail, timestamp: Date.now() });
  if (stored.length > MAX_STORED_BACKGROUNDS) stored.pop();
  try {
    localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    stored.pop();
    try {
      localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(stored));
    } catch { /* give up */ }
  }
}

function createThumbnail(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const maxDim = 80;
  const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight);
  canvas.width = img.naturalWidth * ratio;
  canvas.height = img.naturalHeight * ratio;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.6);
}

function imgToDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

interface Props {
  config: CanvasConfig;
  dispatch: React.Dispatch<CanvasAction>;
}

export function BackgroundPanel({ config, dispatch }: Props) {
  const { loadImage, loading, error } = useImageLoader();
  const [storedBgs, setStoredBgs] = useState<StoredBackground[]>([]);

  useEffect(() => {
    setStoredBgs(getStoredBackgrounds());
  }, []);

  const applyBackground = (img: HTMLImageElement, dataUrl?: string) => {
    const scaled = coverScale(img.naturalWidth, img.naturalHeight, config.width, config.height);
    dispatch({
      type: 'SET_BACKGROUND',
      payload: { id: 'background', src: img.src, image: img, ...scaled },
    });
    const thumbnail = createThumbnail(img);
    const fullDataUrl = dataUrl || imgToDataUrl(img);
    storeBackground(fullDataUrl, thumbnail);
    setStoredBgs(getStoredBackgrounds());
  };

  const handleLoad = async (source: string | File) => {
    try {
      const img = await loadImage(source);
      applyBackground(img);
    } catch { /* handled by useImageLoader */ }
  };

  const handleStoredSelect = (bg: StoredBackground) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => applyBackground(img, bg.dataUrl);
    img.src = bg.dataUrl;
  };

  const removeStoredBg = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = getStoredBackgrounds();
    stored.splice(index, 1);
    localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(stored));
    setStoredBgs(stored);
  };

  return (
    <div className="space-y-4">
      <ImageUploader label="Add background" onLoad={handleLoad} loading={loading} error={error} />

      <button
        onClick={() => dispatch({ type: 'SET_BACKGROUND', payload: null })}
        className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
        </svg>
        Clear background
      </button>

      {storedBgs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Recent</p>
          <div className="grid grid-cols-4 gap-1.5">
            {storedBgs.map((bg, i) => (
              <div
                key={bg.timestamp}
                className="relative group cursor-pointer aspect-square"
                onClick={() => handleStoredSelect(bg)}
              >
                <img
                  src={bg.thumbnail}
                  alt="Background"
                  className="w-full h-full object-cover rounded-md border border-slate-200 hover:border-indigo-400 transition-colors"
                />
                <button
                  onClick={(e) => removeStoredBg(i, e)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] leading-none hidden group-hover:flex items-center justify-center shadow-sm"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
