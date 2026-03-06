import { useState, useEffect, useCallback } from 'react';
import { FALLBACK_FONTS } from '../constants';

const WEB_FONTS_STORAGE_KEY = 'virodraw-web-fonts';

function getStoredWebFonts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WEB_FONTS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function storeWebFonts(fonts: string[]) {
  localStorage.setItem(WEB_FONTS_STORAGE_KEY, JSON.stringify(fonts));
}

export function useFonts() {
  const [systemFonts, setSystemFonts] = useState<string[]>(FALLBACK_FONTS);
  const [webFonts, setWebFonts] = useState<string[]>(getStoredWebFonts);
  const [loadingFont, setLoadingFont] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);

  // Try to enumerate local fonts via the Local Font Access API
  useEffect(() => {
    async function loadSystemFonts() {
      try {
        if ('queryLocalFonts' in window) {
          const fonts = await (window as any).queryLocalFonts();
          const familySet = new Set<string>();
          for (const font of fonts) {
            familySet.add(font.family);
          }
          const sorted = Array.from(familySet).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' }),
          );
          if (sorted.length > 0) {
            setSystemFonts(sorted);
          }
        }
      } catch {
        // Permission denied or API not available - use fallback
      }
    }
    loadSystemFonts();
  }, []);

  // Load stored web fonts on mount
  useEffect(() => {
    for (const fontName of webFonts) {
      loadGoogleFontCSS(fontName).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addWebFont = useCallback(async (fontName: string) => {
    setLoadingFont(true);
    setFontError(null);
    try {
      await loadGoogleFontCSS(fontName);
      setWebFonts((prev) => {
        if (prev.includes(fontName)) return prev;
        const next = [...prev, fontName];
        storeWebFonts(next);
        return next;
      });
    } catch {
      setFontError(`Failed to load "${fontName}" from Google Fonts`);
    } finally {
      setLoadingFont(false);
    }
  }, []);

  const allFonts = [...new Set([...webFonts, ...systemFonts])];

  return { fonts: allFonts, webFonts, addWebFont, loadingFont, fontError };
}

async function loadGoogleFontCSS(fontName: string) {
  const id = `gfont-${fontName.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;

  return new Promise<void>((resolve, reject) => {
    link.onload = () => resolve();
    link.onerror = () => {
      link.remove();
      reject(new Error('Failed to load font'));
    };
    document.head.appendChild(link);
  });
}
