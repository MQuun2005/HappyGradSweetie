import {
  activeChapter,
  AlignmentInput,
  chooseAlignment,
  SectionMetrics,
} from './section-alignment';

describe('Section alignment policy (one correction after native scrolling)', () => {
  const sections: SectionMetrics[] = [
    { id: 'home', top: 0, height: 900 },
    { id: 'invitation', top: 900, height: 900 },
    { id: 'message', top: 1800, height: 900 },
    { id: 'memories', top: 2700, height: 900 },
    { id: 'letter', top: 3600, height: 1600 },
    { id: 'closing', top: 5200, height: 900 },
  ];
  const input = (overrides: Partial<AlignmentInput> = {}): AlignmentInput => ({
    sections,
    y: 1350,
    viewportHeight: 900,
    direction: 1,
    touch: false,
    reducedMotion: false,
    zoomed: false,
    suspended: false,
    gestureActive: false,
    corrected: false,
    storyRange: [0, 900],
    ...overrides,
  });

  for (const touch of [false, true]) {
    for (const direction of [-1, 1] as const) {
      for (const progress of [0.25, 0.5, 0.75]) {
        it(`${touch ? 'touch' : 'desktop'} ${direction > 0 ? 'down' : 'up'} at ${progress * 100}%`, () => {
          const target = chooseAlignment(
            input({ touch, direction, y: 900 + 900 * progress }),
          ).target;
          const next = touch
            ? progress > 0.5 || (progress === 0.5 && direction > 0)
            : direction > 0
              ? progress >= 0.35
              : progress > 0.65;
          expect(target?.id).toBe(next ? 'message' : 'invitation');
        });
      }
    }
  }
  for (const field of [
    'reducedMotion',
    'zoomed',
    'suspended',
    'gestureActive',
    'corrected',
  ] as const) {
    it(`does not correct when ${field}`, () =>
      expect(chooseAlignment(input({ [field]: true })).target).toBeNull());
  }
  it('does not settle inside the sticky opening story', () => {
    expect(chooseAlignment(input({ y: 450 })).reason).toBe('opening-story');
  });
  it('leaves three reading offsets in long Letter untouched', () => {
    for (const y of [3700, 4000, 4400])
      expect(chooseAlignment(input({ y })).reason).toBe('long-content');
  });
  it('does not skip a long section to reach a later short section', () => {
    expect(chooseAlignment(input({ y: 3300 })).target).toBeNull();
  });

  it('treats a rounded subpixel midpoint as a tie on touch', () => {
    expect(chooseAlignment(input({ touch: true, y: 1349.6, direction: 1 })).target?.id).toBe(
      'message',
    );
    expect(chooseAlignment(input({ touch: true, y: 1350.4, direction: -1 })).target?.id).toBe(
      'invitation',
    );
  });
  it('does not repeatedly correct an already aligned section', () => {
    for (const y of [900, 903, 1798, 1800]) expect(chooseAlignment(input({ y })).target).toBeNull();
  });
  it('uses H+8, not 1.12H, to decide whether all section content fits', () => {
    expect(
      chooseAlignment(input({ sections: sections.map((section) => ({ ...section, height: 950 })) }))
        .target,
    ).toBeNull();
  });
  it('rejects invalid viewport metrics', () => {
    for (const viewportHeight of [0, -1, NaN, Infinity])
      expect(chooseAlignment(input({ viewportHeight })).target).toBeNull();
  });
  it('tracks the whole section list with a 64px hysteresis, not observer callback entries', () => {
    expect(activeChapter(sections, 570, 900, 'home')).toBe('home');
    expect(activeChapter(sections, 600, 900, 'home')).toBe('invitation');
    expect(activeChapter(sections, 4050, 900, 'home')).toBe('letter');
  });
});
