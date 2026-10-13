import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';

import { HeroContent } from '../../models/celebration.models';

@Component({
  selector: 'app-graduation-portrait',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graduation-portrait.html',
  styleUrl: './graduation-portrait.css',
  host: { '[class.portrait--editorial]': 'fallbackStep() === 2' },
})
export class GraduationPortraitComponent implements OnChanges {
  @Input({ required: true }) content!: HeroContent;
  @Output() readonly fallbackChanged = new EventEmitter<boolean>();

  // 0: WebP picture, 1: approved PNG, 2: original editorial, 3: readable error.
  readonly fallbackStep = signal(0);

  ngOnChanges(): void {
    this.fallbackStep.set(0);
    this.fallbackChanged.emit(false);
  }

  protected onImageError(): void {
    if (this.fallbackStep() < 3) {
      this.fallbackStep.update((step) => step + 1);
      this.fallbackChanged.emit(this.fallbackStep() >= 2);
    }
  }
}
