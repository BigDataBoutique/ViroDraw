import type { CanvasConfig, CanvasAction } from '../../types';
import { useImageLoader } from '../../hooks/useImageLoader';
import { ImageUploader } from '../common/ImageUploader';
import { coverScale } from '../../utils/autoLayout';

interface Props {
  config: CanvasConfig;
  dispatch: React.Dispatch<CanvasAction>;
}

export function BackgroundPanel({ config, dispatch }: Props) {
  const { loadImage, loading, error } = useImageLoader();

  const handleLoad = async (source: string | File) => {
    try {
      const img = await loadImage(source);
      const scaled = coverScale(img.naturalWidth, img.naturalHeight, config.width, config.height);
      dispatch({
        type: 'SET_BACKGROUND',
        payload: {
          id: 'background',
          src: img.src,
          image: img,
          ...scaled,
        },
      });
    } catch {
      // error is handled by useImageLoader
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Background Image</h3>
      <ImageUploader label="" onLoad={handleLoad} loading={loading} error={error} />
      <button
        onClick={() => dispatch({ type: 'SET_BACKGROUND', payload: null })}
        className="text-xs text-red-500 hover:underline"
      >
        Clear Background
      </button>
    </div>
  );
}
