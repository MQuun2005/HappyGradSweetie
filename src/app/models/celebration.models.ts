export interface Photo {
  readonly id: number;
  readonly src: string;
  readonly thumbnailSrc: string;
  readonly alt: string;
  readonly title: string;
  readonly caption: string;
  readonly order: number;
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
}

export interface GalleryContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
}

export interface CelebrationContent {
  readonly hero: HeroContent;
  readonly message: TextSectionContent;
  readonly gallery: GalleryContent;
  readonly letter: LetterContent;
  readonly closing: ClosingContent;
  readonly photos: readonly Photo[];
}
