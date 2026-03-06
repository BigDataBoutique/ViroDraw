import type { BoundingBox } from '../types';
import { PADDING } from '../constants';

export function calcFontSize(
  text: string,
  canvasWidth: number,
  boundingBox: BoundingBox | null,
): number {
  const baseSize = canvasWidth / (text.length * 0.6);
  let size = Math.max(16, Math.min(120, baseSize));

  if (boundingBox) {
    const maxByWidth = boundingBox.width / (text.length * 0.6);
    size = Math.min(size, maxByWidth);
  }

  return Math.round(size);
}

export function centerTextPosition(
  canvasWidth: number,
  canvasHeight: number,
  textWidth: number,
  _fontSize: number,
): { x: number; y: number } {
  return {
    x: (canvasWidth - textWidth) / 2,
    y: canvasHeight / 3,
  };
}

export function logoPosition(
  index: number,
  canvasWidth: number,
  logoWidth: number,
): { x: number; y: number } {
  if (index % 2 === 0) {
    return { x: PADDING, y: PADDING };
  }
  return { x: canvasWidth - logoWidth - PADDING, y: PADDING };
}

export function coverScale(
  imgWidth: number,
  imgHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): { width: number; height: number; x: number; y: number } {
  const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
  const w = imgWidth * scale;
  const h = imgHeight * scale;
  return {
    width: w,
    height: h,
    x: (canvasWidth - w) / 2,
    y: (canvasHeight - h) / 2,
  };
}
