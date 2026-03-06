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

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hero.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      try {
        const path = await saveImage(blob, exportFormat);
        setSavedPath(path);
      } catch { /* optional */ }
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Format</p>
        <div className="flex gap-0.5 bg-slate-100 rounded-md p-0.5">
          {(['webp', 'png', 'jpg'] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => dispatch({ type: 'SET_EXPORT_FORMAT', payload: fmt })}
              className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                exportFormat === fmt
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full px-3 py-2.5 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
        </svg>
        {exporting ? 'Exporting...' : 'Download'}
      </button>

      {savedPath && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          <p className="text-xs text-emerald-700 break-all">
            Saved to: <span className="font-mono">{savedPath}</span>
          </p>
        </div>
      )}
    </div>
  );
}
