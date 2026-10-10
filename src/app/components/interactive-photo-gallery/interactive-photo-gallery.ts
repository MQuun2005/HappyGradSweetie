import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { gsap } from 'gsap';

import { GalleryContent, Photo } from '../../models/celebration.models';
import {
  COMPACT_PHOTOS_PER_PAGE,
  DESKTOP_PHOTOS_PER_PAGE,
  GalleryCardLayout,
  getCardLayout,
  getPhotoPage,
  getPhotoPageCount,
} from '../../utils/gallery-layout';

@Component({
  selector: 'app-interactive-photo-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './interactive-photo-gallery.html',
  styleUrl: './interactive-photo-gallery.css',
})
export class InteractivePhotoGalleryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scene') private sceneRef!: ElementRef<HTMLElement>;

  @Input({ required: true })
  set photos(value: readonly Photo[]) {
    this.photosSource.set(value);
    this.keepPageInRange();
  }

  @Input({ required: true }) content!: GalleryContent;

  @Output() readonly photoRequested = new EventEmitter<number>();

  private readonly photosSource = signal<readonly Photo[]>([]);
  readonly pageIndex = signal(0);
  readonly photosPerPage = signal(DESKTOP_PHOTOS_PER_PAGE);
  readonly activePhotoId = signal<number | null>(null);
  readonly isNavigating = signal(false);
  readonly hasEntered = signal(false);
  readonly isCompact = signal(false);
  readonly brokenPhotoIds = signal<ReadonlySet<number>>(new Set());

  readonly totalPages = computed(() =>
    getPhotoPageCount(this.photosSource().length, this.photosPerPage()),
  );
  readonly visiblePhotos = computed(() =>
    getPhotoPage(this.photosSource(), this.pageIndex(), this.photosPerPage()),
  );
  readonly currentStart = computed(() => this.pageIndex() * this.photosPerPage());

  private observer?: IntersectionObserver;
  private mediaQuery?: MediaQueryList;
  private removePointerMove?: () => void;
  private removePointerLeave?: () => void;
  private pointerFrame = 0;
  private revealFrame = 0;
  private navigationTimeline?: gsap.core.Timeline;
  private gsapContext?: gsap.Context;
  private prefersReducedMotion = false;
  private supportsFinePointer = false;

  constructor(
    private readonly zone: NgZone,
    private readonly renderer: Renderer2,
  ) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      this.enterGallery();
      return;
    }

    this.mediaQuery = window.matchMedia('(max-width: 640px)');
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.updatePageSize(this.mediaQuery.matches ? COMPACT_PHOTOS_PER_PAGE : DESKTOP_PHOTOS_PER_PAGE);
    this.mediaQuery.addEventListener('change', this.onViewportChange);

    const scene = this.sceneRef.nativeElement;
    this.gsapContext = gsap.context(() => undefined, scene);

    this.zone.runOutsideAngular(() => {
      this.removePointerMove = this.renderer.listen(scene, 'pointermove', (event: Event) =>
        this.onPointerMove(event as PointerEvent),
      );
      this.removePointerLeave = this.renderer.listen(scene, 'pointerleave', () => this.resetParallax());
    });

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) {
            return;
          }

          this.zone.run(() => this.enterGallery());
          this.observer?.disconnect();
        },
        { threshold: 0.22 },
      );
      this.observer.observe(scene);
      return;
    }

    this.enterGallery();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.mediaQuery?.removeEventListener('change', this.onViewportChange);
    this.removePointerMove?.();
    this.removePointerLeave?.();
    this.navigationTimeline?.kill();
    this.gsapContext?.revert();

    if (this.pointerFrame) {
      cancelAnimationFrame(this.pointerFrame);
    }
    if (this.revealFrame) {
      cancelAnimationFrame(this.revealFrame);
    }
  }

  get canGoPrevious(): boolean {
    return this.pageIndex() > 0 && !this.isNavigating();
  }

  get canGoNext(): boolean {
    return this.pageIndex() < this.totalPages() - 1 && !this.isNavigating();
  }

  get photoCount(): number {
    return this.photosSource().length;
  }

  layoutFor(slotIndex: number): GalleryCardLayout {
    return getCardLayout(slotIndex, this.visiblePhotos().length);
  }

  isFocused(photoId: number): boolean {
    return this.activePhotoId() === photoId;
  }

  isBroken(photoId: number): boolean {
    return this.brokenPhotoIds().has(photoId);
  }

  focusPhoto(photoId: number): void {
    if (!this.isNavigating()) {
      this.activePhotoId.set(photoId);
    }
  }

  clearFocusedPhoto(): void {
    if (this.supportsFinePointer) {
      this.activePhotoId.set(null);
    }
  }

  handlePhotoClick(photoId: number, localIndex: number): void {
    if (this.isNavigating()) {
      return;
    }

    if (!this.supportsFinePointer && this.activePhotoId() !== photoId) {
      this.activePhotoId.set(photoId);
      return;
    }

    this.photoRequested.emit(this.currentStart() + localIndex);
  }

  markImageFailed(photoId: number): void {
    this.brokenPhotoIds.update((current) => new Set(current).add(photoId));
  }

  previousPage(): void {
    this.navigateTo(this.pageIndex() - 1);
  }

  nextPage(): void {
    this.navigateTo(this.pageIndex() + 1);
  }

  onSceneKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const currentIndex = this.visiblePhotos().findIndex((photo) => photo.id === this.activePhotoId());
    const nextIndex = currentIndex === -1 ? 0 : currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < this.visiblePhotos().length) {
      this.activePhotoId.set(this.visiblePhotos()[nextIndex].id);
      return;
    }

    this.navigateTo(this.pageIndex() + direction);
  }

  private readonly onViewportChange = (): void => {
    if (!this.mediaQuery) {
      return;
    }

    this.zone.run(() => {
      this.updatePageSize(
        this.mediaQuery?.matches ? COMPACT_PHOTOS_PER_PAGE : DESKTOP_PHOTOS_PER_PAGE,
      );
    });
  };

  private updatePageSize(nextPageSize: number): void {
    if (this.photosPerPage() === nextPageSize) {
      this.isCompact.set(nextPageSize === COMPACT_PHOTOS_PER_PAGE);
      return;
    }

    const firstVisibleIndex = this.currentStart();
    this.photosPerPage.set(nextPageSize);
    this.isCompact.set(nextPageSize === COMPACT_PHOTOS_PER_PAGE);
    this.pageIndex.set(Math.floor(firstVisibleIndex / nextPageSize));
    this.keepPageInRange();

    if (this.hasEntered()) {
      this.scheduleReveal();
    }
  }

  private keepPageInRange(): void {
    const pageCount = getPhotoPageCount(this.photosSource().length, this.photosPerPage());
    if (this.pageIndex() >= pageCount) {
      this.pageIndex.set(pageCount - 1);
    }
  }

  private enterGallery(): void {
    if (this.hasEntered()) {
      return;
    }

    this.hasEntered.set(true);
    this.scheduleReveal();
    this.preloadNextPage();
  }

  private navigateTo(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages() || this.isNavigating()) {
      return;
    }

    this.isNavigating.set(true);
    this.activePhotoId.set(null);

    const commitPageChange = () => {
      this.pageIndex.set(nextPage);
      this.scheduleReveal(() => this.isNavigating.set(false));
      this.preloadNextPage();
    };

    if (this.prefersReducedMotion) {
      commitPageChange();
      return;
    }

    const cards = this.getCardElements();
    if (!cards.length) {
      commitPageChange();
      return;
    }

    this.navigationTimeline?.kill();
    this.navigationTimeline = this.createTimeline({ onComplete: commitPageChange });
    this.navigationTimeline.to(cards, {
      '--enter-y': '-18px',
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      stagger: { each: 0.025, from: 'center' },
    });
  }

  private scheduleReveal(onComplete?: () => void): void {
    if (this.revealFrame) {
      cancelAnimationFrame(this.revealFrame);
    }

    this.revealFrame = requestAnimationFrame(() => {
      this.revealFrame = 0;
      this.animateCurrentCards(onComplete);
    });
  }

  private animateCurrentCards(onComplete?: () => void): void {
    const cards = this.getCardElements();
    if (!cards.length) {
      onComplete?.();
      return;
    }

    this.navigationTimeline?.kill();
    if (this.prefersReducedMotion) {
      gsap.set(cards, { '--enter-y': '0px', '--enter-z': '0px', opacity: 1 });
      onComplete?.();
      return;
    }

    gsap.set(cards, { '--enter-y': '40px', '--enter-z': '-45px', opacity: 0 });
    this.navigationTimeline = this.createTimeline({ onComplete });
    this.navigationTimeline.to(cards, {
      '--enter-y': '0px',
      '--enter-z': '0px',
      opacity: 1,
      duration: 0.56,
      ease: 'power3.out',
      stagger: { each: 0.07, from: 'center' },
    });
  }

  private createTimeline(vars: gsap.TimelineVars): gsap.core.Timeline {
    let timeline!: gsap.core.Timeline;
    const create = () => {
      timeline = gsap.timeline(vars);
      return timeline;
    };

    if (this.gsapContext) {
      this.gsapContext.add(create);
    } else {
      create();
    }

    return timeline;
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.supportsFinePointer || this.prefersReducedMotion || this.pointerFrame) {
      return;
    }

    const scene = this.sceneRef.nativeElement;
    const bounds = scene.getBoundingClientRect();
    const normalizedX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const normalizedY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    this.pointerFrame = requestAnimationFrame(() => {
      this.pointerFrame = 0;
      scene.style.setProperty('--pointer-x', `${Math.max(-8, Math.min(8, normalizedX * 8)).toFixed(2)}px`);
      scene.style.setProperty('--pointer-y', `${Math.max(-6, Math.min(6, normalizedY * 6)).toFixed(2)}px`);
    });
  }

  private resetParallax(): void {
    if (!this.sceneRef) {
      return;
    }

    this.sceneRef.nativeElement.style.setProperty('--pointer-x', '0px');
    this.sceneRef.nativeElement.style.setProperty('--pointer-y', '0px');
  }

  private preloadNextPage(): void {
    if (typeof Image === 'undefined') {
      return;
    }

    const nextPhotos = getPhotoPage(
      this.photosSource(),
      this.pageIndex() + 1,
      this.photosPerPage(),
    );

    for (const photo of nextPhotos) {
      const image = new Image();
      image.decoding = 'async';
      image.src = photo.thumbnailSrc;
    }
  }

  private getCardElements(): HTMLElement[] {
    return Array.from(this.sceneRef?.nativeElement.querySelectorAll<HTMLElement>('.photo-card') ?? []);
  }
}
