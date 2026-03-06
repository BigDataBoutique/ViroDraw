import { useState, useCallback } from 'react';
import { proxyImage } from '../utils/api';

export function useImageLoader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImage = useCallback(
    (source: string | File): Promise<HTMLImageElement> => {
      setLoading(true);
      setError(null);

      return new Promise(async (resolve, reject) => {
        try {
          let objectUrl: string;

          if (source instanceof File) {
            objectUrl = URL.createObjectURL(source);
          } else {
            objectUrl = await proxyImage(source);
          }

          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            setLoading(false);
            resolve(img);
          };
          img.onerror = () => {
            setLoading(false);
            const err = 'Failed to load image';
            setError(err);
            reject(new Error(err));
          };
          img.src = objectUrl;
        } catch (e) {
          setLoading(false);
          const msg = e instanceof Error ? e.message : 'Failed to load image';
          setError(msg);
          reject(e);
        }
      });
    },
    [],
  );

  return { loadImage, loading, error };
}
