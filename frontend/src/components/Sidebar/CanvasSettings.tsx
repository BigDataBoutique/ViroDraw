import type { CanvasConfig, CanvasAction } from '../../types';

interface Props {
  config: CanvasConfig;
  dispatch: React.Dispatch<CanvasAction>;
}

export function CanvasSettings({ config, dispatch }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Canvas Size</h3>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="text-xs text-gray-500">Width</span>
          <input
            type="number"
            value={config.width}
            onChange={(e) =>
              dispatch({
                type: 'SET_CONFIG',
                payload: { ...config, width: Number(e.target.value) || 100 },
              })
            }
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </label>
        <label className="flex-1">
          <span className="text-xs text-gray-500">Height</span>
          <input
            type="number"
            value={config.height}
            onChange={(e) =>
              dispatch({
                type: 'SET_CONFIG',
                payload: { ...config, height: Number(e.target.value) || 100 },
              })
            }
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </label>
      </div>
    </div>
  );
}
