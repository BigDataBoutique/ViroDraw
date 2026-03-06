export interface CanvasConfig {
  width: number;
  height: number;
}

export interface BackgroundGradient {
  type: 'linear' | 'radial';
  angle: number;
  colorStops: { offset: number; color: string }[];
}

export interface TextShadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

export interface TextStyle {
  opacity: number;
  rotation: number;
  shadowConfig: TextShadow;
  strokeColor: string;
  strokeWidth: number;
  letterSpacing: number;
  lineHeight: number;
}

export const defaultTextStyle: TextStyle = {
  opacity: 1,
  rotation: 0,
  shadowConfig: {
    enabled: false,
    color: '#000000',
    blur: 10,
    offsetX: 2,
    offsetY: 2,
    opacity: 0.5,
  },
  strokeColor: '#000000',
  strokeWidth: 0,
  letterSpacing: 0,
  lineHeight: 1,
};

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
  style?: TextStyle;
}

export interface ImageShadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

export interface ImageStyle {
  opacity: number;
  cornerRadius: number;
  rotation: number;
  shadowConfig: ImageShadow;
  strokeColor: string;
  strokeWidth: number;
  flipX: boolean;
  flipY: boolean;
  brightness: number;
}

export const defaultImageStyle: ImageStyle = {
  opacity: 1,
  cornerRadius: 0,
  rotation: 0,
  shadowConfig: {
    enabled: false,
    color: '#000000',
    blur: 10,
    offsetX: 4,
    offsetY: 4,
    opacity: 0.5,
  },
  strokeColor: '#000000',
  strokeWidth: 0,
  flipX: false,
  flipY: false,
  brightness: 0,
};

export interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  style?: ImageStyle;
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
  backgroundColor: string;
  backgroundGradient: BackgroundGradient | null;
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
  | { type: 'SET_SELECTED'; payload: string | null }
  | { type: 'SET_BACKGROUND_COLOR'; payload: string }
  | { type: 'SET_BACKGROUND_GRADIENT'; payload: BackgroundGradient | null }
  | { type: 'UPDATE_BACKGROUND_STYLE'; payload: Partial<ImageStyle> }
  | { type: 'RESET_CANVAS' };
