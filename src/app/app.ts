import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Inject,
  NgZone,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

import { ClosingSectionComponent } from './components/closing-section/closing-section';
import { CursorStardustComponent } from './components/cursor-stardust/cursor-stardust';
import { GiftIntroComponent } from './components/gift-intro/gift-intro';
import { GraduationHeroComponent } from './components/graduation-hero/graduation-hero';
import { GraduationInvitationComponent } from './components/graduation-invitation/graduation-invitation';
import { GraduationLetterComponent } from './components/graduation-letter/graduation-letter';
import { GraduationMessageComponent } from './components/graduation-message/graduation-message';
import { InteractivePhotoGalleryComponent } from './components/interactive-photo-gallery/interactive-photo-gallery';
import { MusicControlComponent } from './components/music-control/music-control';
import { PhotoLightboxComponent } from './components/photo-lightbox/photo-lightbox';
import { SectionNavigatorComponent } from './components/section-navigator/section-navigator';
import { celebrationContent } from './data/celebration-content';
import { OpeningStoryDirective } from './directives/opening-story.directive';

import { isSectionId, SectionId } from './utils/section-alignment';
import { SectionScrollController } from './utils/section-scroll-controller';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GraduationHeroComponent,
    GraduationInvitationComponent,
    GraduationMessageComponent,
    InteractivePhotoGalleryComponent,
    MusicControlComponent,
    GraduationLetterComponent,
    ClosingSectionComponent,
    CursorStardustComponent,
    PhotoLightboxComponent,
    GiftIntroComponent,
    SectionNavigatorComponent,
    OpeningStoryDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild(MusicControlComponent) private musicControl?: MusicControlComponent;

  @ViewChild(OpeningStoryDirective) private openingStory?: OpeningStoryDirective;

  protected readonly content = celebrationContent;
  protected readonly lightboxIndex = signal<number | null>(null);
  protected readonly introVisible = signal(this.shouldShowIntro());
  protected readonly activeSectionId = signal<SectionId>('home');
  protected readonly replayToken = signal(0);

  private scrolling?: SectionScrollController;
  private pageLockScrollY = 0;
  private pageLockStyles?: {
    position: string;
    top: string;
    left: string;
    right: string;
    width: string;
    overflow: string;
  };

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.scrolling = new SectionScrollController(this.document, {
        active: (id) => this.ngZone.run(() => this.activeSectionId.set(id)),
        layout: () => this.openingStory?.refreshLayout(),
        synchronize: () => this.openingStory?.synchronize(),
      });
    });
    if (this.introVisible()) this.lockPageScroll();
  }

  ngOnDestroy(): void {
    this.scrolling?.destroy();
    this.unlockPageScroll();
  }

  protected scrollToSection(id: string): void {
    if (isSectionId(id)) this.scrolling?.navigate(id);
  }

  protected openLightbox(index: number): void {
    if (index >= 0 && index < this.content.photos.length) {
      this.scrolling?.suspend();
      this.lightboxIndex.set(index);
    }
  }

  protected closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  protected onLightboxRestored(): void {
    if (!this.introVisible()) this.scrolling?.resume();
  }

  protected replayJourney(): void {
    this.lightboxIndex.set(null);
    try {
      sessionStorage.removeItem('happy-grad-sweetie:intro-seen');
    } catch {
      // Session storage is optional; replay remains available.
    }

    this.scrolling?.navigate('home', 'replace', false);
    this.activeSectionId.set('home');
    this.introVisible.set(true);
    this.replayToken.update((token) => token + 1);
    this.lockPageScroll();
  }

  protected openGift(): void {
    // This call stays in the button's trusted click event for iOS/Safari autoplay policy.
    this.musicControl?.playFromUserGesture();
    try {
      sessionStorage.setItem('happy-grad-sweetie:intro-seen', 'true');
    } catch {
      // Session storage is optional; the gift still opens when it is unavailable.
    }

    this.introVisible.set(false);
    this.unlockPageScroll();

    this.scrolling?.resume();
  }

  private lockPageScroll(): void {
    if (typeof window === 'undefined' || this.pageLockStyles) {
      return;
    }

    this.scrolling?.suspend();
    const body = this.document.body;
    this.pageLockScrollY = window.scrollY;
    this.pageLockStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${this.pageLockScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }

  private unlockPageScroll(): void {
    if (typeof window === 'undefined' || !this.pageLockStyles) {
      return;
    }

    const body = this.document.body;
    Object.assign(body.style, this.pageLockStyles);
    const scrollY = this.pageLockScrollY;
    this.pageLockStyles = undefined;
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  }

  private shouldShowIntro(): boolean {
    try {
      return sessionStorage.getItem('happy-grad-sweetie:intro-seen') !== 'true';
    } catch {
      return true;
    }
  }
}
