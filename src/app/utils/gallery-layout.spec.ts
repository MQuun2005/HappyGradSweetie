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

    expect(cards).toHaveSize(13);
    expect(cards[0]).toBe(27);
    expect(cards.at(-1)).toBe(39);
  });

  it('places the centered card closest to the viewer with valid angular values', () => {
    const config = getGalleryLayoutConfig(1440);
    const center = getArcCardLayout(18, 18, 34, config);
    const side = getArcCardLayout(14, 18, 34, config);

    expect(center.z).toBe(0);
    expect(side.z).toBeLessThan(center.z);
    expect(side.rotateY).not.toBe(0);
    expect(side.scale).toBeLessThan(center.scale);
  });
});
