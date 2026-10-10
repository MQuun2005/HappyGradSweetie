export type GalleryViewport = 'compact' | 'regular' | 'wide';

export interface GalleryLayoutConfig {
  readonly visibleRadius: number;
  readonly buffer: number;
  readonly angleStep: number;
  readonly radius: number;
  readonly verticalLift: number;
}

export interface ArcCardLayout {
  readonly logicalIndex: number;
  readonly photoIndex: number;
  readonly relative: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotateY: number;
  readonly rotateZ: number;
  readonly scale: number;
  readonly opacity: number;
}

export function positiveModulo(value: number, modulo: number): number {
  return ((value % modulo) + modulo) % modulo;
}

export function getGalleryViewport(viewportWidth: number): GalleryViewport {
  if (viewportWidth < 641) {
    return 'compact';
  }

  return viewportWidth < 1024 ? 'regular' : 'wide';
}

export function getGalleryLayoutConfig(viewportWidth: number): GalleryLayoutConfig {
  switch (getGalleryViewport(viewportWidth)) {
    case 'compact':
      return { visibleRadius: 2, buffer: 1, angleStep: 19, radius: 300, verticalLift: 16 };
    case 'regular':
      return { visibleRadius: 3, buffer: 2, angleStep: 16, radius: 510, verticalLift: 18 };
    default:
      return {
        visibleRadius: 4,
        buffer: 2,
        angleStep: 14,
        radius: Math.max(580, Math.min(860, viewportWidth * 0.7)),
        verticalLift: 20,
      };
  }
}

export function getVirtualLogicalIndices(
  position: number,
  config: GalleryLayoutConfig,
): readonly number[] {
  const center = Math.floor(position);
  const radius = config.visibleRadius + config.buffer;

  return Array.from({ length: radius * 2 + 1 }, (_, index) => center - radius + index);
}

export function getArcCardLayout(
  logicalIndex: number,
  position: number,
  photoCount: number,
  config: GalleryLayoutConfig,
): ArcCardLayout {
  const relative = logicalIndex - position;
  const distance = Math.abs(relative);
  const angle = relative * config.angleStep;
  const radians = (angle * Math.PI) / 180;
  const beyondVisible = Math.max(0, distance - config.visibleRadius);

  return {
    logicalIndex,
    photoIndex: positiveModulo(logicalIndex, photoCount),
    relative,
    x: Number((config.radius * Math.sin(radians)).toFixed(2)),
    y: Number((distance * config.verticalLift + distance * distance * 2.2).toFixed(2)),
    z: Number((config.radius * (Math.cos(radians) - 1)).toFixed(2)),
    rotateY: Number((-angle * 0.72).toFixed(2)),
    rotateZ: Number((relative * 1.4).toFixed(2)),
    scale: Number(Math.max(0.7, 1 - distance * 0.055).toFixed(3)),
    opacity: Number(Math.max(0, 1 - beyondVisible * 0.7).toFixed(3)),
  };
}

export function getClosestLogicalIndex(position: number): number {
  return Math.round(position);
}
