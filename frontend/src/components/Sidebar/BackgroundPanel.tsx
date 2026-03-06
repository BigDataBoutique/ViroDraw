import { useState, useEffect } from 'react';
import type { CanvasConfig, CanvasAction, BackgroundGradient, ImageElement } from '../../types';
import { useImageLoader } from '../../hooks/useImageLoader';
import { ImageUploader } from '../common/ImageUploader';
import { coverScale } from '../../utils/autoLayout';
import { Section, SliderRow, ColorInput } from './shared';

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

type BgMode = 'color' | 'gradient' | 'image';

const PRESET_COLORS = [
  '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0',
  '#1E293B', '#0F172A', '#020617', '#000000',
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
];

const PRESET_GRADIENTS: BackgroundGradient[] = [
  { type: 'linear', angle: 135, colorStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] },
  { type: 'linear', angle: 135, colorStops: [{ offset: 0, color: '#f093fb' }, { offset: 1, color: '#f5576c' }] },
  { type: 'linear', angle: 135, colorStops: [{ offset: 0, color: '#4facfe' }, { offset: 1, color: '#00f2fe' }] },
  { type: 'linear', angle: 135, colorStops: [{ offset: 0, color: '#43e97b' }, { offset: 1, color: '#38f9d7' }] },
  { type: 'linear', angle: 135, colorStops: [{ offset: 0, color: '#fa709a' }, { offset: 1, color: '#fee140' }] },
  { type: 'linear', angle: 135, colorStops: [{ offset: 0, color: '#a18cd1' }, { offset: 1, color: '#fbc2eb' }] },
  { type: 'linear', angle: 135, colorStops: [{ offset: 0, color: '#fccb90' }, { offset: 1, color: '#d57eeb' }] },
  { type: 'linear', angle: 135, colorStops: [{ offset: 0, color: '#0c3483' }, { offset: 1, color: '#a2b6df' }] },
  { type: 'radial', angle: 0, colorStops: [{ offset: 0, color: '#ffecd2' }, { offset: 1, color: '#fcb69f' }] },
  { type: 'radial', angle: 0, colorStops: [{ offset: 0, color: '#a1c4fd' }, { offset: 1, color: '#c2e9fb' }] },
  { type: 'radial', angle: 0, colorStops: [{ offset: 0, color: '#fddb92' }, { offset: 1, color: '#d1fdff' }] },
  { type: 'radial', angle: 0, colorStops: [{ offset: 0, color: '#e0c3fc' }, { offset: 1, color: '#8ec5fc' }] },
];

function gradientToCss(g: BackgroundGradient): string {
  const stops = g.colorStops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
  return g.type === 'linear'
    ? `linear-gradient(${g.angle}deg, ${stops})`
    : `radial-gradient(circle, ${stops})`;
}

interface Props {
  config: CanvasConfig;
  backgroundColor: string;
  backgroundGradient: BackgroundGradient | null;
  backgroundImage: ImageElement | null;
  dispatch: React.Dispatch<CanvasAction>;
}

