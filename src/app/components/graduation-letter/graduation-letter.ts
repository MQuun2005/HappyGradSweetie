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

@Component({
  selector: 'app-graduation-letter',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      { threshold: 0.25 },
    );
    this.observer.observe(this.letterRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
