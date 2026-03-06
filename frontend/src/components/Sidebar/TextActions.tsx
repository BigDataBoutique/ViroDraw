import type { CanvasState, CanvasAction, TextStyle, TextShadow } from '../../types';
import { defaultTextStyle } from '../../types';
import { SliderRow, ColorInput, Section } from './shared';

interface Props {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

export function TextActions({ state, dispatch }: Props) {
  const selectedText = state.texts.find(t => t.id === state.selectedId);
  if (!selectedText) return null;

  const style = selectedText.style ?? defaultTextStyle;
  const shadow = style.shadowConfig;

  const update = (partial: Partial<TextStyle>) => {
    dispatch({
      type: 'UPDATE_TEXT',
      payload: { id: selectedText.id, style: { ...style, ...partial } },
    });
  };

  const updateShadow = (partial: Partial<TextShadow>) => {
    update({ shadowConfig: { ...shadow, ...partial } });
  };

  return (
    <div className="space-y-4 border-t border-slate-200 pt-3">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Actions &amp; Styling</p>

      {/* Opacity */}
      <Section title="Opacity">
        <SliderRow label="Opacity" value={style.opacity} min={0.05} max={1} step={0.05} onChange={v => update({ opacity: v })} />
      </Section>

      {/* Rotation */}
      <Section title="Rotation">
        <SliderRow label="Angle" value={style.rotation} min={-180} max={180} step={1} onChange={v => update({ rotation: v })} unit="°" />
        <div className="flex gap-1">
          {[-45, -15, 0, 15, 45].map(deg => (
            <button key={deg} onClick={() => update({ rotation: deg })}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${style.rotation === deg ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {deg}°
            </button>
          ))}
        </div>
      </Section>

      {/* Drop Shadow */}
      <Section title="Drop Shadow">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={shadow.enabled}
            onChange={e => updateShadow({ enabled: e.target.checked })}
            className="rounded accent-indigo-500" />
          <span>Enable shadow</span>
        </label>
        {shadow.enabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-slate-600 shrink-0">Color</span>
              <ColorInput value={shadow.color} onChange={v => updateShadow({ color: v })} />
            </div>
            <SliderRow label="Blur" value={shadow.blur} min={0} max={50} step={1} onChange={v => updateShadow({ blur: v })} unit="px" />
            <SliderRow label="Offset X" value={shadow.offsetX} min={-30} max={30} step={1} onChange={v => updateShadow({ offsetX: v })} unit="px" />
            <SliderRow label="Offset Y" value={shadow.offsetY} min={-30} max={30} step={1} onChange={v => updateShadow({ offsetY: v })} unit="px" />
            <SliderRow label="Opacity" value={shadow.opacity} min={0} max={1} step={0.05} onChange={v => updateShadow({ opacity: v })} />
          </div>
        )}
      </Section>

      {/* Text Outline / Stroke */}
      <Section title="Outline">
        <SliderRow label="Width" value={style.strokeWidth} min={0} max={10} step={0.5} onChange={v => update({ strokeWidth: v })} unit="px" />
        {style.strokeWidth > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 shrink-0">Color</span>
            <ColorInput value={style.strokeColor} onChange={v => update({ strokeColor: v })} />
          </div>
        )}
      </Section>

      {/* Letter Spacing */}
      <Section title="Spacing">
        <SliderRow label="Letters" value={style.letterSpacing} min={-5} max={20} step={0.5} onChange={v => update({ letterSpacing: v })} unit="px" />
        <SliderRow label="Line height" value={style.lineHeight} min={0.5} max={3} step={0.1} onChange={v => update({ lineHeight: v })} />
      </Section>

      {/* Reset */}
      <button onClick={() => update({ ...defaultTextStyle, shadowConfig: { ...defaultTextStyle.shadowConfig } })}
        className="w-full py-1.5 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 rounded transition-colors border border-slate-200">
        Reset All Styles
      </button>
    </div>
  );
}
