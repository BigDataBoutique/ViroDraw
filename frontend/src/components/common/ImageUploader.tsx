import { useState, useRef } from 'react';

interface Props {
  label: string;
  onLoad: (source: string | File) => void;
  loading?: boolean;
  error?: string | null;
}

export function ImageUploader({ label, onLoad, loading, error }: Props) {
  const [url, setUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      {label && <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>}
      <div className="flex gap-1.5">
        <input
          type="text"
          placeholder="Paste image URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url.trim()) {
              onLoad(url.trim());
              setUrl('');
            }
          }}
          className="flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 outline-none transition-colors"
        />
        <button
          onClick={() => { if (url.trim()) { onLoad(url.trim()); setUrl(''); } }}
          disabled={loading || !url.trim()}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Go
        </button>
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-md text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 disabled:opacity-40 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
        </svg>
        {loading ? 'Loading...' : 'Upload file'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onLoad(file);
        }}
      />
      {error && (
        <p className="text-xs text-rose-500 bg-rose-50 border border-rose-200 rounded-md px-2 py-1">{error}</p>
      )}
    </div>
  );
}
