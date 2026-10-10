export type GalleryViewport = 'compact' | 'regular' | 'wide';

export interface GalleryLayoutConfig {
  readonly visibleRadius: number;
  readonly buffer: number;
  readonly angleStep: number;
  readonly radiusX: number;
  readonly radiusZ: number;
  readonly nearOffset: number;
  readonly cameraCompensation: number;
  readonly verticalTravel: number;
  readonly verticalDrop: number;
  readonly cameraYaw: number;
  readonly cameraPitch: number;
  readonly frontRadius: number;
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
  readonly projectedDepth: number;
  readonly isFront: boolean;
  readonly zIndex: number;
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
      return {
        visibleRadius: 1,
        buffer: 1,
        angleStep: 20,
        radiusX: 220,
        radiusZ: 260,
        nearOffset: 54,
        cameraCompensation: 70,
        verticalTravel: 10,
        verticalDrop: 10,
        cameraYaw: -18,
        cameraPitch: 5,
        frontRadius: 1.0,
      };
    case 'regular':
      return {
        visibleRadius: 2,
        buffer: 2,
        angleStep: 17,
        radiusX: 390,
        radiusZ: 350,
        nearOffset: 80,
        cameraCompensation: 170,
        verticalTravel: 15,
        verticalDrop: 14,
        cameraYaw: -22,
        cameraPitch: 6,
        frontRadius: 1.5,
      };
    default:
      // Keep the rail inside a narrow desktop scene while retaining the full
      // values on the 1184px-wide desktop canvas.
      const railScale = Math.max(0.78, Math.min(1, viewportWidth / 1184));
      return {
        visibleRadius: 3,
        buffer: 2,
        angleStep: 15.5,
        radiusX: Math.round(580 * railScale),
        radiusZ: Math.round(460 * railScale),
        nearOffset: Math.round(105 * railScale),
        cameraCompensation: Math.round(310 * railScale),
        verticalTravel: 18,
        verticalDrop: 16,
        cameraYaw: -24,
        cameraPitch: 6.5,
        frontRadius: 1.85,
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
  const angle = Math.max(-80, Math.min(80, relative * config.angleStep));
  const radians = (angle * Math.PI) / 180;
  const x = config.radiusX * Math.sin(radians);
  const z =
    config.nearOffset +
    config.radiusZ * (Math.cos(radians) - 1) -
    config.cameraCompensation * Math.sin(radians);
  const y =
    config.verticalTravel * Math.sin(radians) -
    config.verticalDrop * (1 - Math.cos(radians));
  const yawRadians = (config.cameraYaw * Math.PI) / 180;
  const projectedDepth = -x * Math.sin(yawRadians) + z * Math.cos(yawRadians);

  // Smooth opacity curve: cards fade gently towards the outer rails so entry/exit is seamless
  const beyondVisible = Math.max(0, distance - config.visibleRadius);
  const fadeRange = Math.max(0.01, config.buffer);
  const opacityProgress = Math.min(1, beyondVisible / fadeRange);
  const opacity = Math.max(0, 1 - Math.pow(opacityProgress, 1.4));

  const isFront = distance <= config.frontRadius;

  return {
    logicalIndex,
    photoIndex: positiveModulo(logicalIndex, photoCount),
    relative,
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    z: Number(z.toFixed(2)),
    rotateY: Number(Math.max(-48, Math.min(48, -angle * 0.45)).toFixed(2)),
    rotateZ: Number((-angle * 0.12).toFixed(2)),
    scale: Number(Math.max(0.74, 1 - distance * 0.035).toFixed(3)),
    opacity: Number(opacity.toFixed(3)),
    projectedDepth: Number(projectedDepth.toFixed(2)),
    isFront,
    zIndex: Math.round(projectedDepth + 1000),
  };
}

export function getClosestLogicalIndex(position: number): number {
  return Math.round(position);
}
