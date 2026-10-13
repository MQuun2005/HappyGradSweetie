export const SECTION_IDS = [
  'home',
  'invitation',
  'message',
  'memories',
  'letter',
  'closing',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export type ScrollDirection = -1 | 0 | 1;
export interface SectionMetrics {
  id: SectionId;
  top: number;
  height: number;
}
export interface AlignmentInput {
  sections: readonly SectionMetrics[];
  y: number;
  viewportHeight: number;
  direction: ScrollDirection;
  touch: boolean;
  reducedMotion: boolean;
  zoomed: boolean;
  suspended: boolean;
  gestureActive: boolean;
  corrected: boolean;
  storyRange: readonly [number, number] | null;
}
export interface AlignmentDecision {
  target: SectionMetrics | null;
  reason: string;
}

export function isSectionId(id: string): id is SectionId {
  return (SECTION_IDS as readonly string[]).includes(id);
}

export function chooseAlignment(input: AlignmentInput): AlignmentDecision {
  const none = (reason: string): AlignmentDecision => ({ target: null, reason });
  const { sections, y, viewportHeight: height } = input;
  if (!Number.isFinite(y) || !Number.isFinite(height) || height <= 0)
    return none('invalid-metrics');
  if (input.suspended || input.gestureActive) return none('interaction');
  if (input.reducedMotion || input.zoomed) return none('native-accessibility');
  if (input.corrected) return none('already-corrected');
  if (input.storyRange && y > input.storyRange[0] + 4 && y < input.storyRange[1] - 4)
    return none('opening-story');
  const index = sections.findIndex(
    (section, i) => i + 1 < sections.length && y >= section.top && y <= sections[i + 1].top,
  );
  if (index < 0) return none('outside-pair');
  const a = sections[index],
    b = sections[index + 1];
  if (a.height > height + 8 || b.height > height + 8) return none('long-content');
  const distance = b.top - a.top;
  if (distance <= 0 || distance > height * 1.12) return none('distant-anchors');
  const progress = (y - a.top) / distance;
  let target: SectionMetrics;
  if (input.touch || input.direction === 0) {
    // Browser scroll offsets are rounded; a subpixel midpoint is still a tie.
    const atMidpoint = Math.abs(y - (a.top + b.top) / 2) <= 1;
    target = atMidpoint ? (input.direction < 0 ? a : b) : progress < 0.5 ? a : b;
  } else {
    target = input.direction > 0 ? (progress >= 0.35 ? b : a) : progress <= 0.65 ? a : b;
  }
  return Math.abs(target.top - y) <= 4 ? none('aligned') : { target, reason: 'short-pair' };
}

export function activeChapter(
  sections: readonly SectionMetrics[],
  y: number,
  height: number,
  current?: SectionId,
): SectionId {
  const line = y + height * 0.42;
  const previous = sections.find((section) => section.id === current);
  if (previous && line >= previous.top - 64 && line <= previous.top + previous.height + 64)
    return previous.id;
  const containing = sections.find(
    (section) => line >= section.top && line < section.top + section.height,
  );
  if (containing) return containing.id;
  return (
    sections.reduce<SectionMetrics | undefined>((best, section) => {
      const distance = Math.min(
        Math.abs(section.top - line),
        Math.abs(section.top + section.height - line),
      );
      if (!best) return section;
      const bestDistance = Math.min(
        Math.abs(best.top - line),
        Math.abs(best.top + best.height - line),
      );
      return distance < bestDistance ? section : best;
    }, undefined)?.id ?? 'home'
  );
}
