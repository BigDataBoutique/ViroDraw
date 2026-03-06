import { useState, useRef, useEffect, useMemo } from 'react';
import type { CanvasState, CanvasAction } from '../../types';
import { COLORS } from '../../constants';
import { calcFontSize, centerTextPosition } from '../../utils/autoLayout';
import { useFonts } from '../../hooks/useFonts';

const ALIGNS = ['left', 'center', 'right'] as const;

const ALIGN_ICONS: Record<string, React.ReactNode> = {
  left: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h9.5a.75.75 0 010 1.5h-9.5A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  ),
  center: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm3 5a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 9.75zm-3 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm5 5a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5A.75.75 0 017 9.75zm-5 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  ),
};

function AlignButtons({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-0.5 bg-slate-100 rounded-md p-0.5">
      {ALIGNS.map((a) => (
        <button
          key={a}
          onClick={() => onChange(a)}
          title={`Align ${a}`}
          className={`flex-1 flex items-center justify-center py-1.5 rounded transition-all ${
            value === a
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {ALIGN_ICONS[a]}
        </button>
      ))}
    </div>
  );
}

const TOP_FONTS = ['Inter', 'Montserrat', 'Playfair Display', 'Roboto', 'Poppins'];

interface FontGroup {
  label: string;
  fonts: string[];
}

function FontSelect({ value, onChange, fonts, webFonts, onEnsureLoaded }: {
  value: string;
  onChange: (v: string) => void;
  fonts: string[];
  webFonts: string[];
  onEnsureLoaded?: (fontName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (fontName: string) => {
    onChange(fontName);
    if (TOP_FONTS.includes(fontName) && !fonts.includes(fontName) && !webFonts.includes(fontName) && onEnsureLoaded) {
      onEnsureLoaded(fontName);
    }
    setQuery('');
    setOpen(false);
    setHighlightIndex(-1);
  };

  const extraWebFonts = webFonts.filter((f) => !TOP_FONTS.includes(f));
  const restFonts = fonts.filter((f) => !webFonts.includes(f) && !TOP_FONTS.includes(f));

  const groups: FontGroup[] = useMemo(() => {
    const q = query.toLowerCase();
    const filter = (list: string[]) => q ? list.filter((f) => f.toLowerCase().includes(q)) : list;
    const result: FontGroup[] = [];
    const popular = filter(TOP_FONTS);
    if (popular.length) result.push({ label: 'Popular', fonts: popular });
    const web = filter(extraWebFonts);
    if (web.length) result.push({ label: 'Web Fonts', fonts: web });
    const system = filter(restFonts);
    if (system.length) result.push({ label: 'System Fonts', fonts: system });
    return result;
  }, [query, extraWebFonts, restFonts]);

  const flatFonts = useMemo(() => groups.flatMap((g) => g.fonts), [groups]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlightIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, flatFonts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < flatFonts.length) {
        handleSelect(flatFonts[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      setHighlightIndex(-1);
    }
  };

  let flatIdx = 0;

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        className={`flex items-center w-full border rounded-md px-2 py-1.5 text-sm bg-white cursor-text transition-colors ${
          open ? 'border-indigo-400 ring-1 ring-indigo-400/20' : 'border-slate-200'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={open ? query : value}
          placeholder={open ? 'Search fonts...' : ''}
          onChange={(e) => { setQuery(e.target.value); setHighlightIndex(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 outline-none bg-transparent text-sm min-w-0"
          readOnly={!open}
        />
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg"
        >
          {groups.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">No fonts found</div>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 sticky top-0">
                {group.label}
              </div>
              {group.fonts.map((f) => {
                const idx = flatIdx++;
                return (
                  <div
                    key={f}
                    data-idx={idx}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(f)}
                    className={`px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                      idx === highlightIndex
                        ? 'bg-indigo-50 text-indigo-700'
                        : value === f
                          ? 'text-indigo-600 bg-indigo-50/50'
                          : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorPicker({ value, onChange, size = 'md' }: { value: string; onChange: (v: string) => void; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const isCustom = !COLORS.includes(value);
  return (
    <div className="flex gap-1 flex-wrap items-center">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`${dim} rounded-full border-2 transition-all ${
            value === c ? 'border-indigo-500 scale-110' : 'border-slate-200 hover:border-slate-400'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <label
        title="Custom color"
        className={`${dim} rounded-full border-2 transition-all cursor-pointer overflow-hidden relative ${
          isCustom ? 'border-indigo-500 scale-110' : 'border-slate-200 hover:border-slate-400'
        }`}
        style={{
          background: isCustom
            ? value
            : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
}

const inputClass = 'w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 outline-none transition-colors';

interface Props {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

export function TextPanel({ state, dispatch }: Props) {
  const [text, setText] = useState('');
  const { fonts, webFonts, addWebFont, loadingFont, fontError } = useFonts();
  const [fontFamily, setFontFamily] = useState('Helvetica Neue');
  const [fill, setFill] = useState(COLORS[0]);
  const [fontStyle, setFontStyle] = useState('normal');
  const [align, setAlign] = useState('center');
  const [webFontInput, setWebFontInput] = useState('');

  const addText = () => {
    if (!text.trim()) return;
    const { width, height } = state.config;
    const fontSize = calcFontSize(text, width, state.boundingBox);
    const textWidth = width * 0.8;
    const pos = centerTextPosition(width, height, textWidth, fontSize);
    const id = `text-${Date.now()}`;
    dispatch({
      type: 'ADD_TEXT',
      payload: { id, text, fontSize, fontFamily, fill, fontStyle, align, width: textWidth, ...pos },
    });
    setText('');
  };

  const selectedText = state.texts.find((t) => t.id === state.selectedId);

  return (
    <div className="space-y-4">
      {/* Add new text */}
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text..."
          className={`${inputClass} h-16 resize-none`}
        />
        <div className="flex gap-2">
          <FontSelect value={fontFamily} onChange={setFontFamily} fonts={fonts} webFonts={webFonts} onEnsureLoaded={addWebFont} />
          <select
            value={fontStyle}
            onChange={(e) => setFontStyle(e.target.value)}
            className="border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 outline-none transition-colors"
          >
            <option value="normal">Regular</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
            <option value="bold italic">Bold Italic</option>
          </select>
        </div>
        <AlignButtons value={align} onChange={setAlign} />

        {/* Google Fonts loader */}
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="Google Font name..."
            value={webFontInput}
            onChange={(e) => setWebFontInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && webFontInput.trim()) {
                addWebFont(webFontInput.trim());
                setWebFontInput('');
              }
            }}
            className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs bg-white focus:border-indigo-400 outline-none transition-colors"
          />
          <button
            onClick={() => {
              if (webFontInput.trim()) {
                addWebFont(webFontInput.trim());
                setWebFontInput('');
              }
            }}
            disabled={loadingFont || !webFontInput.trim()}
            className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          >
            {loadingFont ? '...' : '+ Font'}
          </button>
        </div>
        {fontError && <p className="text-xs text-rose-500">{fontError}</p>}

        <ColorPicker value={fill} onChange={setFill} />

        <button
          onClick={addText}
          disabled={!text.trim()}
          className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Add Text
        </button>
      </div>

      {/* Edit selected text */}
      {selectedText && (
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Editing Selected</p>
          <textarea
            value={selectedText.text}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_TEXT', payload: { id: selectedText.id, text: e.target.value } })
            }
            className={`${inputClass} h-16 resize-none`}
          />
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="text-[11px] font-medium text-slate-400">Size</span>
              <input
                type="number"
                value={selectedText.fontSize}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_TEXT', payload: { id: selectedText.id, fontSize: Number(e.target.value) } })
                }
                className={inputClass}
              />
            </label>
            <label className="flex-1">
              <span className="text-[11px] font-medium text-slate-400">Style</span>
              <select
                value={selectedText.fontStyle}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_TEXT', payload: { id: selectedText.id, fontStyle: e.target.value } })
                }
                className={inputClass}
              >
                <option value="normal">Regular</option>
                <option value="bold">Bold</option>
                <option value="italic">Italic</option>
                <option value="bold italic">Bold Italic</option>
              </select>
            </label>
          </div>
          <FontSelect
            value={selectedText.fontFamily}
            onChange={(v) => dispatch({ type: 'UPDATE_TEXT', payload: { id: selectedText.id, fontFamily: v } })}
            fonts={fonts}
            webFonts={webFonts}
            onEnsureLoaded={addWebFont}
          />
          <AlignButtons
            value={selectedText.align}
            onChange={(a) => dispatch({ type: 'UPDATE_TEXT', payload: { id: selectedText.id, align: a } })}
          />
          <ColorPicker
            value={selectedText.fill}
            onChange={(c) => dispatch({ type: 'UPDATE_TEXT', payload: { id: selectedText.id, fill: c } })}
            size="sm"
          />
          <button
            onClick={() => dispatch({ type: 'REMOVE_TEXT', payload: selectedText.id })}
            className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
          >
            Remove text
          </button>
        </div>
      )}

      {/* Text element list */}
      {state.texts.length > 0 && !selectedText && (
        <div className="space-y-1.5 border-t border-slate-200 pt-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">On Canvas</p>
          {state.texts.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
              onClick={() => dispatch({ type: 'SET_SELECTED', payload: t.id })}
            >
              <span className="text-sm text-slate-600 truncate flex-1">{t.text.slice(0, 30)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'REMOVE_TEXT', payload: t.id });
                }}
                className="text-rose-400 hover:text-rose-600 transition-colors ml-2"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
