import { useRef, useEffect, useMemo } from 'react';
import { Image, Group, Rect, Transformer } from 'react-konva';
import type { ImageElement as ImageElementType } from '../../types';
import Konva from 'konva';

interface Props {
  element: ImageElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (x: number, y: number, width: number, height: number) => void;
}

export function ImageElementComponent({ element, isSelected, onSelect, onDragEnd, onTransformEnd }: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const style = element.style;
  const shadow = style.shadowConfig;
  const hasCornerRadius = style.cornerRadius > 0;

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const clipFunc = useMemo(() => {
    if (!hasCornerRadius) return undefined;
    return (ctx: CanvasRenderingContext2D) => {
      const r = style.cornerRadius;
      const w = element.width;
      const h = element.height;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.arcTo(w, 0, w, r, r);
      ctx.lineTo(w, h - r);
      ctx.arcTo(w, h, w - r, h, r);
      ctx.lineTo(r, h);
      ctx.arcTo(0, h, 0, h - r, r);
      ctx.lineTo(0, r);
      ctx.arcTo(0, 0, r, 0, r);
      ctx.closePath();
    };
  }, [hasCornerRadius, style.cornerRadius, element.width, element.height]);

  const filters = useMemo(() => {
    const f: Array<(imageData: ImageData) => void> = [];
    if (style.brightness !== 0) f.push(Konva.Filters.Brighten);
    return f.length > 0 ? f : undefined;
  }, [style.brightness]);

  const imageRef = useRef<Konva.Image>(null);
  useEffect(() => {
    if (imageRef.current && filters) {
      imageRef.current.cache();
    } else if (imageRef.current) {
      try { imageRef.current.clearCache(); } catch { /* no cache to clear */ }
    }
  }, [filters, style.brightness, element.image, element.width, element.height]);

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        rotation={style.rotation}
        scaleX={style.flipX ? -1 : 1}
        scaleY={style.flipY ? -1 : 1}
        offsetX={style.flipX ? element.width : 0}
        offsetY={style.flipY ? element.height : 0}
        opacity={style.opacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          onDragEnd(e.target.x(), e.target.y());
        }}
        onTransformEnd={() => {
          const node = groupRef.current;
          if (!node) return;
          const scaleX = Math.abs(node.scaleX());
          const scaleY = Math.abs(node.scaleY());
          node.scaleX(style.flipX ? -1 : 1);
          node.scaleY(style.flipY ? -1 : 1);
          onTransformEnd(
            node.x(),
            node.y(),
            Math.max(5, element.width * scaleX),
            Math.max(5, element.height * scaleY),
          );
        }}
      >
        {/* Shadow — outside clipFunc group so it's not clipped */}
        {shadow.enabled && (
          <Rect
            x={0}
            y={0}
            width={element.width}
            height={element.height}
            cornerRadius={style.cornerRadius}
            fill={shadow.color}
            opacity={shadow.opacity}
            shadowColor={shadow.color}
            shadowBlur={shadow.blur}
            shadowOffsetX={shadow.offsetX}
            shadowOffsetY={shadow.offsetY}
            shadowOpacity={shadow.opacity}
            shadowEnabled={true}
          />
        )}
        {/* Clipped content group for corner radius */}
        <Group clipFunc={clipFunc}>
          <Image
            ref={imageRef}
            x={0}
            y={0}
            width={element.width}
            height={element.height}
            image={element.image}
            filters={filters}
            brightness={style.brightness}
          />
        </Group>
        {/* Border/Stroke */}
        {style.strokeWidth > 0 && (
          <Rect
            x={0}
            y={0}
            width={element.width}
            height={element.height}
            cornerRadius={style.cornerRadius}
            stroke={style.strokeColor}
            strokeWidth={style.strokeWidth}
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}
