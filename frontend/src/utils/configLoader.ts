import yaml from 'js-yaml';
import type { CanvasAction, CanvasState, TextElement, ExportFormat } from '../types';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../constants';
import { coverScale, logoPosition } from './autoLayout';
import { proxyImage } from './api';
import { persistImage as persistImageToLibrary } from './imageLibrary';

interface ConfigYaml {
  canvas?: { width?: number; height?: number };
  background?: { color?: string; image?: string };
  text?: {
    defaults?: {
      fontFamily?: string;
      fontSize?: number;
      fontStyle?: string;
      fill?: string;
      align?: string;
    };
    elements?: Array<{
      text?: string;
      fontSize?: number;
      fontFamily?: string;
      fontStyle?: string;
      fill?: string;
      align?: string;
      x?: number;
      y?: number;
      width?: number;
    }>;
  };
  fonts?: { web?: string[] };
  images?: {
    library?: Array<{ url?: string; label?: string }>;
    elements?: Array<{
      url?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }>;
  };
  export?: { format?: string };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

async function loadImageWithFallback(url: string): Promise<HTMLImageElement> {
  try {
    const img = await loadImageElement(url);
    // Test for CORS taint
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    const ctx = testCanvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, 1, 1);
    ctx.getImageData(0, 0, 1, 1);
    return img;
  } catch {
    // Fall back to proxy
    const objectUrl = await proxyImage(url);
    return loadImageElement(objectUrl);
  }
}

export function parseConfig(yamlStr: string): ConfigYaml {
  return (yaml.load(yamlStr) as ConfigYaml) || {};
}

export async function applyConfig(
  config: ConfigYaml,
  dispatch: React.Dispatch<CanvasAction>,
  addWebFont: (name: string) => Promise<void>,
): Promise<string[]> {
  const warnings: string[] = [];

  // Canvas size
  const canvasWidth = config.canvas?.width || DEFAULT_WIDTH;
  const canvasHeight = config.canvas?.height || DEFAULT_HEIGHT;
  try {
    dispatch({
      type: 'SET_CONFIG',
      payload: {
        width: Math.max(100, canvasWidth),
        height: Math.max(100, canvasHeight),
      },
    });
  } catch {
    warnings.push('Failed to set canvas size');
  }

  // Export format
  if (config.export?.format) {
    const fmt = config.export.format.toLowerCase();
    if (['webp', 'png', 'jpg'].includes(fmt)) {
      dispatch({ type: 'SET_EXPORT_FORMAT', payload: fmt as ExportFormat });
    }
  }

  // Load web fonts
  if (config.fonts?.web) {
    for (const fontName of config.fonts.web) {
      try {
        await addWebFont(fontName);
      } catch {
        warnings.push(`Failed to load font: ${fontName}`);
      }
    }
  }

  // Also load fonts referenced in text defaults/elements
  const referencedFonts = new Set<string>();
  if (config.text?.defaults?.fontFamily) referencedFonts.add(config.text.defaults.fontFamily);
  if (config.text?.elements) {
    for (const el of config.text.elements) {
      if (el.fontFamily) referencedFonts.add(el.fontFamily);
    }
  }
  for (const fontName of referencedFonts) {
    try {
      await addWebFont(fontName);
    } catch {
      // May be a system font - that's fine
    }
  }

  // Background
  if (config.background?.image) {
    try {
      const img = await loadImageWithFallback(config.background.image);
      const scaled = coverScale(img.naturalWidth, img.naturalHeight, canvasWidth, canvasHeight);
      dispatch({
        type: 'SET_BACKGROUND',
        payload: { id: 'background', src: img.src, image: img, ...scaled },
      });
    } catch {
      warnings.push('Failed to load background image');
    }
  }

  // Text elements
  if (config.text?.elements) {
    const defaults = config.text.defaults || {};
    for (const el of config.text.elements) {
      try {
        const text = el.text || 'Text';
        const fontSize = el.fontSize || defaults.fontSize || 48;
        const textWidth = el.width || canvasWidth * 0.8;
        const textEl: TextElement = {
          id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text,
          fontSize,
          fontFamily: el.fontFamily || defaults.fontFamily || 'Inter',
          fontStyle: el.fontStyle || defaults.fontStyle || 'normal',
          fill: el.fill || defaults.fill || '#000000',
          align: el.align || defaults.align || 'center',
          width: textWidth,
          x: el.x ?? (canvasWidth - textWidth) / 2,
          y: el.y ?? canvasHeight / 3,
        };
        dispatch({ type: 'ADD_TEXT', payload: textEl });
      } catch {
        warnings.push('Failed to add a text element');
      }
    }
  }

  // Images on canvas
  if (config.images?.elements) {
    for (let i = 0; i < config.images.elements.length; i++) {
      const el = config.images.elements[i];
      if (!el.url) continue;
      try {
        const img = await loadImageWithFallback(el.url);
        const maxDim = 200;
        const defaultRatio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
        const w = el.width || img.naturalWidth * defaultRatio;
        const h = el.height || img.naturalHeight * defaultRatio;
        const pos = (el.x != null && el.y != null)
          ? { x: el.x, y: el.y }
          : logoPosition(i, canvasWidth, w);
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
      } catch {
        warnings.push(`Failed to load image: ${el.url}`);
      }
    }
  }

  // Images for library (just preload into localStorage)
  if (config.images?.library) {
    for (const item of config.images.library) {
      if (!item.url) continue;
      try {
        const img = await loadImageWithFallback(item.url);
        persistImageToLibrary(img);
      } catch {
        warnings.push(`Failed to preload library image: ${item.url}`);
      }
    }
  }

  return warnings;
}

export async function fetchConfigYaml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch config: ${response.status}`);
  return response.text();
}

export function stateToYaml(state: CanvasState, webFonts: string[]): string {
  const obj: Record<string, unknown> = {};

  obj.canvas = { width: state.config.width, height: state.config.height };

  if (state.backgroundImage) {
    const src = state.backgroundImage.src;
    // Only include URL-based backgrounds (not data URLs which are too large)
    if (src && !src.startsWith('data:')) {
      obj.background = { image: src };
    }
  }

  if (state.exportFormat !== 'webp') {
    obj.export = { format: state.exportFormat };
  }

  if (webFonts.length > 0) {
    obj.fonts = { web: webFonts };
  }

  if (state.texts.length > 0) {
    obj.text = {
      elements: state.texts.map((t) => {
        const el: Record<string, unknown> = { text: t.text };
        el.fontSize = t.fontSize;
        el.fontFamily = t.fontFamily;
        if (t.fontStyle !== 'normal') el.fontStyle = t.fontStyle;
        el.fill = t.fill;
        if (t.align !== 'center') el.align = t.align;
        el.x = Math.round(t.x);
        el.y = Math.round(t.y);
        el.width = Math.round(t.width);
        return el;
      }),
    };
  }

  if (state.images.length > 0) {
    const elements = state.images
      .filter((img) => img.src && !img.src.startsWith('data:'))
      .map((img) => ({
        url: img.src,
        x: Math.round(img.x),
        y: Math.round(img.y),
        width: Math.round(img.width),
        height: Math.round(img.height),
      }));
    if (elements.length > 0) {
      obj.images = { elements };
    }
  }

  return yaml.dump(obj, { lineWidth: 120, noRefs: true });
}
