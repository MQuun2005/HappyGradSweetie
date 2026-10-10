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
  ViewChild,
  computed,
  signal,
} from '@angular/core';

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

export interface RenderedGalleryCard {
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
    if (value) {
      this.focusedLogicalIndex.set(null);
    }
  }

  @Input({ required: true })
  set photos(value: readonly Photo[]) {
    this.photosSource.set([...value].sort((left, right) => left.order - right.order));
    if (value.length === 0) {
      this.position.set(0);
    }
  }

  @Output() readonly photoRequested = new EventEmitter<number>();

  private readonly photosSource = signal<readonly Photo[]>([]);
  readonly position = signal(0);
  private readonly viewportWidth = signal(1280);
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private isOffscreen = false;
  private supportsFinePointer = false;

  private animationFrameId?: number;
  private lastTimestamp = 0;
  private readonly autoSpeed = 0.22; // cards per second (gentle drift across all 34 photos)
  private isHovered = false;
  private isPointerDown = false;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartPosition = 0;
  private readonly dragThreshold = 6;

  readonly isSuspended = signal(false);
  readonly focusedLogicalIndex = signal<number | null>(null);
  readonly brokenPhotoIds = signal<ReadonlySet<number>>(new Set());
  readonly photoCount = computed(() => this.photosSource().length);
  readonly layoutConfig = computed(() => getGalleryLayoutConfig(this.viewportWidth()));
  readonly isCompact = computed(() => getGalleryViewport(this.viewportWidth()) === 'compact');
  readonly activeLogicalIndex = computed(() => getClosestLogicalIndex(this.position()));
  readonly renderedCards = computed<readonly RenderedGalleryCard[]>(() => {
    const photos = this.photosSource();
    if (photos.length === 0) {
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
    const count = this.photoCount();
    return count === 0 ? 0 : positiveModulo(this.activeLogicalIndex(), count) + 1;
  });

  constructor(
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    const scene = this.sceneRef.nativeElement;
    this.updateViewportWidth(scene.clientWidth);
    this.supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(([entry]) => {
        this.updateViewportWidth(entry.contentRect.width);
      });
      this.resizeObserver.observe(scene);
    }

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          this.isOffscreen = !entry.isIntersecting;
        },
        { threshold: 0.15 },
      );
      this.intersectionObserver.observe(scene);
    }

    this.startAutoMotion();
  }

  ngOnDestroy(): void {
    this.stopAutoMotion();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
  }

  private startAutoMotion(): void {
    this.ngZone.runOutsideAngular(() => {
      const step = (timestamp: number) => {
        if (!this.lastTimestamp) {
          this.lastTimestamp = timestamp;
        }

        const deltaMs = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        const shouldMove =
          !this.isSuspended() &&
          !this.isHovered &&
          !this.isPointerDown &&
          !this.isOffscreen &&
          this.photoCount() > 1 &&
          (typeof document === 'undefined' || !document.hidden);

        if (shouldMove) {
          const dt = Math.min(deltaMs / 1000, 0.1);
          const nextPos = this.position() + this.autoSpeed * dt;
          this.position.set(nextPos);
          this.cdr.detectChanges();
        }

        this.animationFrameId = requestAnimationFrame(step);
      };

      this.animationFrameId = requestAnimationFrame(step);
    });
  }

  private stopAutoMotion(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  onScenePointerEnter(): void {
    this.isHovered = true;
  }

  onScenePointerLeave(): void {
    this.isHovered = false;
    this.isPointerDown = false;
    this.clearFocusedCard();
  }

  onPointerDown(event: PointerEvent): void {
    if (this.isSuspended() || event.button !== 0) {
      return;
    }
    this.isPointerDown = true;
    this.isDragging = false;
    this.dragStartX = event.clientX;
    this.dragStartPosition = this.position();
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isPointerDown) {
      return;
    }

    const deltaX = event.clientX - this.dragStartX;
    if (Math.abs(deltaX) > this.dragThreshold) {
      this.isDragging = true;
      const sensitivity = 1 / 280;
      this.position.set(this.dragStartPosition - deltaX * sensitivity);
      this.cdr.detectChanges();
    }
  }

  onPointerUp(): void {
    this.isPointerDown = false;
    if (this.isDragging) {
      setTimeout(() => {
        this.isDragging = false;
      }, 50);
    }
  }

  previousPhoto(): void {
    this.moveBy(-1);
  }

  nextPhoto(): void {
    this.moveBy(1);
  }

  focusCard(card: RenderedGalleryCard): void {
    if (!this.isSuspended() && card.layout.isFront) {
      this.focusedLogicalIndex.set(card.logicalIndex);
    }
  }

  clearFocusedCard(): void {
    this.focusedLogicalIndex.set(null);
  }

  onCardPointerEnter(card: RenderedGalleryCard): void {
    if (this.supportsFinePointer && card.layout.isFront) {
      this.focusCard(card);
    }
  }

  requestPhoto(card: RenderedGalleryCard): void {
    if (this.isSuspended() || !card.layout.isFront || this.isDragging) {
      return;
    }

    this.focusedLogicalIndex.set(card.logicalIndex);
    this.photoRequested.emit(card.layout.photoIndex);
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

  isFront(card: RenderedGalleryCard): boolean {
    return card.layout.isFront;
  }

  isInteractive(card: RenderedGalleryCard): boolean {
    return card.layout.isFront;
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

  zIndexFor(card: RenderedGalleryCard): number {
    return card.layout.zIndex + (this.isFocused(card) ? 800 : 0);
  }

  transformFor(card: RenderedGalleryCard): string {
    const isFocused = this.isFocused(card);
    const offsetY = card.layout.y - (isFocused ? 14 : 0);
    const rotZ = isFocused ? 0 : card.layout.rotateZ;
    return [
      'translate(-50%, -50%)',
      `translate3d(${card.layout.x}px, ${offsetY}px, ${this.zFor(card)}px)`,
      `rotateY(${this.rotationYFor(card)}deg)`,
      `rotateZ(${rotZ}deg)`,
      `scale(${this.scaleFor(card)})`,
    ].join(' ');
  }

  scaleFor(card: RenderedGalleryCard): number {
    return Number((card.layout.scale * (this.isFocused(card) ? 1.18 : 1)).toFixed(3));
  }

  zFor(card: RenderedGalleryCard): number {
    return card.layout.z + (this.isFocused(card) ? 120 : 0);
  }

  rotationYFor(card: RenderedGalleryCard): number {
    return this.isFocused(card) ? 0 : card.layout.rotateY;
  }

  private moveBy(amount: number): void {
    if (this.isSuspended() || this.photoCount() < 2) {
      return;
    }

    const nextPosition = Math.round(this.position()) + amount;
    this.position.set(nextPosition);
    this.focusedLogicalIndex.set(getClosestLogicalIndex(nextPosition));
    this.cdr.detectChanges();
  }

  private openActivePhoto(): void {
    const count = this.photoCount();
    if (this.isSuspended() || count === 0) {
      return;
    }

    this.photoRequested.emit(positiveModulo(this.activeLogicalIndex(), count));
  }

  private updateViewportWidth(width: number): void {
    if (width > 0) {
      this.viewportWidth.set(width);
    }
  }
}
