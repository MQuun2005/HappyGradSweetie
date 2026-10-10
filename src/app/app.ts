import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ClosingSectionComponent } from './components/closing-section/closing-section';
import { GraduationHeroComponent } from './components/graduation-hero/graduation-hero';
import { GraduationLetterComponent } from './components/graduation-letter/graduation-letter';
import { GraduationMessageComponent } from './components/graduation-message/graduation-message';
import { InteractivePhotoGalleryComponent } from './components/interactive-photo-gallery/interactive-photo-gallery';
import { PhotoLightboxComponent } from './components/photo-lightbox/photo-lightbox';
import { celebrationContent } from './data/celebration-content';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GraduationHeroComponent,
    GraduationMessageComponent,
    InteractivePhotoGalleryComponent,
    GraduationLetterComponent,
    ClosingSectionComponent,
    PhotoLightboxComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly content = celebrationContent;
  protected readonly lightboxIndex = signal<number | null>(null);

  protected openLightbox(index: number): void {
    if (index >= 0 && index < this.content.photos.length) {
      this.lightboxIndex.set(index);
    }
  }

  protected closeLightbox(): void {
    this.lightboxIndex.set(null);
  }
}
