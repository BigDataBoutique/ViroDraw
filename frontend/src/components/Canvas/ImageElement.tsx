import { Image } from 'react-konva';
import type { ImageElement as ImageElementType } from '../../types';
import type Konva from 'konva';

interface Props {
  element: ImageElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export function ImageElementComponent({ element, isSelected, onSelect, onDragEnd }: Props) {
  return (
    <Image
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
      stroke={isSelected ? '#0066FF' : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  );
}
