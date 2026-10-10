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

  readonly imageFailed = signal(false);
  private previousFocus?: HTMLElement;
  private originalBodyOverflow = '';
  private originalBodyPaddingRight = '';
  private isScrollLocked = false;

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
    const wasOpen = indexChange.previousValue !== null && indexChange.previousValue !== undefined;
    const isOpen = indexChange.currentValue !== null && indexChange.currentValue !== undefined;

    if (isOpen && !wasOpen) {
      this.lockScroll();
      queueMicrotask(() => this.dialogRef?.nativeElement.focus());
    }

    if (!isOpen && wasOpen) {
      this.unlockScroll();
      queueMicrotask(() => this.previousFocus?.focus());
    }
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  get activePhoto(): Photo | null {
    if (this.activeIndex === null || this.activeIndex < 0 || this.activeIndex >= this.photos.length) {
      return null;
    }

    return this.photos[this.activeIndex];
  }

  get canGoPrevious(): boolean {
    return this.activeIndex !== null && this.activeIndex > 0;
  }

  get canGoNext(): boolean {
    return this.activeIndex !== null && this.activeIndex < this.photos.length - 1;
  }

  previous(): void {
    if (this.canGoPrevious && this.activeIndex !== null) {
      this.activeIndexChange.emit(this.activeIndex - 1);
    }
  }

  next(): void {
    if (this.canGoNext && this.activeIndex !== null) {
      this.activeIndexChange.emit(this.activeIndex + 1);
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

  markImageFailed(): void {
    this.imageFailed.set(true);
  }

  private lockScroll(): void {
    if (this.isScrollLocked) {
      return;
    }

    this.isScrollLocked = true;
    this.previousFocus = this.document.activeElement instanceof HTMLElement ? this.document.activeElement : undefined;
    this.originalBodyOverflow = this.document.body.style.overflow;
    this.originalBodyPaddingRight = this.document.body.style.paddingRight;

    const scrollbarWidth =
      typeof window === 'undefined' ? 0 : window.innerWidth - this.document.documentElement.clientWidth;
    this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
    if (scrollbarWidth > 0) {
      this.renderer.setStyle(this.document.body, 'padding-right', `${scrollbarWidth}px`);
    }
  }

  private unlockScroll(): void {
    if (!this.isScrollLocked) {
      return;
    }

    this.isScrollLocked = false;
    this.renderer.setStyle(this.document.body, 'overflow', this.originalBodyOverflow);
    this.renderer.setStyle(this.document.body, 'padding-right', this.originalBodyPaddingRight);
  }
}
