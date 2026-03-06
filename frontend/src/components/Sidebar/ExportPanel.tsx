import { useState } from 'react';
import type { CanvasAction, ExportFormat } from '../../types';
import type { CanvasStageHandle } from '../Canvas/CanvasStage';
import { saveImage } from '../../utils/api';

interface Props {
  exportFormat: ExportFormat;
  dispatch: React.Dispatch<CanvasAction>;
  stageRef: React.RefObject<CanvasStageHandle | null>;
}

const MIME_TYPES: Record<ExportFormat, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
};

export function ExportPanel({ exportFormat, dispatch, stageRef }: Props) {
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!stageRef.current) return;
    setExporting(true);
    setSavedPath(null);

    try {
      const mimeType = MIME_TYPES[exportFormat];
      const blob = await stageRef.current.toBlob(mimeType);

      // Browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hero.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      // Save to disk via backend
      try {
        const path = await saveImage(blob, exportFormat);
        setSavedPath(path);
      } catch {
        // Save to disk is optional - don't block on it
      }
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Export</h3>
      <div className="flex gap-2">
        {(['webp', 'png', 'jpg'] as ExportFormat[]).map((fmt) => (
          <button
            key={fmt}
            onClick={() => dispatch({ type: 'SET_EXPORT_FORMAT', payload: fmt })}
            className={`px-3 py-1 rounded text-sm ${
              exportFormat === fmt
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {fmt.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {exporting ? 'Exporting...' : 'Download'}
      </button>
      {savedPath && (
        <p className="text-xs text-gray-600 break-all">
          Saved to: <span className="font-mono">{savedPath}</span>
        </p>
      )}
    </div>
  );
}
