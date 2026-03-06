import { useState } from 'react';
import type { CanvasState, CanvasAction } from '../../types';
import { FONTS, COLORS } from '../../constants';
import { calcFontSize, centerTextPosition } from '../../utils/autoLayout';

interface Props {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

export function TextPanel({ state, dispatch }: Props) {
  const [text, setText] = useState('');
  const [fontFamily, setFontFamily] = useState(FONTS[0]);
  const [fill, setFill] = useState(COLORS[0]);
  const [fontStyle, setFontStyle] = useState('normal');

  const addText = () => {
    if (!text.trim()) return;
    const { width, height } = state.config;
    const fontSize = calcFontSize(text, width, state.boundingBox);
    const textWidth = width * 0.8;
    const pos = centerTextPosition(width, height, textWidth, fontSize);
    const id = `text-${Date.now()}`;
    dispatch({
      type: 'ADD_TEXT',
      payload: {
        id,
        text,
        fontSize,
        fontFamily,
        fill,
        fontStyle,
        align: 'center',
        width: textWidth,
        ...pos,
      },
    });
    setText('');
  };

  const selectedText = state.texts.find((t) => t.id === state.selectedId);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Text</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text..."
        className="w-full border rounded px-2 py-1 text-sm h-16 resize-none"
      />
      <div className="flex gap-2">
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="flex-1 border rounded px-2 py-1 text-sm"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select
          value={fontStyle}
          onChange={(e) => setFontStyle(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="italic">Italic</option>
          <option value="bold italic">Bold Italic</option>
        </select>
      </div>
      <div className="flex gap-1 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setFill(c)}
            className="w-6 h-6 rounded border-2"
            style={{
              backgroundColor: c,
              borderColor: fill === c ? '#0066FF' : '#ccc',
            }}
          />
        ))}
      </div>
      <button
        onClick={addText}
        disabled={!text.trim()}
        className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        Add Text
      </button>

      {selectedText && (
        <div className="space-y-2 border-t pt-2">
          <h4 className="text-xs font-semibold text-gray-500">Edit Selected Text</h4>
          <input
            type="text"
            value={selectedText.text}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_TEXT', payload: { id: selectedText.id, text: e.target.value } })
            }
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="text-xs text-gray-500">Font Size</span>
              <input
                type="number"
                value={selectedText.fontSize}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_TEXT', payload: { id: selectedText.id, fontSize: Number(e.target.value) } })
                }
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </label>
          </div>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TEXT', payload: selectedText.id })}
            className="text-xs text-red-500 hover:underline"
          >
            Remove Text
          </button>
        </div>
      )}

      {state.texts.length > 0 && !selectedText && (
        <div className="space-y-1 border-t pt-2">
          <h4 className="text-xs font-semibold text-gray-500">Text Elements</h4>
          {state.texts.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm">
              <span
                className="truncate flex-1 cursor-pointer hover:text-blue-600"
                onClick={() => dispatch({ type: 'SET_SELECTED', payload: t.id })}
              >
                {t.text.slice(0, 30)}
              </span>
              <button
                onClick={() => dispatch({ type: 'REMOVE_TEXT', payload: t.id })}
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
