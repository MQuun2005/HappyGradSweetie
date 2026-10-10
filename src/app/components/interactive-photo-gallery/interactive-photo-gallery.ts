import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { gsap } from 'gsap';

import { GalleryContent, Photo } from '../../models/celebration.models';
import {
  ArcCardLayout,
  getArcCardLayout,
  getClosestLogicalIndex,
  getGalleryLayoutConfig,
  getGalleryViewport,
  getVirtualLogicalIndices,
} from '../../utils/gallery-layout';

interface RenderedGalleryCard {
  readonly logicalIndex: number;
  readonly photo: Photo;
  readonly layout: ArcCardLayout;
}

@Component({
  selector: 'app-interactive-photo-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './interactive-photo-gallery.html',
  styleUrl: './interactive-photo-gallery.css',
})
export class InteractivePhotoGalleryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scene') private sceneRef!: ElementRef<HTMLElement>;

  @Input({ required: true }) content!: GalleryContent;

  @Input()
  set suspended(value: boolean) {
    this.isSuspended.set(value);
    this.syncAutoMotion();
  }

  @Input({ required: true })
  set photos(value: readonly Photo[]) {
    this.photosSource.set([...value].sort((left, right) => left.order - right.order));
    this.syncAutoMotion();
  }

  @Output() readonly photoRequested = new EventEmitter<number>();

  private readonly photosSource = signal<readonly Photo[]>([]);
  private readonly position = signal(0);
  private readonly viewportWidth = signal(1280);
  readonly isSuspended = signal(false);
  readonly focusedLogicalIndex = signal<number | null>(null);
  readonly brokenPhotoIds = signal<ReadonlySet<number>>(new Set());
  readonly isDragging = signal(false);
  readonly isAutoPlaying = signal(false);

  readonly layoutConfig = computed(() => getGalleryLayoutConfig(this.viewportWidth()));
  readonly isCompact = computed(() => getGalleryViewport(this.viewportWidth()) === 'compact');
  readonly renderedCards = computed<readonly RenderedGalleryCard[]>(() => {
    const photos = this.photosSource();
    if (!photos.length) {
      return [];
    }

    const position = this.position();
    const config = this.layoutConfig();

    return getVirtualLogicalIndices(position, config).map((logicalIndex) => {
      const layout = getArcCardLayout(logicalIndex, position, photos.length, config);
      return { logicalIndex, photo: photos[layout.photoIndex], layout };
    });
  });
  readonly activePhotoNumber = computed(() => {
    const photos = this.photosSource();
    if (!photos.length) {
      return 0;
    }

    return getArcCardLayout(
      getClosestLogicalIndex(this.position()),
      this.position(),
      photos.length,
      this.layoutConfig(),
    ).photoIndex + 1;
  });

  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private reducedMotionQuery?: MediaQueryList;
  private autoMotion?: gsap.core.Tween;
  private inertiaMotion?: gsap.core.Tween;
  private autoTimeScaleTween?: gsap.core.Tween;
  private readonly motion = { position: 0 };
  private isViewReady = false;
  private isInViewport = true;
  private isDocumentVisible = true;
  private prefersReducedMotion = false;
  private supportsFinePointer = false;
  private pointerId: number | null = null;
  private dragStartX = 0;
  private dragStartPosition = 0;
  private lastDragX = 0;
  private lastDragTime = 0;
  private lastPosition = 0;
  private suppressClickUntil = 0;

  ngAfterViewInit(): void {
    const scene = this.sceneRef.nativeElement;
    this.isViewReady = true;
    this.updateViewportWidth(scene.clientWidth);

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionQuery.addEventListener('change', this.onReducedMotionChange);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(([entry]) => {
        this.updateViewportWidth(entry.contentRect.width);
      });
      this.resizeObserver.observe(scene);
    }

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          this.isInViewport = entry.isIntersecting;
          this.syncAutoMotion();
        },
        { threshold: 0.16 },
      );
      this.intersectionObserver.observe(scene);
    }

    this.syncAutoMotion();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.reducedMotionQuery?.removeEventListener('change', this.onReducedMotionChange);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.autoMotion?.kill();
    this.inertiaMotion?.kill();
    this.autoTimeScaleTween?.kill();
  }

  previousPhoto(): void {
    this.moveBy(-1);
  }

  nextPhoto(): void {
    this.moveBy(1);
  }

  focusCard(card: RenderedGalleryCard): void {
    if (!this.isSuspended()) {
      this.focusedLogicalIndex.set(card.logicalIndex);
      this.pauseAutoMotion();
    }
  }

  clearFocusedCard(): void {
    if (this.isDragging()) {
      return;
    }

    this.focusedLogicalIndex.set(null);
    this.resumeAutoMotionSoon();
  }

  onCardPointerEnter(card: RenderedGalleryCard): void {
    if (this.supportsFinePointer) {
      this.focusCard(card);
    }
  }

  requestPhoto(card: RenderedGalleryCard): void {
    if (this.isSuspended() || Date.now() < this.suppressClickUntil) {
      return;
    }

    this.focusedLogicalIndex.set(card.logicalIndex);
    this.photoRequested.emit(card.layout.photoIndex);
  }

  onPointerDown(event: PointerEvent): void {
    if (this.isSuspended() || event.button !== 0) {
      return;
    }

    this.pointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartPosition = this.position();
    this.lastDragX = event.clientX;
    this.lastDragTime = event.timeStamp;
    this.lastPosition = this.position();
    this.inertiaMotion?.kill();
    this.pauseAutoMotion();
    this.sceneRef.nativeElement.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }

    const distance = event.clientX - this.dragStartX;
    if (!this.isDragging() && Math.abs(distance) < 8) {
      return;
    }

    if (!this.isDragging()) {
      this.isDragging.set(true);
      this.focusedLogicalIndex.set(null);
    }

    event.preventDefault();
    const pixelsPerPhoto = this.isCompact() ? 118 : 176;
    const nextPosition = this.dragStartPosition - distance / pixelsPerPhoto;
    this.setPosition(nextPosition);
    this.lastDragX = event.clientX;
    this.lastDragTime = event.timeStamp;
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }

    if (this.sceneRef.nativeElement.hasPointerCapture(event.pointerId)) {
      this.sceneRef.nativeElement.releasePointerCapture(event.pointerId);
    }

    this.pointerId = null;
    if (!this.isDragging()) {
      this.resumeAutoMotionSoon();
      return;
    }

    this.isDragging.set(false);
    this.suppressClickUntil = Date.now() + 250;
    const elapsed = Math.max(16, event.timeStamp - this.lastDragTime);
    const velocity = (this.lastDragX - event.clientX) / elapsed;
    const inertiaDistance = Math.max(-0.85, Math.min(0.85, velocity * 0.3));
    const target = this.position() + inertiaDistance;

    this.inertiaMotion?.kill();
    this.inertiaMotion = gsap.to(this.motion, {
      position: target,
      duration: 0.42,
      ease: 'power3.out',
      onUpdate: () => this.setPosition(this.motion.position),
      onComplete: () => this.resumeAutoMotionSoon(),
    });
  }

  onPointerCancel(event: PointerEvent): void {
    if (event.pointerId === this.pointerId) {
      this.pointerId = null;
      this.isDragging.set(false);
      this.resumeAutoMotionSoon();
    }
  }

  toggleAutoMotion(): void {
    if (this.prefersReducedMotion || this.isSuspended()) {
      return;
    }

    if (this.isAutoPlaying()) {
      this.autoMotion?.pause();
      this.isAutoPlaying.set(false);
      return;
    }

    this.syncAutoMotion();
  }

  onSceneKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previousPhoto();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextPhoto();
    }
  }

  isFocused(card: RenderedGalleryCard): boolean {
    return this.focusedLogicalIndex() === card.logicalIndex;
  }

  isInteractive(card: RenderedGalleryCard): boolean {
    return Math.abs(card.layout.relative) <= this.layoutConfig().visibleRadius;
  }

  isBroken(photoId: number): boolean {
    return this.brokenPhotoIds().has(photoId);
  }

  markImageFailed(photoId: number): void {
    this.brokenPhotoIds.update((current) => new Set(current).add(photoId));
  }

  zIndexFor(card: RenderedGalleryCard): number {
    return 100 - Math.round(Math.abs(card.layout.relative) * 10);
  }

  leftFor(card: RenderedGalleryCard): string {
    return `calc(50% + ${card.layout.x}px)`;
  }

  topFor(card: RenderedGalleryCard): string {
    return `calc(48% + ${card.layout.y}px)`;
  }

  transformFor(card: RenderedGalleryCard): string {
    return [
      `translate3d(-50%, -50%, ${this.zFor(card)}px)`,
      `rotateY(${this.rotationYFor(card)}deg)`,
      `rotateZ(${card.layout.rotateZ}deg)`,
      `scale(${this.scaleFor(card)})`,
    ].join(' ');
  }

  thumbnailUrlFor(photo: Photo): string {
    // A stable version query ensures a replaced thumbnail is not reused from a
    // browser's disk cache while the gallery itself remains cache-friendly.
    return `${photo.thumbnailSrc}?v=arc-20261010`;
  }

  thumbnailBackgroundFor(card: RenderedGalleryCard): string {
    return `url("${this.thumbnailUrlFor(card.photo)}")`;
  }

  scaleFor(card: RenderedGalleryCard): number {
    return Number((card.layout.scale * (this.isFocused(card) ? 1.1 : 1)).toFixed(3));
  }

  zFor(card: RenderedGalleryCard): number {
    return card.layout.z + (this.isFocused(card) ? 210 : 0);
  }

  rotationYFor(card: RenderedGalleryCard): number {
    return this.isFocused(card) ? 0 : card.layout.rotateY;
  }

  private moveBy(amount: number): void {
    if (this.isSuspended() || !this.photosSource().length) {
      return;
    }

    const nextPosition = this.position() + amount;
    this.setPosition(nextPosition);
    this.focusedLogicalIndex.set(getClosestLogicalIndex(nextPosition));
    this.resumeAutoMotionSoon();
  }

  private updateViewportWidth(width: number): void {
    if (width > 0) {
      this.viewportWidth.set(width);
    }
  }

  private readonly onReducedMotionChange = (event: MediaQueryListEvent): void => {
    this.prefersReducedMotion = event.matches;
    this.syncAutoMotion();
  };

  private readonly onVisibilityChange = (): void => {
    this.isDocumentVisible = !document.hidden;
    this.syncAutoMotion();
  };

  private setPosition(value: number): void {
    this.motion.position = value;
    this.position.set(value);
  }

  private syncAutoMotion(): void {
    if (!this.isViewReady) {
      return;
    }

    const canMove =
      !this.prefersReducedMotion &&
      !this.isSuspended() &&
      !this.isDragging() &&
      this.isInViewport &&
      this.isDocumentVisible &&
      this.photosSource().length > 1;

    if (!canMove) {
      this.autoMotion?.pause();
      this.isAutoPlaying.set(false);
      return;
    }

    this.autoMotion?.kill();
    this.motion.position = this.position();
    this.autoMotion = gsap.to(this.motion, {
      position: this.motion.position + 1000,
      duration: 1000 / 0.075,
      ease: 'none',
      onUpdate: () => this.setPosition(this.motion.position),
    });
    this.isAutoPlaying.set(true);
  }

  private pauseAutoMotion(): void {
    if (!this.autoMotion || !this.isAutoPlaying()) {
      return;
    }

    this.autoTimeScaleTween?.kill();
    this.autoTimeScaleTween = gsap.to(this.autoMotion, {
      timeScale: 0,
      duration: 0.22,
      ease: 'power2.out',
      onComplete: () => this.isAutoPlaying.set(false),
    });
  }

  private resumeAutoMotionSoon(): void {
    window.setTimeout(() => {
      if (this.focusedLogicalIndex() === null && !this.isDragging()) {
        this.syncAutoMotion();
      }
    }, 320);
  }
}
