import type { CanvasState, CanvasAction } from '../../types';
import { useImageLoader } from '../../hooks/useImageLoader';
import { ImageUploader } from '../common/ImageUploader';
import { logoPosition } from '../../utils/autoLayout';

interface Props {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

export function ImagePanel({ state, dispatch }: Props) {
  const { loadImage, loading, error } = useImageLoader();

  const handleLoad = async (source: string | File) => {
    try {
      const img = await loadImage(source);
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
    } catch {
      // error is handled by useImageLoader
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Images / Logos</h3>
      <ImageUploader label="Add image" onLoad={handleLoad} loading={loading} error={error} />
      {state.images.length > 0 && (
        <div className="space-y-1">
          {state.images.map((img) => (
            <div key={img.id} className="flex items-center justify-between text-sm">
              <span className="truncate flex-1">{img.id}</span>
              <button
                onClick={() => dispatch({ type: 'REMOVE_IMAGE', payload: img.id })}
                className="text-red-500 hover:underline text-xs ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
