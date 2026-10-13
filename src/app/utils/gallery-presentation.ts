import { ArcCardLayout, GalleryLayoutConfig } from './gallery-layout';

export interface SafeRect { left: number; top: number; right: number; bottom: number }
export interface PresentationViewport {
  width: number;
  height: number;
  perspective: number;
  safe: SafeRect;
}
type Quaternion = readonly [number, number, number, number];
const radians = (degrees: number) => degrees * Math.PI / 180;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const axis = (x: number, y: number, z: number, degrees: number): Quaternion => {
  const half = radians(degrees) / 2, s = Math.sin(half);
  return [x * s, y * s, z * s, Math.cos(half)];
};
function multiply(a: Quaternion, b: Quaternion): Quaternion {
  const [x, y, z, w] = a, [X, Y, Z, W] = b;
  return [w*X+x*W+y*Z-z*Y, w*Y-x*Z+y*W+z*X, w*Z+x*Y-y*X+z*W, w*W-x*X-y*Y-z*Z];
}
function towardCamera(q: Quaternion, progress: number): Quaternion {
  // Shortest-path spherical interpolation to identity. No matrix-entry lerp/shear.
  const sign = q[3] < 0 ? -1 : 1;
  const angle = Math.acos(clamp(q[3] * sign, -1, 1));
  if (angle < 1e-7) return [0, 0, 0, 1];
  const factor = Math.sin((1 - progress) * angle) / Math.sin(angle) * sign;
  return [q[0]*factor, q[1]*factor, q[2]*factor, Math.cos((1 - progress)*angle)];
}
function rotation([x,y,z,w]: Quaternion): DOMMatrix {
  return new DOMMatrix([
    1-2*(y*y+z*z), 2*(x*y+w*z), 2*(x*z-w*y), 0,
    2*(x*y-w*z), 1-2*(x*x+z*z), 2*(y*z+w*x), 0,
    2*(x*z+w*y), 2*(y*z-w*x), 1-2*(x*x+y*y), 0,
    0, 0, 0, 1,
  ]);
}

export function galleryCamera(config: GalleryLayoutConfig): DOMMatrix {
  return new DOMMatrix().rotateAxisAngle(1,0,0,config.cameraPitch)
    .rotateAxisAngle(0,1,0,config.cameraYaw);
}
export function galleryRail(layout: ArcCardLayout): DOMMatrix {
  return new DOMMatrix().translate(layout.x,layout.y,layout.z)
    .rotateAxisAngle(0,1,0,layout.rotateY).rotateAxisAngle(0,0,1,layout.rotateZ).scale(layout.scale,layout.scale,layout.scale);
}
export function projectCard(matrix: DOMMatrixReadOnly, viewport: PresentationViewport): SafeRect {
  const corners = [-1, 1].flatMap(x => [-1, 1].map(y => {
    const p = matrix.transformPoint(new DOMPoint(x * viewport.width / 2, y * viewport.height / 2, 0));
    const projection = viewport.perspective / Math.max(1, viewport.perspective - p.z);
    return { x: p.x * projection, y: p.y * projection };
  }));
  return { left: Math.min(...corners.map(p=>p.x)), right: Math.max(...corners.map(p=>p.x)),
    top: Math.min(...corners.map(p=>p.y)), bottom: Math.max(...corners.map(p=>p.y)) };
}

