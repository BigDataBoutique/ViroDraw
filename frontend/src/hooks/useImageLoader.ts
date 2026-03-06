import { useState, useCallback } from 'react';
import { proxyImage } from '../utils/api';

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export function useImageLoader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImage = useCallback(
    async (source: string | File): Promise<HTMLImageElement> => {
      setLoading(true);
      setError(null);

      try {
        if (source instanceof File) {
          const objectUrl = URL.createObjectURL(source);
          const img = await loadImageElement(objectUrl);
          setLoading(false);
          return img;
        }

        // Try loading directly first (works for same-origin and CORS-enabled URLs)
        try {
          const img = await loadImageElement(source);
          // Verify the image isn't tainted by drawing to a test canvas
          const testCanvas = document.createElement('canvas');
          testCanvas.width = 1;
          testCanvas.height = 1;
          const ctx = testCanvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, 1, 1);
          ctx.getImageData(0, 0, 1, 1); // Throws if tainted
          setLoading(false);
          return img;
        } catch {
          // Direct load failed or canvas tainted - fall back to proxy
        }

        const objectUrl = await proxyImage(source);
        const img = await loadImageElement(objectUrl);
        setLoading(false);
        return img;
      } catch (e) {
        setLoading(false);
        const msg = e instanceof Error ? e.message : 'Failed to load image';
        setError(msg);
        throw e;
      }
    },
    [],
  );

  return { loadImage, loading, error };
}
