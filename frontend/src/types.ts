export interface CanvasConfig {
  width: number;
  height: number;
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle: string;
  align: string;
  width: number;
}

export interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ExportFormat = 'webp' | 'png' | 'jpg';

export interface CanvasState {
  config: CanvasConfig;
  backgroundImage: ImageElement | null;
  images: ImageElement[];
  texts: TextElement[];
  boundingBox: BoundingBox | null;
  exportFormat: ExportFormat;
  selectedId: string | null;
}

export type CanvasAction =
  | { type: 'SET_CONFIG'; payload: CanvasConfig }
  | { type: 'SET_BACKGROUND'; payload: ImageElement | null }
  | { type: 'ADD_IMAGE'; payload: ImageElement }
  | { type: 'UPDATE_IMAGE'; payload: { id: string } & Partial<ImageElement> }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'ADD_TEXT'; payload: TextElement }
  | { type: 'UPDATE_TEXT'; payload: { id: string } & Partial<TextElement> }
  | { type: 'REMOVE_TEXT'; payload: string }
  | { type: 'SET_BOUNDING_BOX'; payload: BoundingBox | null }
  | { type: 'SET_EXPORT_FORMAT'; payload: ExportFormat }
  | { type: 'SET_SELECTED'; payload: string | null };
