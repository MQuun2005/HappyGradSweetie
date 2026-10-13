import { getStoryProfile, storyTravel } from './opening-story';

describe('Opening story profiles and safe translation', () => {
  const desktop = {
    width: 1440,
    height: 900,
    fineHover: true,
    reducedMotion: false,
    fallback: false,
    contentFits: true,
    portraitHeight: 702,
  };
  it('uses sticky only for a tall, fitting, fine-pointer desktop', () =>
    expect(getStoryProfile(desktop)).toBe('sticky'));
  it('never treats a wide touch iPad as a hover desktop', () => {
    expect(getStoryProfile({ ...desktop, width: 1180, height: 820, fineHover: false })).toBe(
      'touch',
    );
    expect(getStoryProfile({ ...desktop, width: 820, height: 1180, fineHover: false })).toBe(
      'touch',
    );
  });
  it('falls back for reduced motion, source fallback, tall text or low landscape', () => {
    for (const change of [
      { reducedMotion: true },
      { fallback: true },
      { contentFits: false },
      { height: 393 },
    ]) {
      expect(getStoryProfile({ ...desktop, ...change })).toBe('static');
    }
  });
  it('clamps uniform portrait travel inside the viewport', () => {
    const { x, y, scale } = storyTravel(1440, 900, 880, 125, 500, 750);
    expect(x).toBeLessThanOrEqual(1440 * 0.06);
    expect(y).toBeLessThanOrEqual(900 * 0.08);
    expect(880 + x + (500 * (1 + scale)) / 2).toBeLessThanOrEqual(1416);
    expect(125 + y + (750 * (1 + scale)) / 2).toBeLessThanOrEqual(876);
  });
});
