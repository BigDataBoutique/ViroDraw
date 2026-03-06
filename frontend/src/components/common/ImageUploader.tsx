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
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Image URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={() => { if (url.trim()) onLoad(url.trim()); }}
          disabled={loading || !url.trim()}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Load
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
        >
          Choose File
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
        {loading && <span className="text-sm text-gray-500">Loading...</span>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
