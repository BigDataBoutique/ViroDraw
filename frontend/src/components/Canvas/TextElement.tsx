import { useRef, useEffect } from 'react';
import { Text, Transformer } from 'react-konva';
import type { TextElement as TextElementType } from '../../types';
import { defaultTextStyle } from '../../types';
import type Konva from 'konva';

interface Props {
  element: TextElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (x: number, y: number, width: number, fontSize: number) => void;
}

export function TextElementComponent({ element, isSelected, onSelect, onDragEnd, onTransformEnd }: Props) {
  const shapeRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const style = element.style ?? defaultTextStyle;
  const shadow = style.shadowConfig;

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Text
        ref={shapeRef}
        x={element.x}
        y={element.y}
        text={element.text}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fill={element.fill}
        fontStyle={element.fontStyle}
        align={element.align}
        width={element.width}
        opacity={style.opacity}
        rotation={style.rotation}
        letterSpacing={style.letterSpacing}
        lineHeight={style.lineHeight}
        stroke={style.strokeWidth > 0 ? style.strokeColor : undefined}
        strokeWidth={style.strokeWidth}
        shadowEnabled={shadow.enabled}
        shadowColor={shadow.enabled ? shadow.color : undefined}
        shadowBlur={shadow.enabled ? shadow.blur : undefined}
        shadowOffsetX={shadow.enabled ? shadow.offsetX : undefined}
        shadowOffsetY={shadow.enabled ? shadow.offsetY : undefined}
        shadowOpacity={shadow.enabled ? shadow.opacity : undefined}
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
          node.scaleX(1);
          node.scaleY(1);
          onTransformEnd(
            node.x(),
            node.y(),
            Math.max(20, node.width() * scaleX),
            Math.max(8, Math.round(node.fontSize() * scaleX)),
          );
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}
