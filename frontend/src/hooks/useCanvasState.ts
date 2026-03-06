import { useReducer } from 'react';
import type { CanvasState, CanvasAction } from '../types';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../constants';

const initialState: CanvasState = {
  config: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
  backgroundImage: null,
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
      return { ...state, backgroundImage: action.payload };
    case 'ADD_IMAGE':
      return { ...state, images: [...state.images, action.payload] };
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
      return { ...state, texts: [...state.texts, action.payload] };
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
    default:
      return state;
  }
}

export function useCanvasState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}
