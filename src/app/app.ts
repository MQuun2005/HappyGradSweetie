import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ClosingSectionComponent } from './components/closing-section/closing-section';
import { GiftIntroComponent } from './components/gift-intro/gift-intro';
import { GraduationHeroComponent } from './components/graduation-hero/graduation-hero';
import { GraduationInvitationComponent } from './components/graduation-invitation/graduation-invitation';
import { GraduationLetterComponent } from './components/graduation-letter/graduation-letter';
import { GraduationMessageComponent } from './components/graduation-message/graduation-message';
import { InteractivePhotoGalleryComponent } from './components/interactive-photo-gallery/interactive-photo-gallery';
import { MusicControlComponent } from './components/music-control/music-control';
import { PhotoLightboxComponent } from './components/photo-lightbox/photo-lightbox';
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
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly content = celebrationContent;
  protected readonly lightboxIndex = signal<number | null>(null);
  protected readonly introVisible = signal(this.shouldShowIntro());

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
