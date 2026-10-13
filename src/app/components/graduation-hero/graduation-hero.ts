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

@Component({
  selector: 'app-graduation-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GraduationPortraitComponent],
  templateUrl: './graduation-hero.html',
  styleUrl: './graduation-hero.css',
})
export class GraduationHeroComponent {
  @Input({ required: true }) content!: HeroContent;
  @Output() readonly sectionRequested = new EventEmitter<string>();
  protected readonly portraitFallback = signal(false);

  protected navigateToInvitation(event: MouseEvent): void {
    // Modified clicks retain normal anchor/new-tab behavior.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.sectionRequested.emit('invitation');
  }
}
