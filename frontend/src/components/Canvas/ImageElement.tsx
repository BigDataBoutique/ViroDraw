import { useRef, useEffect } from 'react';
import { Image, Transformer } from 'react-konva';
import type { ImageElement as ImageElementType } from '../../types';
import type Konva from 'konva';

interface Props {
  element: ImageElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (x: number, y: number, width: number, height: number) => void;
}

export function ImageElementComponent({ element, isSelected, onSelect, onDragEnd, onTransformEnd }: Props) {
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Image
        ref={shapeRef}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        image={element.image}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          onDragEnd(e.target.x(), e.target.y());
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onTransformEnd(
            node.x(),
            node.y(),
            Math.max(5, node.width() * scaleX),
            Math.max(5, node.height() * scaleY),
          );
        }}
      />
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
