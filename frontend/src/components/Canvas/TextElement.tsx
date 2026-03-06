import { Text } from 'react-konva';
import type { TextElement as TextElementType } from '../../types';
import type Konva from 'konva';

interface Props {
  element: TextElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export function TextElementComponent({ element, isSelected, onSelect, onDragEnd }: Props) {
  return (
    <Text
      x={element.x}
      y={element.y}
      text={element.text}
      fontSize={element.fontSize}
      fontFamily={element.fontFamily}
      fill={element.fill}
      fontStyle={element.fontStyle}
      align={element.align}
      width={element.width}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        onDragEnd(e.target.x(), e.target.y());
      }}
      stroke={isSelected ? '#0066FF' : undefined}
      strokeWidth={isSelected ? 0.5 : 0}
    />
  );
}
