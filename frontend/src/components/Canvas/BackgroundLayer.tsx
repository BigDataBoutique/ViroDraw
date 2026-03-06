import { Rect, Image } from 'react-konva';
import type { ImageElement as ImageElementType } from '../../types';

interface Props {
  width: number;
  height: number;
  backgroundImage: ImageElementType | null;
}

export function BackgroundLayer({ width, height, backgroundImage }: Props) {
  return (
    <>
      <Rect x={0} y={0} width={width} height={height} fill="#FFFFFF" />
      {backgroundImage && (
        <Image
          x={backgroundImage.x}
          y={backgroundImage.y}
          width={backgroundImage.width}
          height={backgroundImage.height}
          image={backgroundImage.image}
        />
      )}
    </>
  );
}
