import { Rect } from 'react-konva';
import type { BoundingBox as BoundingBoxType } from '../../types';

interface Props {
  box: BoundingBoxType;
}

export function BoundingBoxOverlay({ box }: Props) {
  return (
    <Rect
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      stroke="#0066FF"
      strokeWidth={1}
      dash={[6, 4]}
      listening={false}
    />
  );
}
