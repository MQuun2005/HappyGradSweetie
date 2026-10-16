import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

import { LetterContent } from '../../models/celebration.models';
import { DecorativeStarsComponent } from '../decorative-stars/decorative-stars';

@Component({
  selector: 'app-graduation-letter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecorativeStarsComponent],
  templateUrl: './graduation-letter.html',
  styleUrl: './graduation-letter.css',
})
export class GraduationLetterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('letter') private letterRef!: ElementRef<HTMLElement>;
  @Input({ required: true }) content!: LetterContent;

  readonly hasEntered = signal(false);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!('IntersectionObserver' in window)) {
      this.hasEntered.set(true);
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.hasEntered.set(true);
          this.observer?.disconnect();
        }
      },
      // A long letter can be taller than four viewports with enlarged text.
      // Reveal on entry, not on an unreachable percentage of the entire sheet.
      { threshold: 0 },
    );
    this.observer.observe(this.letterRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
