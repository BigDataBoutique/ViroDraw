const IMG_STORAGE_KEY = 'virodraw-images';
const MAX_STORED_IMAGES = 30;

// Simple pub/sub so components refresh when library changes from elsewhere
type Listener = () => void;
const listeners = new Set<Listener>();
export function onLibraryChange(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
function notifyListeners() {
  for (const fn of listeners) fn();
}

export interface StoredImage {
  dataUrl: string;
  thumbnail: string;
  timestamp: number;
}

export function getStoredImages(): StoredImage[] {
  try {
    return JSON.parse(localStorage.getItem(IMG_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function storeImage(dataUrl: string, thumbnail: string) {
  const stored = getStoredImages();
  if (stored.some((s) => s.thumbnail === thumbnail)) return;
  stored.unshift({ dataUrl, thumbnail, timestamp: Date.now() });
  if (stored.length > MAX_STORED_IMAGES) stored.pop();
  try {
    localStorage.setItem(IMG_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    stored.pop();
    try {
      localStorage.setItem(IMG_STORAGE_KEY, JSON.stringify(stored));
    } catch { /* give up */ }
  }
}

export function createThumbnail(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const maxDim = 64;
  const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight);
  canvas.width = img.naturalWidth * ratio;
  canvas.height = img.naturalHeight * ratio;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png', 0.8);
}

export function imgToDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export function persistImage(img: HTMLImageElement) {
  const thumbnail = createThumbnail(img);
  const fullDataUrl = imgToDataUrl(img);
  storeImage(fullDataUrl, thumbnail);
  notifyListeners();
}

export function removeStoredImage(index: number) {
  const stored = getStoredImages();
  stored.splice(index, 1);
  localStorage.setItem(IMG_STORAGE_KEY, JSON.stringify(stored));
  notifyListeners();
  return stored;
}
