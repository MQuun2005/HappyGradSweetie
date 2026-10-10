import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy,
  signal,
} from '@angular/core';

import { ClosingSectionComponent } from './components/closing-section/closing-section';
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
    PhotoLightboxComponent,
    GiftIntroComponent,
    SectionNavigatorComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  protected readonly content = celebrationContent;
  protected readonly lightboxIndex = signal<number | null>(null);
  protected readonly introVisible = signal(this.shouldShowIntro());
  protected readonly activeSectionId = signal('home');

  private sectionObserver?: IntersectionObserver;
  private isProgrammaticScroll = false;
  private programmaticScrollTimer?: ReturnType<typeof setTimeout>;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const sectionIds = ['home', 'invitation', 'message', 'memories', 'letter', 'closing'];
      const elements = sectionIds
        .map((id) => this.document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

      this.sectionObserver = new IntersectionObserver(
        (entries) => {
          if (this.isProgrammaticScroll) {
            return;
          }

          const visibleEntries = entries.filter((entry) => entry.isIntersecting);
          if (visibleEntries.length > 0) {
            visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            const topSection = visibleEntries[0].target as HTMLElement;
            if (topSection.id) {
              this.activeSectionId.set(topSection.id);
            }
          }
        },
        {
          rootMargin: '-20% 0px -35% 0px',
          threshold: [0.15, 0.4, 0.7],
        },
      );

      elements.forEach((el) => this.sectionObserver?.observe(el));
    }
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
    clearTimeout(this.programmaticScrollTimer);
  }

  protected scrollToSection(id: string): void {
    const element = this.document.getElementById(id);
    if (!element) {
      return;
    }

    this.activeSectionId.set(id);
    this.isProgrammaticScroll = true;
    clearTimeout(this.programmaticScrollTimer);

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', `#${id}`);
    }

    this.programmaticScrollTimer = setTimeout(() => {
      this.isProgrammaticScroll = false;
    }, 850);
  }

  protected openLightbox(index: number): void {
    if (index >= 0 && index < this.content.photos.length) {
      this.lightboxIndex.set(index);
    }
  }

  protected closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  protected replayJourney(): void {
    this.lightboxIndex.set(null);
    try {
      sessionStorage.removeItem('happy-grad-sweetie:intro-seen');
    } catch {
      // The intro can still be replayed when session storage is unavailable.
    }
    this.introVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected openGift(): void {
    try {
      sessionStorage.setItem('happy-grad-sweetie:intro-seen', 'true');
    } catch {
      // Session storage is optional; the gift still opens when it is unavailable.
    }

    this.introVisible.set(false);
  }

  private shouldShowIntro(): boolean {
    try {
      return sessionStorage.getItem('happy-grad-sweetie:intro-seen') !== 'true';
    } catch {
      return true;
    }
  }
}
