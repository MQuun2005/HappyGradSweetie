import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { GalleryContent, Photo } from '../../models/celebration.models';
import {
  ArcCardLayout,
  getArcCardLayout,
  getClosestLogicalIndex,
  getGalleryLayoutConfig,
  getGalleryViewport,
  getVirtualLogicalIndices,
  positiveModulo,
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
  @ViewChildren('card') private cardRefs!: QueryList<ElementRef<HTMLButtonElement>>;

  @Input({ required: true }) content!: GalleryContent;

  @Input()
  set suspended(value: boolean) {
    this.isSuspended.set(value);
    if (value) {
      this.focusedLogicalIndex.set(null);
      this.hoveredLogicalIndex = null;
    }
    this.syncMotionLoop();
  }

  @Input({ required: true })
  set photos(value: readonly Photo[]) {
    this.photosSource.set([...value].sort((left, right) => left.order - right.order));
    if (value.length === 0) {
      this.motionPosition = 0;
      this.position.set(0);
      this.windowAnchor.set(0);
    }
  }

  @Output() readonly photoRequested = new EventEmitter<number>();

  private readonly photosSource = signal<readonly Photo[]>([]);
  /** Semantic position only. It intentionally does not update on every animation frame. */
  readonly position = signal(0);
  private readonly windowAnchor = signal(0);
  private readonly viewportWidth = signal(1280);
  private readonly viewportHeight = signal(900);
  private readonly coarsePointer = signal(false);
  private motionPosition = 0;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private cardChanges?: Subscription;
  private motionPreference?: MediaQueryList;
  private animationFrameId?: number;
  private lastTimestamp = 0;
  private isOffscreen = false;
  private isPageHidden = false;
  private isReducedMotion = false;
  private supportsFinePointer = false;
  private isPointerDown = false;
  private isDragging = false;
  private pointerId?: number;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartPosition = 0;
  private lastSamplePosition = 0;
  private lastSampleTimestamp = 0;
  private inertiaVelocity = 0;
  private lastDragEndAt = -Infinity;
  private hoveredLogicalIndex: number | null = null;
  private readonly hoverProgress = new Map<number, number>();
  private readonly cardElements = new Map<number, HTMLButtonElement>();
  private readonly autoSpeedDesktop = 0.075;
  private readonly autoSpeedTouch = 0.05;
  private readonly dragThreshold = 8;

  readonly isSuspended = signal(false);
  readonly focusedLogicalIndex = signal<number | null>(null);
  readonly brokenPhotoIds = signal<ReadonlySet<number>>(new Set());
  readonly photoCount = computed(() => this.photosSource().length);
  readonly layoutConfig = computed(() =>
    getGalleryLayoutConfig(this.viewportWidth(), this.viewportHeight(), this.coarsePointer()),
  );
  readonly isCompact = computed(() => getGalleryViewport(this.viewportWidth()) === 'compact');
  readonly isTablet = computed(() => this.coarsePointer() && this.viewportWidth() >= 641);
  readonly activeLogicalIndex = computed(() => getClosestLogicalIndex(this.position()));
  readonly renderedCards = computed<readonly RenderedGalleryCard[]>(() => {
    const photos = this.photosSource();
    if (photos.length === 0) {
      return [];
    }

    const anchor = this.windowAnchor();
    const config = this.layoutConfig();
    return getVirtualLogicalIndices(anchor, config).map((logicalIndex) => {
      const layout = getArcCardLayout(logicalIndex, anchor, photos.length, config);
      return { logicalIndex, photo: photos[layout.photoIndex], layout };
    });
  });

  constructor(
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    const scene = this.sceneRef.nativeElement;
    this.updateViewport(scene.clientWidth, scene.clientHeight);
    this.supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.coarsePointer.set(window.matchMedia('(pointer: coarse)').matches);
    this.isPageHidden = document.hidden;

    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.isReducedMotion = this.motionPreference.matches;
    this.motionPreference.addEventListener('change', this.onMotionPreferenceChange);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(([entry]) => {
        this.updateViewport(entry.contentRect.width, entry.contentRect.height);
        this.refreshVirtualWindow();
      });
      this.resizeObserver.observe(scene);
    }

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          this.isOffscreen = !entry.isIntersecting;
          this.syncMotionLoop();
        },
        { threshold: 0.15 },
      );
      this.intersectionObserver.observe(scene);
    }

    this.cardChanges = this.cardRefs.changes.subscribe(() => {
      this.cacheCardElements();
      this.renderCards(0);
    });
    this.cacheCardElements();
    this.renderCards(0);
    this.syncMotionLoop();
  }

  ngOnDestroy(): void {
    this.stopMotionLoop();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.cardChanges?.unsubscribe();
    this.motionPreference?.removeEventListener('change', this.onMotionPreferenceChange);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  onPointerDown(event: PointerEvent): void {
    if (this.isSuspended() || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    this.isPointerDown = true;
    this.isDragging = false;
    this.pointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartPosition = this.motionPosition;
    this.lastSamplePosition = this.motionPosition;
    this.lastSampleTimestamp = performance.now();
    this.inertiaVelocity = 0;
    this.syncMotionLoop();
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isPointerDown || event.pointerId !== this.pointerId) {
      return;
    }

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    if (!this.isDragging) {
      if (Math.abs(deltaX) < this.dragThreshold && Math.abs(deltaY) < this.dragThreshold) {
        return;
      }
      if (Math.abs(deltaY) >= Math.abs(deltaX)) {
        this.resetPointerState(false);
        return;
      }

      this.isDragging = true;
      this.sceneRef.nativeElement.setPointerCapture(event.pointerId);
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const sensitivity = this.coarsePointer() ? 1 / 220 : 1 / 280;
    this.setMotionPosition(this.dragStartPosition - deltaX * sensitivity);
    const now = performance.now();
    const elapsed = Math.max(1, now - this.lastSampleTimestamp);
    this.inertiaVelocity = Math.max(
      -5,
      Math.min(5, (this.motionPosition - this.lastSamplePosition) / (elapsed / 1000)),
    );
    this.lastSamplePosition = this.motionPosition;
    this.lastSampleTimestamp = now;
    this.renderCards(0);
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }

    const shouldInertiate = this.isDragging && !this.isReducedMotion && Math.abs(this.inertiaVelocity) > 0.08;
    this.resetPointerState(shouldInertiate);
    if (shouldInertiate) {
      this.lastDragEndAt = performance.now();
    }
    this.syncMotionLoop();
  }

  onPointerCancel(event: PointerEvent): void {
    if (event.pointerId === this.pointerId) {
      this.resetPointerState(false);
      this.syncMotionLoop();
    }
  }

  onScenePointerLeave(): void {
    if (!this.isDragging) {
      this.resetPointerState(false);
    }
  }

  onCardPointerEnter(card: RenderedGalleryCard): void {
    if (this.supportsFinePointer && card.layout.isFront) {
      this.hoveredLogicalIndex = card.logicalIndex;
      this.focusedLogicalIndex.set(card.logicalIndex);
      this.syncMotionLoop();
    }
  }

  onCardPointerLeave(card: RenderedGalleryCard): void {
    if (this.hoveredLogicalIndex === card.logicalIndex) {
      this.hoveredLogicalIndex = null;
    }
    if (this.focusedLogicalIndex() === card.logicalIndex) {
      this.focusedLogicalIndex.set(null);
    }
    this.syncMotionLoop();
  }

  focusCard(card: RenderedGalleryCard): void {
    if (!this.isSuspended() && card.layout.isFront) {
      this.focusedLogicalIndex.set(card.logicalIndex);
      this.syncMotionLoop();
    }
  }

  clearFocusedCard(card?: RenderedGalleryCard): void {
    if (!card || this.focusedLogicalIndex() === card.logicalIndex) {
      this.focusedLogicalIndex.set(null);
      this.syncMotionLoop();
    }
  }

  requestPhoto(card: RenderedGalleryCard): void {
    if (
      this.isSuspended() ||
      !card.layout.isFront ||
      this.isDragging ||
      performance.now() - this.lastDragEndAt < 250
    ) {
      return;
    }

    this.focusedLogicalIndex.set(card.logicalIndex);
    this.photoRequested.emit(card.layout.photoIndex);
  }

  onSceneKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.moveBy(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.moveBy(1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openActivePhoto();
    }
  }

  isFocused(card: RenderedGalleryCard): boolean {
    return this.focusedLogicalIndex() === card.logicalIndex;
  }

  isActive(card: RenderedGalleryCard): boolean {
    return this.activeLogicalIndex() === card.logicalIndex;
  }

  isBroken(photoId: number): boolean {
    return this.brokenPhotoIds().has(photoId);
  }

  markImageFailed(photoId: number): void {
    this.brokenPhotoIds.update((current) => new Set(current).add(photoId));
  }

  stageTransform(): string {
    const config = this.layoutConfig();
    return `rotateX(${config.cameraPitch}deg) rotateY(${config.cameraYaw}deg)`;
  }

  transformFor(card: RenderedGalleryCard): string {
    return this.transformForLayout(card.layout, 0);
  }

  private readonly onVisibilityChange = (): void => {
    this.isPageHidden = document.hidden;
    this.syncMotionLoop();
  };

  private readonly onMotionPreferenceChange = (event: MediaQueryListEvent): void => {
    this.isReducedMotion = event.matches;
    this.inertiaVelocity = 0;
    this.syncMotionLoop();
  };

  private syncMotionLoop(): void {
    if (!this.sceneRef) {
      return;
    }

    if (this.shouldAnimate()) {
      if (this.animationFrameId === undefined) {
        this.lastTimestamp = 0;
        this.ngZone.runOutsideAngular(() => {
          this.animationFrameId = requestAnimationFrame(this.onAnimationFrame);
        });
      }
    } else {
      this.stopMotionLoop();
      this.renderCards(0);
    }
  }

  private stopMotionLoop(): void {
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    this.lastTimestamp = 0;
  }

  private readonly onAnimationFrame = (timestamp: number): void => {
    this.animationFrameId = undefined;
    const delta = this.lastTimestamp === 0 ? 0 : Math.min(0.064, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    if (this.inertiaVelocity !== 0 && !this.isReducedMotion) {
      this.setMotionPosition(this.motionPosition + this.inertiaVelocity * delta);
      this.inertiaVelocity *= Math.exp(-6 * delta);
      if (Math.abs(this.inertiaVelocity) < 0.02) {
        this.inertiaVelocity = 0;
      }
    } else if (this.shouldAutoMove()) {
      const speed = this.coarsePointer() ? this.autoSpeedTouch : this.autoSpeedDesktop;
      this.setMotionPosition(this.motionPosition + speed * delta);
    }

    const hoverIsSettling = this.renderCards(delta);
    if (this.shouldAutoMove() || this.inertiaVelocity !== 0 || hoverIsSettling) {
      this.animationFrameId = requestAnimationFrame(this.onAnimationFrame);
    } else {
      this.lastTimestamp = 0;
    }
  };

  private shouldAnimate(): boolean {
    return this.shouldAutoMove() || this.inertiaVelocity !== 0 || this.hasHoverTransition();
  }

  private shouldAutoMove(): boolean {
    return (
      !this.isReducedMotion &&
      !this.isSuspended() &&
      !this.isOffscreen &&
      !this.isPageHidden &&
      !this.isPointerDown &&
      this.hoveredLogicalIndex === null &&
      this.focusedLogicalIndex() === null &&
      this.photoCount() > 1
    );
  }

  private setMotionPosition(nextPosition: number): void {
    const count = this.photoCount();
    if (count === 0) {
      return;
    }

    const normalizationLimit = count * 100;
    if (Math.abs(nextPosition) > normalizationLimit) {
      nextPosition -= Math.trunc(nextPosition / count) * count;
    }
    this.motionPosition = nextPosition;

    const anchor = Math.floor(nextPosition);
    const active = getClosestLogicalIndex(nextPosition);
    const anchorChanged = anchor !== this.windowAnchor();
    const activeChanged = active !== this.position();
    if (!anchorChanged && !activeChanged) {
      return;
    }

    this.ngZone.run(() => {
      if (anchorChanged) {
        this.windowAnchor.set(anchor);
      }
      if (activeChanged) {
        this.position.set(active);
      }
      this.cdr.detectChanges();
    });

    if (anchorChanged) {
      this.cacheCardElements();
    }
  }

  private moveBy(amount: number): void {
    if (this.isSuspended() || this.photoCount() < 2) {
      return;
    }

    this.inertiaVelocity = 0;
    this.setMotionPosition(Math.round(this.motionPosition) + amount);
    this.focusedLogicalIndex.set(getClosestLogicalIndex(this.motionPosition));
    this.renderCards(0);
    this.syncMotionLoop();
  }

  private openActivePhoto(): void {
    const count = this.photoCount();
    if (this.isSuspended() || count === 0) {
      return;
    }

    this.photoRequested.emit(positiveModulo(getClosestLogicalIndex(this.motionPosition), count));
  }

  private resetPointerState(allowInertia: boolean): void {
    if (this.pointerId !== undefined && this.sceneRef.nativeElement.hasPointerCapture(this.pointerId)) {
      this.sceneRef.nativeElement.releasePointerCapture(this.pointerId);
    }
    if (!allowInertia) {
      this.inertiaVelocity = 0;
    }
    this.isPointerDown = false;
    this.isDragging = false;
    this.pointerId = undefined;
  }

  private updateViewport(width: number, height: number): void {
    if (width > 0) {
      this.viewportWidth.set(width);
    }
    if (height > 0) {
      this.viewportHeight.set(height);
    }
  }

  private refreshVirtualWindow(): void {
    this.ngZone.run(() => this.cdr.detectChanges());
    this.renderCards(0);
  }

  private cacheCardElements(): void {
    this.cardElements.clear();
    this.cardRefs?.forEach((reference) => {
      const logicalIndex = Number(reference.nativeElement.dataset['logicalIndex']);
      if (Number.isFinite(logicalIndex)) {
        this.cardElements.set(logicalIndex, reference.nativeElement);
      }
    });
  }

  private renderCards(delta: number): boolean {
    const photos = this.photosSource();
    if (photos.length === 0) {
      return false;
    }

    const config = this.layoutConfig();
    const focused = this.focusedLogicalIndex();
    let isSettling = false;
    const activeHover = this.hoveredLogicalIndex ?? focused;

    for (const [logicalIndex, element] of this.cardElements) {
      const layout = getArcCardLayout(logicalIndex, this.motionPosition, photos.length, config);
      const target = activeHover === logicalIndex ? 1 : 0;
      const current = this.hoverProgress.get(logicalIndex) ?? 0;
      const next = delta === 0 ? target : current + (target - current) * Math.min(1, delta * 12);
      this.hoverProgress.set(logicalIndex, next);
      if (Math.abs(target - next) > 0.01) {
        isSettling = true;
      }

      element.style.transform = this.transformForLayout(layout, next);
      element.style.opacity = String(layout.opacity * (activeHover !== null && target === 0 ? 0.68 : 1));
      element.style.zIndex = '';
    }

    for (const index of this.hoverProgress.keys()) {
      if (!this.cardElements.has(index)) {
        this.hoverProgress.delete(index);
      }
    }
    return isSettling;
  }

  private hasHoverTransition(): boolean {
    const activeHover = this.hoveredLogicalIndex ?? this.focusedLogicalIndex();
    for (const logicalIndex of this.cardElements.keys()) {
      const target = activeHover === logicalIndex ? 1 : 0;
      const progress = this.hoverProgress.get(logicalIndex) ?? 0;
      if (Math.abs(target - progress) > 0.01) {
        return true;
      }
    }
    return false;
  }

  private transformForLayout(layout: ArcCardLayout, hoverProgress: number): string {
    const y = layout.y - hoverProgress * 14;
    const z = layout.z + hoverProgress * 175;
    const rotateY = layout.rotateY * (1 - hoverProgress);
    const rotateZ = layout.rotateZ * (1 - hoverProgress);
    const scale = layout.scale * (1 + hoverProgress * 0.13);
    return [
      'translate(-50%, -50%)',
      `translate3d(${layout.x}px, ${y}px, ${z}px)`,
      `rotateY(${rotateY}deg)`,
      `rotateZ(${rotateZ}deg)`,
      `scale(${scale})`,
    ].join(' ');
  }
}
