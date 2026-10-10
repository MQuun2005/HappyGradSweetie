import {
  getArcCardLayout,
  getGalleryLayoutConfig,
  getVirtualLogicalIndices,
  positiveModulo,
} from './gallery-layout';

describe('gallery layout', () => {
  it('maps logical indexes through the 34-photo loop in both directions', () => {
    expect(positiveModulo(34, 34)).toBe(0);
    expect(positiveModulo(-1, 34)).toBe(33);
    expect(positiveModulo(69, 34)).toBe(1);
  });

  it('keeps a bounded virtual window around the current position', () => {
    const config = getGalleryLayoutConfig(1440);
    const cards = getVirtualLogicalIndices(33.8, config);

    expect(cards).toHaveSize(11);
    expect(cards[0]).toBe(28);
    expect(cards.at(-1)).toBe(38);
  });

  it('keeps the centered card closest after the 3/4 camera projection', () => {
    const config = getGalleryLayoutConfig(1440);
    const center = getArcCardLayout(18, 18, 34, config);
    const leftRail = getArcCardLayout(15, 18, 34, config);
    const rightRail = getArcCardLayout(21, 18, 34, config);

    expect(center.projectedDepth).toBeGreaterThan(leftRail.projectedDepth);
    expect(center.projectedDepth).toBeGreaterThan(rightRail.projectedDepth);
    expect(leftRail.rotateY).not.toBe(0);
    expect(rightRail.rotateY).not.toBe(0);
    expect(Math.abs(leftRail.rotateY)).toBeLessThanOrEqual(48);
    expect(Math.abs(rightRail.rotateY)).toBeLessThanOrEqual(48);
    expect(leftRail.scale).toBeLessThan(center.scale);
    expect(rightRail.scale).toBeLessThan(center.scale);
  });

  it('uses a shallow rail elevation instead of the symmetric photo-fan lift', () => {
    const config = getGalleryLayoutConfig(1440);
    const leftRail = getArcCardLayout(15, 18, 34, config);
    const rightRail = getArcCardLayout(21, 18, 34, config);

    expect(Math.abs(leftRail.y)).toBeLessThan(40);
    expect(Math.abs(rightRail.y)).toBeLessThan(40);
    expect(leftRail.y).not.toBe(rightRail.y);
  });

  it('creates finite geometry for every responsive viewport', () => {
    for (const width of [360, 390, 768, 1366, 1440, 1920]) {
      const config = getGalleryLayoutConfig(width);
      const cards = getVirtualLogicalIndices(33.8, config);

      expect(cards).toHaveSize((config.visibleRadius + config.buffer) * 2 + 1);
      for (const logicalIndex of cards) {
        const layout = getArcCardLayout(logicalIndex, 33.8, 34, config);
        expect(Number.isFinite(layout.x)).toBeTrue();
        expect(Number.isFinite(layout.y)).toBeTrue();
        expect(Number.isFinite(layout.z)).toBeTrue();
        expect(layout.photoIndex).toBeGreaterThanOrEqual(0);
        expect(layout.photoIndex).toBeLessThan(34);
      }
    }
  });

  it('keeps tablet touch profiles distinct from desktop geometry', () => {
    const ipadPortrait = getGalleryLayoutConfig(820, 1180, true);
    const ipadLandscape = getGalleryLayoutConfig(1180, 820, true);

    expect(ipadPortrait.visibleRadius).toBe(2);
    expect(ipadLandscape.visibleRadius).toBe(3);
    expect(ipadLandscape.cameraYaw).toBeGreaterThan(ipadPortrait.cameraYaw);
    expect(ipadLandscape.verticalTravel).toBeLessThan(18);
  });
});
