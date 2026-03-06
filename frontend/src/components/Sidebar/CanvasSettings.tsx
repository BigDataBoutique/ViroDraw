import { useState, useRef, useCallback } from 'react';
import type { CanvasState, CanvasAction } from '../../types';
import { useFonts } from '../../hooks/useFonts';
import { parseConfig, applyConfig, fetchConfigYaml, stateToYaml } from '../../utils/configLoader';

interface Props {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

export function CanvasSettings({ state, dispatch }: Props) {
  const { config } = state;
  const { webFonts, addWebFont } = useFonts();
  const [configUrl, setConfigUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getYaml = useCallback(() => stateToYaml(state, webFonts), [state, webFonts]);

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(getYaml());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const textarea = document.createElement('textarea');
      textarea.value = getYaml();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadYaml = () => {
    const blob = new Blob([getYaml()], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'virodraw-config.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const doApply = async (yamlStr: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const parsed = parseConfig(yamlStr);
      const warnings = await applyConfig(parsed, dispatch, addWebFont);
      if (warnings.length > 0) {
        setStatus({ type: 'success', message: `Applied with ${warnings.length} warning(s): ${warnings.join('; ')}` });
      } else {
        setStatus({ type: 'success', message: 'Configuration applied successfully' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: e instanceof Error ? e.message : 'Failed to parse configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleUrlLoad = async () => {
    if (!configUrl.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const yamlStr = await fetchConfigYaml(configUrl.trim());
      await doApply(yamlStr);
    } catch (e) {
      setStatus({ type: 'error', message: e instanceof Error ? e.message : 'Failed to fetch configuration' });
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await doApply(text);
    } catch (e2) {
      setStatus({ type: 'error', message: e2 instanceof Error ? e2.message : 'Failed to read file' });
    }
    // Reset so the same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Canvas dimensions */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Canvas Size</p>
        <div className="flex gap-2 items-end">
          <label className="flex-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">W</span>
            <input
              type="number"
              value={config.width}
              onChange={(e) =>
                dispatch({
                  type: 'SET_CONFIG',
                  payload: { ...config, width: Number(e.target.value) || 100 },
                })
              }
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 outline-none transition-colors"
            />
          </label>
          <span className="text-slate-300 text-sm pb-1">&times;</span>
          <label className="flex-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">H</span>
            <input
              type="number"
              value={config.height}
              onChange={(e) =>
                dispatch({
                  type: 'SET_CONFIG',
                  payload: { ...config, height: Number(e.target.value) || 100 },
                })
              }
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 outline-none transition-colors"
            />
          </label>
          <span className="text-[11px] text-slate-400 pb-1.5">px</span>
        </div>
      </div>

      {/* Load Configuration */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Load Configuration</p>

        {/* URL input */}
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="Config URL (.yaml)"
            value={configUrl}
            onChange={(e) => setConfigUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
            disabled={loading}
            className="flex-1 min-w-0 border border-slate-200 rounded-md px-2.5 py-1.5 text-sm bg-white placeholder:text-slate-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 outline-none transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleUrlLoad}
            disabled={loading || !configUrl.trim()}
            className="px-3 py-1.5 bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            Load
          </button>
        </div>

        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors disabled:opacity-50"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Upload YAML file
        </button>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-indigo-500">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            Applying configuration...
          </div>
        )}

        {/* Status message */}
        {status && (
          <p className={`text-xs ${status.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
            {status.message}
          </p>
        )}
      </div>

      {/* Save Configuration */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Save Configuration</p>
        <div className="flex gap-2">
          <button
            onClick={handleCopyYaml}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
                Copy YAML
              </>
            )}
          </button>
          <button
            onClick={handleDownloadYaml}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
