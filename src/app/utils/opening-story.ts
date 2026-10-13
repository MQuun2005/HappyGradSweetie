export type StoryProfile = 'sticky' | 'touch' | 'static';
export interface StoryProfileInput {
  width: number;
  height: number;
  fineHover: boolean;
  reducedMotion: boolean;
  fallback: boolean;
  contentFits: boolean;
  portraitHeight: number;
}

export function getStoryProfile(input: StoryProfileInput): StoryProfile {
  if (input.reducedMotion || input.fallback || input.height < 700 || !input.contentFits)
    return 'static';
  if (input.fineHover && input.width >= 1024 && input.portraitHeight <= input.height - 32)
    return 'sticky';
  return input.fineHover ? 'static' : 'touch';
}

/** Uniform scale first, then clamp translation to the measured portrait's viewport safe rectangle. */
export function storyTravel(
  width: number,
  height: number,
  left: number,
  top: number,
  portraitWidth: number,
  portraitHeight: number,
) {
  const scale = 0.84;
  const scaledRight = left + (portraitWidth * (1 + scale)) / 2;
  const scaledBottom = top + (portraitHeight * (1 + scale)) / 2;
  return {
    x: Math.max(0, Math.min(width * 0.06, width - scaledRight - 24)),
    y: Math.max(0, Math.min(height * 0.08, height - scaledBottom - 24)),
    scale,
  };
}
