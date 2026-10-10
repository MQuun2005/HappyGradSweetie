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
  private readonly position = signal(0);
  private readonly viewportWidth = signal(1280);
  private resizeObserver?: ResizeObserver;
  private supportsFinePointer = false;

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
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
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
    }
  }

  clearFocusedCard(): void {
    this.focusedLogicalIndex.set(null);
  }

  onCardPointerEnter(card: RenderedGalleryCard): void {
    if (this.supportsFinePointer) {
      this.focusCard(card);
    }
  }

  requestPhoto(card: RenderedGalleryCard): void {
    if (this.isSuspended()) {
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

  isInteractive(card: RenderedGalleryCard): boolean {
    return Math.abs(card.layout.relative) <= this.layoutConfig().visibleRadius;
  }

  isBroken(photoId: number): boolean {
    return this.brokenPhotoIds().has(photoId);
  }

  markImageFailed(photoId: number): void {
    this.brokenPhotoIds.update((current) => new Set(current).add(photoId));
  }

  leftFor(card: RenderedGalleryCard): string {
    return `calc(50% + ${card.layout.x}px)`;
  }

  topFor(card: RenderedGalleryCard): string {
    return `calc(52% + ${card.layout.y}px)`;
  }

  stageTransform(): string {
    const config = this.layoutConfig();
    return `rotateX(${config.cameraPitch}deg) rotateY(${config.cameraYaw}deg)`;
  }

  transformFor(card: RenderedGalleryCard): string {
    return [
      'translate(-50%, -50%)',
      `translateZ(${this.zFor(card)}px)`,
      `rotateY(${this.rotationYFor(card)}deg)`,
      `rotateZ(${card.layout.rotateZ}deg)`,
      `scale(${this.scaleFor(card)})`,
    ].join(' ');
  }

  scaleFor(card: RenderedGalleryCard): number {
    return Number((card.layout.scale * (this.isFocused(card) ? 1.045 : 1)).toFixed(3));
  }

  zFor(card: RenderedGalleryCard): number {
    return card.layout.z + (this.isFocused(card) ? 72 : 0);
  }

  rotationYFor(card: RenderedGalleryCard): number {
    return this.isFocused(card) ? 0 : card.layout.rotateY;
  }

  private moveBy(amount: number): void {
    if (this.isSuspended() || this.photoCount() < 2) {
      return;
    }

    const nextPosition = this.position() + amount;
    this.position.set(nextPosition);
    this.focusedLogicalIndex.set(getClosestLogicalIndex(nextPosition));
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
