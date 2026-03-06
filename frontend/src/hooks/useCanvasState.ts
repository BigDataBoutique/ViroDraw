import { useReducer, useCallback } from 'react';
import type { CanvasState, CanvasAction } from '../types';
import { defaultImageStyle, defaultTextStyle } from '../types';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../constants';

const initialState: CanvasState = {
  config: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
  backgroundImage: null,
  backgroundColor: '#FFFFFF',
  backgroundGradient: null,
  images: [],
  texts: [],
  boundingBox: null,
  exportFormat: 'webp',
  selectedId: null,
};

function reducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'SET_BACKGROUND':
      return {
        ...state,
        backgroundImage: action.payload
          ? { ...action.payload, style: action.payload.style ?? { ...defaultImageStyle, shadowConfig: { ...defaultImageStyle.shadowConfig } } }
          : null,
      };
    case 'ADD_IMAGE':
      return {
        ...state,
        images: [
          ...state.images,
          { ...action.payload, style: action.payload.style ?? { ...defaultImageStyle, shadowConfig: { ...defaultImageStyle.shadowConfig } } },
        ],
      };
    case 'UPDATE_IMAGE':
      return {
        ...state,
        images: state.images.map((img) =>
          img.id === action.payload.id ? { ...img, ...action.payload } : img,
        ),
      };
    case 'REMOVE_IMAGE':
      return {
        ...state,
        images: state.images.filter((img) => img.id !== action.payload),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
      };
    case 'ADD_TEXT':
      return {
        ...state,
        texts: [
          ...state.texts,
          { ...action.payload, style: action.payload.style ?? { ...defaultTextStyle, shadowConfig: { ...defaultTextStyle.shadowConfig } } },
        ],
      };
    case 'UPDATE_TEXT':
      return {
        ...state,
        texts: state.texts.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t,
        ),
      };
    case 'REMOVE_TEXT':
      return {
        ...state,
        texts: state.texts.filter((t) => t.id !== action.payload),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
      };
    case 'SET_BOUNDING_BOX':
      return { ...state, boundingBox: action.payload };
    case 'SET_EXPORT_FORMAT':
      return { ...state, exportFormat: action.payload };
    case 'SET_SELECTED':
      return { ...state, selectedId: action.payload };
    case 'SET_BACKGROUND_COLOR':
      return { ...state, backgroundColor: action.payload, backgroundGradient: null };
    case 'SET_BACKGROUND_GRADIENT':
      return { ...state, backgroundGradient: action.payload };
    case 'UPDATE_BACKGROUND_STYLE':
      if (!state.backgroundImage) return state;
      return {
        ...state,
        backgroundImage: {
          ...state.backgroundImage,
          style: { ...state.backgroundImage.style!, ...action.payload },
        },
      };
    case 'RESET_CANVAS':
      return {
        ...state,
        backgroundImage: null,
        backgroundColor: '#FFFFFF',
        backgroundGradient: null,
        images: [],
        texts: [],
        boundingBox: null,
        selectedId: null,
      };
    default:
      return state;
  }
}

// Actions that don't affect undo history (ephemeral UI state)
const NON_UNDOABLE_ACTIONS = new Set<string>([
  'SET_SELECTED',
  'SET_BOUNDING_BOX',
  'SET_EXPORT_FORMAT',
]);

const MAX_HISTORY = 50;

interface HistoryState {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
}

type HistoryAction =
  | CanvasAction
  | { type: 'UNDO' }
  | { type: 'REDO' };

function historyReducer(history: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === 'UNDO') {
    if (history.past.length === 0) return history;
    const previous = history.past[history.past.length - 1];
    return {
      past: history.past.slice(0, -1),
      present: { ...previous, selectedId: history.present.selectedId, boundingBox: history.present.boundingBox },
      future: [history.present, ...history.future],
    };
  }

  if (action.type === 'REDO') {
    if (history.future.length === 0) return history;
    const next = history.future[0];
    return {
      past: [...history.past, history.present],
      present: { ...next, selectedId: history.present.selectedId, boundingBox: history.present.boundingBox },
      future: history.future.slice(1),
    };
  }

  const newPresent = reducer(history.present, action);
  if (newPresent === history.present) return history;

  if (NON_UNDOABLE_ACTIONS.has(action.type)) {
    return { ...history, present: newPresent };
  }

  const past = [...history.past, history.present];
  if (past.length > MAX_HISTORY) past.shift();

  return {
    past,
    present: newPresent,
    future: [],
  };
}

export function useCanvasState() {
  const [history, historyDispatch] = useReducer(historyReducer, {
    past: [],
    present: initialState,
    future: [],
  });

  const dispatch = useCallback((action: CanvasAction) => {
    historyDispatch(action);
  }, []);

  const undo = useCallback(() => historyDispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => historyDispatch({ type: 'REDO' }), []);

  return {
    state: history.present,
    dispatch,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
