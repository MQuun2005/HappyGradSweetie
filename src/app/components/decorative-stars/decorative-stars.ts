import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';

type StarVariant = 'portrait' | 'closing' | 'accent' | 'chapter' | 'gallery' | 'paper';
type Star = readonly [x: number, y: number, size: number, delay: number, duration: number];

// Fixed compositions keep the face and copy clear, with no random layout on reload.
const STARS: Record<Exclude<StarVariant, 'paper'>, readonly Star[]> = {
  portrait: [
    [7, 39, 34, -1.6, 5.8],
    [94, 19, 28, -4.1, 6.6],
    [18, 23, 12, -2.8, 5.1],
    [90, 67, 19, -0.4, 7.2],
    [12, 80, 11, -3.2, 6.2],
    [84, 88, 13, -5, 7.6],
  ],
  closing: [
    [10, 16, 31, -1.6, 6.4],
    [87, 15, 27, -4, 7.2],
    [6, 51, 22, -2.1, 5.8],
    [91, 49, 30, -0.3, 6.8],
    [12, 84, 20, -4.5, 7.8],
    [86, 86, 26, -2.7, 6.1],
    [29, 12, 12, -0.8, 5.9],
    [73, 91, 13, -3.7, 7.1],
    [21, 34, 11, -5, 6.7],
    [81, 31, 12, -1.9, 5.7],
  ],
  accent: [[50, 50, 36, -2.4, 6.8]],
  chapter: [[4, 14, 26, -1.7, 6.6], [96, 20, 23, -4.2, 7.2],
    [4, 68, 18, -2.5, 6.2], [96, 73, 25, -0.6, 7.8],
    [18, 94, 12, -3.8, 6.9], [82, 6, 13, -1.2, 7.1]],
  gallery: [[6, 10, 28, -2, 6.4], [92, 8, 22, -4.4, 7.3],
    [3, 43, 16, -1.2, 6.7], [97, 49, 19, -3.7, 7.8],
    [7, 90, 23, -0.5, 6.8], [91, 91, 14, -5, 7.2]],
};

const DUST: Record<Exclude<StarVariant, 'paper'>, readonly (readonly [number, number])[]> = {
  portrait: [
    [12, 35],
    [4, 45],
    [89, 15],
    [96, 25],
    [86, 71],
    [17, 84],
  ],
  closing: [
    [8, 21],
    [14, 13],
    [90, 20],
    [83, 12],
    [4, 58],
    [96, 55],
    [9, 88],
    [89, 82],
    [26, 15],
    [76, 88],
    [18, 30],
    [84, 36],
  ],
  accent: [
    [13, 68],
    [85, 29],
  ],
  chapter: [[7, 18], [93, 15], [6, 73], [93, 78], [21, 92], [79, 8]],
  gallery: [[8, 13], [89, 11], [5, 47], [95, 54], [9, 93], [89, 88]],
};

@Component({
  selector: 'app-decorative-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './decorative-stars.html',
  styleUrl: './decorative-stars.css',
  host: { 'aria-hidden': 'true', '[attr.data-variant]': 'variant' },
})
export class DecorativeStarsComponent implements AfterViewInit, OnDestroy {
  @Input() variant: StarVariant = 'portrait';
  protected get stars() {
    return STARS[this.variant === 'paper' ? 'chapter' : this.variant];
  }
  protected get dust() {
    return DUST[this.variant === 'paper' ? 'chapter' : this.variant];
  }

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private observer?: IntersectionObserver;
  private inView = false;
  private readonly syncVisibility = () => {
    this.element.style.setProperty(
      '--star-play-state',
      this.inView && !document.hidden ? 'running' : 'paused',
    );
  };

  ngAfterViewInit(): void {
    // CSS owns motion. Observe once per field, not once per star; no RAF or Angular ticks.
    this.zone.runOutsideAngular(() => {
      if (typeof IntersectionObserver !== 'undefined') {
        this.observer = new IntersectionObserver(([entry]) => {
          this.inView = entry.isIntersecting;
          this.syncVisibility();
        });
        this.observer.observe(this.element);
      } else {
        this.inView = true;
      }
      document.addEventListener('visibilitychange', this.syncVisibility);
      this.syncVisibility();
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    document.removeEventListener('visibilitychange', this.syncVisibility);
  }
}
