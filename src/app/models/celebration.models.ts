export interface Photo {
  readonly id: number;
  readonly src: string;
  readonly thumbnailSrc: string;
  readonly alt: string;
  readonly title: string;
  readonly caption?: string;
  readonly order: number;
  readonly featured: boolean;
}

export interface IntroContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly actionLabel: string;
}

export interface HeroContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly ctaLabel: string;
}

export interface TextSectionContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
}

export interface InvitationContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly recipient: string;
  readonly degree: string;
  readonly school: string;
  readonly dateLabel: string;
  readonly note: string;
}

export interface LetterContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly signature: string;
}

export interface ClosingContent {
  readonly title: string;
  readonly body: string;
  readonly actionLabel: string;
  readonly replayLabel: string;
}

export interface GalleryContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
}

export interface MusicConfig {
  readonly src: string | null;
  readonly title: string;
  readonly volume: number;
  readonly loop: boolean;
}

export interface CelebrationContent {
  readonly intro: IntroContent;
  readonly hero: HeroContent;
  readonly invitation: InvitationContent;
  readonly message: TextSectionContent;
  readonly gallery: GalleryContent;
  readonly letter: LetterContent;
  readonly closing: ClosingContent;
  readonly music: MusicConfig;
  readonly photos: readonly Photo[];
}