export function BackgroundPanel({ config, backgroundColor, backgroundGradient, backgroundImage, dispatch }: Props) {
  const { loadImage, loading, error } = useImageLoader();
  const [storedBgs, setStoredBgs] = useState<StoredBackground[]>([]);
  const [mode, setMode] = useState<BgMode>('color');
  const [gradient, setGradient] = useState<BackgroundGradient>(
    backgroundGradient ?? { type: 'linear', angle: 135, colorStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] }
  );

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
      setMode('image');
    } catch { /* handled by useImageLoader */ }
  };

  const handleStoredSelect = (bg: StoredBackground) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => applyBackground(img, bg.dataUrl);
    img.src = bg.dataUrl;
    setMode('image');
  };

  const removeStoredBg = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = getStoredBackgrounds();
    stored.splice(index, 1);
    localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(stored));
    setStoredBgs(stored);
  };

  const updateGradient = (g: BackgroundGradient) => {
    setGradient(g);
    dispatch({ type: 'SET_BACKGROUND_GRADIENT', payload: g });
  };

  const tabClass = (t: BgMode) =>
    `flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
      mode === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`;

  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
        <button className={tabClass('color')} onClick={() => { setMode('color'); dispatch({ type: 'SET_BACKGROUND_COLOR', payload: backgroundColor }); }}>
          Color
        </button>
        <button className={tabClass('gradient')} onClick={() => setMode('gradient')}>
          Gradient
        </button>
        <button className={tabClass('image')} onClick={() => setMode('image')}>
          Image
        </button>
      </div>

      {mode === 'color' && (
        <div className="space-y-3">
          <Section title="Pick a color">
            <div className="flex items-center gap-2">
              <ColorInput value={backgroundColor} onChange={(v) => dispatch({ type: 'SET_BACKGROUND_COLOR', payload: v })} />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) dispatch({ type: 'SET_BACKGROUND_COLOR', payload: v });
                }}
                className="w-20 text-xs font-mono px-2 py-1 border border-slate-200 rounded"
              />
            </div>
          </Section>
          <Section title="Presets">
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => dispatch({ type: 'SET_BACKGROUND_COLOR', payload: c })}
                  className={`w-full aspect-square rounded-md border cursor-pointer transition-all ${
                    backgroundColor === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Section>
        </div>
      )}

      {mode === 'gradient' && (
        <div className="space-y-3">
          <Section title="No gradient">
            <button
              onClick={() => dispatch({ type: 'SET_BACKGROUND_GRADIENT', payload: null })}
              className={`w-8 h-8 rounded-md border cursor-pointer transition-all relative overflow-hidden ${
                !backgroundGradient ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-400'
              }`}
              style={{ background: '#fff' }}
              title="No gradient"
            >
              <svg viewBox="0 0 32 32" className="absolute inset-0 w-full h-full">
                <line x1="2" y1="30" x2="30" y2="2" stroke="#ef4444" strokeWidth="2" />
              </svg>
            </button>
          </Section>
          <Section title="Gradient colors">
            <div className="space-y-2">
              {gradient.colorStops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ColorInput value={stop.color} onChange={(v) => {
                    const stops = [...gradient.colorStops];
                    stops[i] = { ...stops[i], color: v };
                    updateGradient({ ...gradient, colorStops: stops });
                  }} />
                  <span className="text-xs text-slate-400 w-12">Stop {i + 1}</span>
                  {gradient.colorStops.length > 2 && (
                    <button
                      onClick={() => {
                        const stops = gradient.colorStops.filter((_, j) => j !== i);
                        updateGradient({ ...gradient, colorStops: stops });
                      }}
                      className="text-slate-400 hover:text-rose-500 text-xs cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              {gradient.colorStops.length < 5 && (
                <button
                  onClick={() => {
                    const stops = [...gradient.colorStops, { offset: 1, color: '#ffffff' }];
                    // redistribute offsets evenly
                    stops.forEach((s, i) => { s.offset = i / (stops.length - 1); });
                    updateGradient({ ...gradient, colorStops: stops });
                  }}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium cursor-pointer"
                >
                  + Add color stop
                </button>
              )}
            </div>
          </Section>
          <Section title="Type">
            <div className="flex gap-2">
              {(['linear', 'radial'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateGradient({ ...gradient, type: t })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
                    gradient.type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </Section>
          {gradient.type === 'linear' && (
            <SliderRow label="Angle" value={gradient.angle} min={0} max={360} step={1} unit="°"
              onChange={(v) => updateGradient({ ...gradient, angle: v })} />
          )}
          <Section title="Presets">
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => updateGradient(g)}
                  className="w-full aspect-square rounded-md border border-slate-200 hover:border-indigo-400 cursor-pointer transition-colors"
                  style={{ background: gradientToCss(g) }}
                />
              ))}
            </div>
          </Section>
        </div>
      )}

      {mode === 'image' && (
        <div className="space-y-4">
          <ImageUploader label="Add background" onLoad={handleLoad} loading={loading} error={error} />

          <button
            onClick={() => dispatch({ type: 'SET_BACKGROUND', payload: null })}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
            </svg>
            Clear background image
          </button>

          {backgroundImage && (
            <Section title="Transform">
              <SliderRow label="Rotation" value={backgroundImage.style?.rotation ?? 0} min={0} max={360} step={1} unit="°"
                onChange={(v) => dispatch({ type: 'UPDATE_BACKGROUND_STYLE', payload: { rotation: v } })} />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => dispatch({ type: 'UPDATE_BACKGROUND_STYLE', payload: { flipX: !(backgroundImage.style?.flipX ?? false) } })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
                    backgroundImage.style?.flipX ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  Flip H
                </button>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_BACKGROUND_STYLE', payload: { flipY: !(backgroundImage.style?.flipY ?? false) } })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
                    backgroundImage.style?.flipY ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  Flip V
                </button>
              </div>
            </Section>
          )}

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
      )}
    </div>
  );
}
