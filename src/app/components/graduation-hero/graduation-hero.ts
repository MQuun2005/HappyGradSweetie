import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';

import { HeroContent } from '../../models/celebration.models';
import { GraduationPortraitComponent } from '../graduation-portrait/graduation-portrait';
import { DecorativeStarsComponent } from '../decorative-stars/decorative-stars';

@Component({
  selector: 'app-graduation-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GraduationPortraitComponent, DecorativeStarsComponent],
  templateUrl: './graduation-hero.html',
  styleUrl: './graduation-hero.css',
})
export class GraduationHeroComponent {
  @Input({ required: true }) content!: HeroContent;
  @Output() readonly sectionRequested = new EventEmitter<string>();
  protected readonly portraitFallback = signal(false);

  protected get titleLines(): readonly string[] {
    // Keep the author's exact wording, but give the greeting a deliberate rhythm.
    // Unrecognised titles retain natural wrapping; no fixed-width/no-wrap text.
    const match = this.content.title.match(/^(Chúc mừng\s+)(tốt nghiệp[,.!?]?)(\s+.+)?$/iu);
    return match
      ? match.slice(1).filter((line): line is string => line !== undefined)
      : [this.content.title];
  }

  protected navigateToInvitation(event: MouseEvent): void {
    // Modified clicks retain normal anchor/new-tab behavior.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.sectionRequested.emit('invitation');
  }
}
