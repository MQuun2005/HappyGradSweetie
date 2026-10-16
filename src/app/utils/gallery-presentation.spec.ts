import { getArcCardLayout, getGalleryLayoutConfig } from './gallery-layout';
import {
  galleryCamera,
  galleryRail,
  presentGalleryCard,
  projectCard,
  PresentationViewport,
} from './gallery-presentation';

describe('camera-space gallery presentation', () => {
  const config = getGalleryLayoutConfig(1184, 900, false);
  const viewport: PresentationViewport = {
    width: 232,
    height: 348,
    perspective: 1100,
    safe: { left: -570, right: 570, top: -260, bottom: 260 },
  };
  const close = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 5);
  const layout = (index: number) => getArcCardLayout(index, 0, 34, config);

  it('keeps the exact rail pose at progress zero', () => {
    for (const index of [-3, 0, 3]) {
      const pose = presentGalleryCard(layout(index), config, viewport, 0);
      const expected = galleryCamera(config).multiply(galleryRail(layout(index)));
      pose.camera.toFloat64Array().forEach((v, i) => close(v, expected.toFloat64Array()[i]));
      pose.local.toFloat64Array().forEach((v, i) => close(v, new DOMMatrix().toFloat64Array()[i]));
    }
  });
  it('compensates the complete pitch/yaw/rail rotation to face the camera', () => {
    for (const index of [-3, -1, 0, 1, 3]) {
      const pose = presentGalleryCard(layout(index), config, viewport, 1);
      const actual = galleryCamera(config).multiply(pose.rail).multiply(pose.local);
      close(actual.m12, 0);
      close(actual.m13, 0);
      close(actual.m21, 0);
      close(actual.m23, 0);
      close(actual.m31, 0);
      close(actual.m32, 0);
      close(actual.m11, actual.m22);
      close(actual.m22, actual.m33);
      expect(pose.lifted).toBeTrue();
    }
  });
  it('fits all four projected corners for left, middle and right hover', () => {
    for (const index of [-3, -2, -1, 0, 1, 2, 3]) {
      const pose = presentGalleryCard(layout(index), config, viewport, 1);
      const bounds = projectCard(pose.camera, viewport);
      expect(bounds.left).toBeGreaterThanOrEqual(viewport.safe.left - 0.01);
      expect(bounds.right).toBeLessThanOrEqual(viewport.safe.right + 0.01);
      expect(bounds.top).toBeGreaterThanOrEqual(viewport.safe.top - 0.01);
      expect(bounds.bottom).toBeLessThanOrEqual(viewport.safe.bottom + 0.01);
    }
  });
  it('spherical orientation interpolation never shears or stretches the face', () => {
    for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
      const m = presentGalleryCard(layout(3), config, viewport, progress).camera;
      const x = [m.m11, m.m12, m.m13],
        y = [m.m21, m.m22, m.m23],
        z = [m.m31, m.m32, m.m33];
      close(Math.hypot(...x), Math.hypot(...y));
      close(Math.hypot(...y), Math.hypot(...z));
      close(
        x.reduce((s, v, i) => s + v * y[i], 0),
        0,
      );
    }
  });
  it('uses highlight-only fallback when the visible scene cannot contain a portrait', () => {
    const narrow = { ...viewport, safe: { left: -100, right: 100, top: -40, bottom: 40 } };
    const pose = presentGalleryCard(layout(0), config, narrow, 1);
    expect(pose.lifted).toBeFalse();
    close(pose.camera.m43, galleryCamera(config).multiply(galleryRail(layout(0))).m43);
  });
  it('moves neighbors in camera space without changing orientation, then returns exactly', () => {
    const base = presentGalleryCard(layout(1), config, viewport, 0);
    const shifted = presentGalleryCard(layout(1), config, viewport, 0, 24, 12);
    expect(shifted.camera.m41).toBeGreaterThan(base.camera.m41);
    expect(shifted.camera.m43).toBeLessThan(base.camera.m43);
    close(shifted.camera.m11, base.camera.m11);
    const returned = presentGalleryCard(layout(1), config, viewport, 0, 0, 0);
    returned.local
      .toFloat64Array()
      .forEach((v, i) => close(v, new DOMMatrix().toFloat64Array()[i]));
  });

  it('keeps a projected lower patch of the left neighbor clear during outer hover', () => {
    for (const position of [0, 0.4, 0.49, 33.95, 34.05]) {
      const selected = getArcCardLayout(Math.round(position) - 3, position, 34, config);
      const neighbor = getArcCardLayout(selected.logicalIndex + 1, position, 34, config);
      const pose = presentGalleryCard(selected, config, viewport, 1, 0, 0, [neighbor]);
      const matrix = galleryCamera(config).multiply(galleryRail(neighbor));
      const point = matrix.transformPoint(
        new DOMPoint(-viewport.width * 0.36, viewport.height * 0.34),
      );
      const y = (point.y * viewport.perspective) / (viewport.perspective - point.z);
      expect(pose.bounds.bottom).toBeLessThanOrEqual(y - 28 + 0.01);
      expect(pose.bounds.top).toBeGreaterThanOrEqual(viewport.safe.top - 0.01);
      expect(pose.lifted).toBeTrue();
      close(pose.camera.m12, 0);
      close(pose.camera.m13, 0);
    }
  });

  it('returns to the identical rail after neighbor-aware hover without changing idle/touch', () => {
    const selected = layout(-3),
      adjacent = [layout(-2)];
    const before = presentGalleryCard(selected, config, viewport, 0);
    const after = presentGalleryCard(selected, config, viewport, 0, 0, 0, adjacent);
    after.camera
      .toFloat64Array()
      .forEach((value, index) => close(value, before.camera.toFloat64Array()[index]));
    after.local
      .toFloat64Array()
      .forEach((value, index) => close(value, new DOMMatrix().toFloat64Array()[index]));
  });
});