/** All coordinates are relative to scene centre, before perspective projection. */
export function presentGalleryCard(
  layout: ArcCardLayout, config: GalleryLayoutConfig, viewport: PresentationViewport,
  progress: number, neighborOffset = 0, neighborDepth = 0,
  adjacentLayouts: readonly ArcCardLayout[] = [],
): { rail: DOMMatrix; local: DOMMatrix; camera: DOMMatrix; bounds: SafeRect; lifted: boolean } {
  const rail = galleryRail(layout), parent = galleryCamera(config).multiply(rail);
  if (progress === 0 && neighborOffset === 0 && neighborDepth === 0) {
    return { rail, local: new DOMMatrix(), camera: parent, bounds: projectCard(parent, viewport), lifted: false };
  }
  const origin = parent.transformPoint(new DOMPoint());
  const baseQ = multiply(multiply(axis(1,0,0,config.cameraPitch), axis(0,1,0,config.cameraYaw)),
    multiply(axis(0,1,0,layout.rotateY), axis(0,0,1,layout.rotateZ)));
  const { perspective, width, height } = viewport;
  let safe = viewport.safe;
  if (progress > 0 && adjacentLayouts.length) {
    // Preserve a visible lower-outer patch of adjacent photographs. A fixed
    // horizontal neighbor offset alone can push that patch behind the next card.
    // Probe actual projected face points, not a DOM bounding-box corner (which
    // can lie outside a rotated photo). This is geometry only: no layout reads.
    const proposed = presentGalleryCard(layout, config, viewport, 1).bounds;
    let bottom = safe.bottom;
    for (const adjacent of adjacentLayouts) {
      const matrix = galleryCamera(config).multiply(galleryRail(adjacent));
      const side = adjacent.relative < 0 ? -1 : 1;
      const point = matrix.transformPoint(new DOMPoint(side * width * 0.36, height * 0.34));
      const projection = perspective / (perspective - point.z);
      const x = point.x * projection, y = point.y * projection;
      const clearance = 28;
      if (x >= safe.left + clearance && x <= safe.right - clearance
        && y >= safe.top + clearance && y <= safe.bottom - clearance
        && x >= proposed.left - clearance && x <= proposed.right + clearance
        && y >= proposed.top - clearance && y <= proposed.bottom + clearance) {
        bottom = Math.min(bottom, y - clearance);
      }
    }
    safe = { ...safe, bottom };
  }
  const availableWidth = Math.max(0, safe.right - safe.left);
  const availableHeight = Math.max(0, safe.bottom - safe.top);
  let z = Math.min(origin.z + 160, perspective * 0.45);
  let scale = layout.scale * 1.12;
  const scaleLimit = (depth: number) => Math.min(availableWidth / width, availableHeight / height) * (1 - depth / perspective);
  // Give back lift before shrinking the portrait excessively. No scroll-to-fit.
  while (z > origin.z && scaleLimit(z) < layout.scale * 0.94) z = Math.max(origin.z, z - 20);
  scale = Math.min(scale, scaleLimit(z));
  const lifted = scale >= layout.scale * 0.74 && availableWidth >= 100 && availableHeight >= 140;
  const p = lifted ? clamp(progress, 0, 1) : 0;
  const projection = perspective / (perspective - z);
  const halfW = width * scale * projection / 2, halfH = height * scale * projection / 2;
  const targetX = clamp(origin.x * projection, safe.left + halfW, safe.right - halfW) / projection;
  const targetY = clamp((origin.y - 12) * projection, safe.top + halfH, safe.bottom - halfH) / projection;
  // Neighbors retain their own orientation and return along the same trajectory.
  const baseBounds = projectCard(parent, viewport);
  const baseProjection = perspective / (perspective - origin.z);
  const offset = neighborOffset > 0
    ? Math.min(neighborOffset, Math.max(0, safe.right - baseBounds.right) / baseProjection)
    : Math.max(neighborOffset, Math.min(0, safe.left - baseBounds.left) / baseProjection);
  const uniformScale = layout.scale + (scale - layout.scale) * p;
  const camera = new DOMMatrix().translate(
    origin.x + (targetX - origin.x) * p + offset * (1-p),
    origin.y + (targetY - origin.y) * p,
    origin.z + (z - origin.z) * p - neighborDepth * (1-p),
  ).multiply(rotation(towardCamera(baseQ, p))).scale(uniformScale,uniformScale,uniformScale);
  // Invert the ENTIRE camera + rail transform. The child uses its centre origin,
  // as does the rail; projection is intentionally not included in this inverse.
  const local = parent.inverse().multiply(camera);
  return { rail, local, camera, bounds: projectCard(camera, viewport), lifted };
}
