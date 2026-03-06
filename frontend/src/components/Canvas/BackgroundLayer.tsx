import { Rect, Image } from 'react-konva';
import type { ImageElement as ImageElementType, BackgroundGradient } from '../../types';

interface Props {
  width: number;
  height: number;
  backgroundImage: ImageElementType | null;
  backgroundColor: string;
  backgroundGradient: BackgroundGradient | null;
}

function angleToPoints(angle: number, w: number, h: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.sqrt(w * w + h * h) / 2;
  return {
    startX: cx - len * Math.cos(rad),
    startY: cy - len * Math.sin(rad),
    endX: cx + len * Math.cos(rad),
    endY: cy + len * Math.sin(rad),
  };
}

export function BackgroundLayer({ width, height, backgroundImage, backgroundColor, backgroundGradient }: Props) {
  const rectProps: Record<string, unknown> = { x: 0, y: 0, width, height };

  if (backgroundGradient) {
    const stops = backgroundGradient.colorStops.flatMap((s) => [s.offset, s.color]);
    if (backgroundGradient.type === 'linear') {
      const pts = angleToPoints(backgroundGradient.angle, width, height);
      rectProps.fillLinearGradientStartPoint = { x: pts.startX, y: pts.startY };
      rectProps.fillLinearGradientEndPoint = { x: pts.endX, y: pts.endY };
      rectProps.fillLinearGradientColorStops = stops;
    } else {
      rectProps.fillRadialGradientStartPoint = { x: width / 2, y: height / 2 };
      rectProps.fillRadialGradientEndPoint = { x: width / 2, y: height / 2 };
      rectProps.fillRadialGradientStartRadius = 0;
      rectProps.fillRadialGradientEndRadius = Math.max(width, height) / 2;
      rectProps.fillRadialGradientColorStops = stops;
    }
  } else {
    rectProps.fill = backgroundColor;
  }

  return (
    <>
      <Rect {...rectProps} />
      {backgroundImage && (
        <Image
          x={backgroundImage.x + backgroundImage.width / 2}
          y={backgroundImage.y + backgroundImage.height / 2}
          width={backgroundImage.width}
          height={backgroundImage.height}
          image={backgroundImage.image}
          offsetX={backgroundImage.width / 2}
          offsetY={backgroundImage.height / 2}
          rotation={backgroundImage.style?.rotation ?? 0}
          scaleX={backgroundImage.style?.flipX ? -1 : 1}
          scaleY={backgroundImage.style?.flipY ? -1 : 1}
        />
      )}
    </>
  );
}
