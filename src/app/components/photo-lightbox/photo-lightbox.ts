import { DOCUMENT } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';

import { Photo } from '../../models/celebration.models';

@Component({
  selector: 'app-photo-lightbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkTrapFocus],
  templateUrl: './photo-lightbox.html',
  styleUrl: './photo-lightbox.css',
})
export class PhotoLightboxComponent implements OnChanges, OnDestroy {
  @ViewChild('dialog') private dialogRef?: ElementRef<HTMLElement>;

  @Input({ required: true }) photos: readonly Photo[] = [];
  @Input() activeIndex: number | null = null;
  @Output() readonly activeIndexChange = new EventEmitter<number>();
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly scrollRestored = new EventEmitter<void>();

  readonly imageFailed = signal(false);
  readonly imageLoading = signal(true);
  private previousFocus?: HTMLElement;
  private originalBodyStyles?: {
    position: string;
    top: string;
    left: string;
    right: string;
    width: string;
    overflow: string;
    paddingRight: string;
  };
  private isScrollLocked = false;
  private lockedScrollY = 0;
  private swipePointerId?: number;
  private swipeStartX = 0;
  private swipeStartY = 0;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly renderer: Renderer2,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const indexChange = changes['activeIndex'];
    if (!indexChange) {
      return;
    }

    this.imageFailed.set(false);
    this.imageLoading.set(true);
    const wasOpen = indexChange.previousValue !== null && indexChange.previousValue !== undefined;
    const isOpen = indexChange.currentValue !== null && indexChange.currentValue !== undefined;

    if (isOpen && !wasOpen) {
      this.lockScroll();
      // Own focus restoration as well as capture: CDK's automatic return can scroll
      // an off-centre gallery card back into view after the saved offset is restored.
      queueMicrotask(() => this.dialogRef?.nativeElement.focus({ preventScroll: true }));
    }

    if (isOpen) {
      this.preloadAdjacentImages();
    }

    if (!isOpen && wasOpen) {
      this.unlockScroll();
      queueMicrotask(() => {
        this.previousFocus?.focus({ preventScroll: true });
        this.scrollRestored.emit();
      });
    }
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  get activePhoto(): Photo | null {
    if (
      this.activeIndex === null ||
      this.activeIndex < 0 ||
      this.activeIndex >= this.photos.length
    ) {
      return null;
    }

    return this.photos[this.activeIndex];
  }

  get canGoPrevious(): boolean {
    return this.activeIndex !== null && this.photos.length > 1;
  }

  get canGoNext(): boolean {
    return this.activeIndex !== null && this.photos.length > 1;
  }

  previous(): void {
    if (this.canGoPrevious && this.activeIndex !== null) {
      this.activeIndexChange.emit((this.activeIndex - 1 + this.photos.length) % this.photos.length);
    }
  }

  next(): void {
    if (this.canGoNext && this.activeIndex !== null) {
      this.activeIndexChange.emit((this.activeIndex + 1) % this.photos.length);
    }
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    }
  }

  onMediaPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    this.swipePointerId = event.pointerId;
    this.swipeStartX = event.clientX;
    this.swipeStartY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onMediaPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.swipePointerId) {
      return;
    }
    const deltaX = event.clientX - this.swipeStartX;
    const deltaY = event.clientY - this.swipeStartY;
    this.swipePointerId = undefined;
    if (Math.abs(deltaX) >= 44 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        this.next();
      } else {
        this.previous();
      }
    }
  }

  clearMediaPointer(event: PointerEvent): void {
    if (event.pointerId === this.swipePointerId) {
      this.swipePointerId = undefined;
    }
  }

  markImageFailed(): void {
    this.imageFailed.set(true);
    this.imageLoading.set(false);
  }

  markImageLoaded(): void {
    this.imageLoading.set(false);
  }

  private lockScroll(): void {
    if (this.isScrollLocked) {
      return;
    }

    this.isScrollLocked = true;
    this.previousFocus =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : undefined;
    this.lockedScrollY = typeof window === 'undefined' ? 0 : window.scrollY;
    this.originalBodyStyles = {
      position: this.document.body.style.position,
      top: this.document.body.style.top,
      left: this.document.body.style.left,
      right: this.document.body.style.right,
      width: this.document.body.style.width,
      overflow: this.document.body.style.overflow,
      paddingRight: this.document.body.style.paddingRight,
    };

    const scrollbarWidth =
      typeof window === 'undefined'
        ? 0
        : window.innerWidth - this.document.documentElement.clientWidth;
    this.renderer.setStyle(this.document.body, 'position', 'fixed');
    this.renderer.setStyle(this.document.body, 'top', `-${this.lockedScrollY}px`);
    this.renderer.setStyle(this.document.body, 'left', '0');
    this.renderer.setStyle(this.document.body, 'right', '0');
    this.renderer.setStyle(this.document.body, 'width', '100%');
    this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
    // Mobile layout overflow is not a scrollbar (it can be hundreds of pixels).
    if (scrollbarWidth > 0 && scrollbarWidth <= 32) {
      this.renderer.setStyle(this.document.body, 'padding-right', `${scrollbarWidth}px`);
    }
  }

  private unlockScroll(): void {
    if (!this.isScrollLocked) {
      return;
    }

    this.isScrollLocked = false;
    if (this.originalBodyStyles) {
      Object.assign(this.document.body.style, this.originalBodyStyles);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: this.lockedScrollY, behavior: 'instant' });
    }
    this.originalBodyStyles = undefined;
  }

  private preloadAdjacentImages(): void {
    if (typeof Image === 'undefined' || this.activeIndex === null || this.photos.length < 2) {
      return;
    }

    const indexes = [
      (this.activeIndex - 1 + this.photos.length) % this.photos.length,
      (this.activeIndex + 1) % this.photos.length,
    ];

    for (const index of indexes) {
      const image = new Image();
      image.decoding = 'async';
      image.src = this.photos[index].src;
    }
  }
}
