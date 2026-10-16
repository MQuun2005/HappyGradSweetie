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
  getGalleryLayoutConfig,
  getVirtualLogicalIndices,
  positiveModulo,
} from '../../utils/gallery-layout';
import { PresentationViewport, presentGalleryCard } from '../../utils/gallery-presentation';

interface RenderedGalleryCard {
  readonly logicalIndex: number;
  readonly photo: Photo;
  readonly layout: ArcCardLayout;
}
interface CardElements {
  rail: HTMLElement;
  face: HTMLButtonElement;
}
const approach = (value: number, target: number, step: number) =>
  value < target ? Math.min(target, value + step) : Math.max(target, value - step);

@Component({
  selector: 'app-interactive-photo-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './interactive-photo-gallery.html',
  styleUrl: './interactive-photo-gallery.css',
})
export class InteractivePhotoGalleryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scene') private sceneRef!: ElementRef<HTMLElement>;
  @ViewChildren('rail') private cardRefs!: QueryList<ElementRef<HTMLElement>>;
  @Input({ required: true }) content!: GalleryContent;
  @Input() set suspended(value: boolean) {
    this.isSuspended.set(value);
    if (value) this.hoveredLogicalIndex = null;
    this.syncMotionLoop();
  }
  @Input({ required: true }) set photos(value: readonly Photo[]) {
    this.photosSource.set([...value].sort((a, b) => a.order - b.order));
    if (!value.length) {
      this.motionPosition = 0;
      this.position.set(0);
      this.windowAnchor.set(0);
    }
    this.scheduleMeasurement();
  }
  @Output() readonly photoRequested = new EventEmitter<number>();

  private readonly photosSource = signal<readonly Photo[]>([]);
  readonly position = signal(0); // semantic nearest-card index, not a frame clock
  private readonly windowAnchor = signal(0);
  private readonly sceneWidth = signal(1184);
  private readonly viewportHeight = signal(900);
  private readonly coarsePointer = signal(false);
  readonly isSuspended = signal(false);
  readonly focusedLogicalIndex = signal<number | null>(null);
  readonly brokenPhotoIds = signal<ReadonlySet<number>>(new Set());
  readonly photoCount = computed(() => this.photosSource().length);
  readonly layoutConfig = computed(() =>
    getGalleryLayoutConfig(this.sceneWidth(), this.viewportHeight(), this.coarsePointer()),
  );
  readonly isCompact = computed(() => this.layoutConfig().visibleRadius === 1);
  readonly isTablet = computed(() => this.coarsePointer() && !this.isCompact());
  readonly activeLogicalIndex = computed(() => this.position());
  readonly activePhotoNumber = computed(() =>
    this.photoCount() ? positiveModulo(this.position(), this.photoCount()) + 1 : 0,
  );
  readonly cardWidth = computed(() => {
    const width = this.sceneWidth(),
      height = this.viewportHeight();
    return this.isCompact()
      ? Math.min(200, width * 0.52, Math.max(132, height * 0.38))
      : Math.min(
          this.coarsePointer() ? 224 : 232,
          width * (this.coarsePointer() ? 0.27 : 0.196),
          height * 0.3,
        );
  });
  readonly renderedCards = computed<readonly RenderedGalleryCard[]>(() => {
    const photos = this.photosSource(),
      config = this.layoutConfig();
    const anchor = this.windowAnchor(),
      active = this.position();
    return getVirtualLogicalIndices(anchor, config, photos.length).map((logicalIndex) => ({
      logicalIndex,
      photo: photos[positiveModulo(logicalIndex, photos.length)],
      layout: getArcCardLayout(logicalIndex, active, photos.length, config),
    }));
  });

  private motionPosition = 0;
  private animationFrameId?: number;
  private measurementFrame = 0;
  private lastTimestamp = 0;
  private destroyed = false;
  private isOffscreen = true;
  private isPageHidden = false;
  private isReducedMotion = false;
  private supportsFinePointer = false;
  private focusWithin = false;
  private hoveredLogicalIndex: number | null = null;
  private lastHoverPointer: { x: number; y: number } | null = null;
  private hoverCandidate: number | null = null;
  private hoverCandidateAt = 0;
  private hoverLeaveAt = 0;
  private autoVelocity = 0;
  private inertiaVelocity = 0;
  private isPointerDown = false;
  private dragHadFocus = false;
  private isDragging = false;
  private pointerId?: number;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartPosition = 0;
  private lastSamplePosition = 0;
  private lastSampleTimestamp = 0;
  private pendingDragPosition?: number;
  private lastDragEndAt = -Infinity;
  private readonly hoverProgress = new Map<number, number>();
  private readonly cardElements = new Map<number, CardElements>();
  private readonly abort = new AbortController();
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private cardChanges?: Subscription;
  private motionPreference?: MediaQueryList;
  private pointerPreference?: MediaQueryList;
  private presentationViewport: PresentationViewport = {
    width: 232,
    height: (232 * 2560) / 1706,
    perspective: 1100,
    safe: { left: -576, right: 576, top: -280, bottom: 280 },
  };

  constructor(
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const scene = this.sceneRef.nativeElement,
        options = { signal: this.abort.signal };
      this.motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
      this.pointerPreference = matchMedia('(any-pointer: coarse)');
      this.isReducedMotion = this.motionPreference.matches;
      this.isPageHidden = document.hidden;
      this.motionPreference.addEventListener('change', this.onPreferences, options);
      this.pointerPreference.addEventListener('change', this.onPreferences, options);
      document.addEventListener('visibilitychange', this.onVisibility, options);
      window.addEventListener('blur', this.onWindowBlur, options);
      window.addEventListener('resize', this.scheduleMeasurement, { ...options, passive: true });
      window.addEventListener('scroll', this.scheduleMeasurement, { ...options, passive: true });
      window.visualViewport?.addEventListener('resize', this.scheduleMeasurement, {
        ...options,
        passive: true,
      });
      window.visualViewport?.addEventListener('scroll', this.scheduleMeasurement, {
        ...options,
        passive: true,
      });
      scene.addEventListener('pointerdown', this.onPointerDown, options);
      scene.addEventListener('pointermove', this.onPointerMove, options);
      scene.addEventListener('pointerup', this.onPointerUp, options);
      scene.addEventListener('pointercancel', this.onPointerCancel, options);
      scene.addEventListener('lostpointercapture', this.onPointerCancel, options);
      scene.addEventListener('pointerout', this.onPointerOut, options);
      scene.addEventListener('focusin', this.onFocusIn, options);
      scene.addEventListener('focusout', this.onFocusOut, options);
      this.resizeObserver = new ResizeObserver(this.scheduleMeasurement);
      this.resizeObserver.observe(scene);
      this.intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          this.isOffscreen = !entry.isIntersecting || entry.intersectionRatio < 0.12;
          if (this.isOffscreen) this.hoveredLogicalIndex = null;
          this.scheduleMeasurement();
          this.syncMotionLoop();
        },
        { threshold: [0, 0.12, 0.4, 1] },
      );
      this.intersectionObserver.observe(scene);
      this.cardChanges = this.cardRefs.changes.subscribe(() => {
        this.cacheCardElements();
        this.renderCards(0);
      });
      this.cacheCardElements();
      this.renderCards(0);
      this.scheduleMeasurement();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resetPointerState(false);
    this.stopMotionLoop();
    cancelAnimationFrame(this.measurementFrame);
    this.abort.abort();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.cardChanges?.unsubscribe();
    this.cardElements.clear();
    this.hoverProgress.clear();
  }

  private get hardStopped(): boolean {
    return this.destroyed || this.isSuspended() || this.isPageHidden || this.isOffscreen;
  }
  private get activePresentation(): number | null {
    if (!this.supportsFinePointer || this.isReducedMotion || this.isDragging) return null;
    return this.hoveredLogicalIndex ?? this.focusedLogicalIndex();
  }
  private get speed(): number {
    return this.coarsePointer() ? 0.05 : 0.075;
  }
  private shouldAutoMove(): boolean {
    return (
      !this.hardStopped &&
      !this.isReducedMotion &&
      this.photoCount() > 1 &&
      !this.isPointerDown &&
      !this.focusWithin &&
      this.hoveredLogicalIndex === null &&
      this.inertiaVelocity === 0 &&
      ![...this.hoverProgress.values()].some((p) => p > 0)
    );
  }
  private hasHoverTransition(): boolean {
    const selected = this.activePresentation;
    return [...this.cardElements.keys()].some(
      (index) =>
        Math.abs((this.hoverProgress.get(index) ?? 0) - (index === selected ? 1 : 0)) > 0.0001,
    );
  }
  private needsFrame(): boolean {
    if (this.hardStopped) return false;
    return (
      this.pendingDragPosition !== undefined ||
      this.hoverLeaveAt > 0 ||
      this.hoverCandidateAt > 0 ||
      (!this.isReducedMotion &&
        (this.shouldAutoMove() ||
          this.autoVelocity > 0 ||
          (!this.isPointerDown && this.inertiaVelocity !== 0) ||
          this.hasHoverTransition()))
    );
  }
  private syncMotionLoop(): void {
    if (!this.sceneRef || this.destroyed) return;
    if (this.hardStopped) {
      this.resetPointerState(false);
      this.autoVelocity = 0;
      this.hoverLeaveAt = 0;
      this.hoverCandidate = null;
      this.hoverCandidateAt = 0;
      this.stopMotionLoop();
    } else if (this.needsFrame()) {
      if (this.animationFrameId === undefined) {
        this.lastTimestamp = 0;
        this.ngZone.runOutsideAngular(
          () => (this.animationFrameId = requestAnimationFrame(this.onAnimationFrame)),
        );
      }
    } else {
      this.stopMotionLoop();
      this.renderCards(0);
    }
  }
  private stopMotionLoop(): void {
    if (this.animationFrameId !== undefined) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = undefined;
    this.lastTimestamp = 0;
    for (const { rail, face } of this.cardElements.values()) {
      rail.style.willChange = 'auto';
      face.style.willChange = 'auto';
    }
  }
  private readonly onAnimationFrame = (now: number): void => {
    this.animationFrameId = undefined;
    if (this.hardStopped) {
      this.syncMotionLoop();
      return;
    }
    const delta = this.lastTimestamp ? Math.min(0.05, (now - this.lastTimestamp) / 1000) : 0;
    this.lastTimestamp = now;
    if (this.hoverCandidateAt && now >= this.hoverCandidateAt) {
      this.hoveredLogicalIndex = this.hoverCandidate;
      this.hoverCandidate = null;
      this.hoverCandidateAt = 0;
    }
    if (this.hoverLeaveAt && now >= this.hoverLeaveAt) {
      this.hoverLeaveAt = 0;
      this.hoveredLogicalIndex = null;
    }
    if (this.pendingDragPosition !== undefined) {
      this.setMotionPosition(this.pendingDragPosition);
      this.pendingDragPosition = undefined;
    } else if (!this.isReducedMotion && !this.isPointerDown && this.inertiaVelocity !== 0) {
      this.setMotionPosition(this.motionPosition + this.inertiaVelocity * delta);
      this.inertiaVelocity *= Math.exp(-6 * delta);
      if (Math.abs(this.inertiaVelocity) < 0.02) this.inertiaVelocity = 0;
    } else {
      const target = this.shouldAutoMove() ? this.speed : 0;
      this.autoVelocity =
        this.isReducedMotion || this.isPointerDown
          ? 0
          : approach(this.autoVelocity, target, (this.speed * delta) / (target ? 0.35 : 0.21));
      if (this.autoVelocity)
        this.setMotionPosition(this.motionPosition + this.autoVelocity * delta);
    }
    this.renderCards(delta);
    if (this.needsFrame()) this.animationFrameId = requestAnimationFrame(this.onAnimationFrame);
    else this.stopMotionLoop();
  };

  private setMotionPosition(next: number): void {
    const count = this.photoCount();
    if (!count || !Number.isFinite(next)) return;
    if (
      Math.abs(next) > count * 100 &&
      !this.isPointerDown &&
      !this.focusWithin &&
      this.hoveredLogicalIndex === null
    ) {
      const shift = Math.trunc(next / count) * count;
      next -= shift;
      const progress = [...this.hoverProgress];
      this.hoverProgress.clear();
      progress.forEach(([index, p]) => this.hoverProgress.set(index - shift, p));
    }
    this.motionPosition = next;
    const anchor = Math.floor(next),
      active = Math.round(next);
    if (anchor === this.windowAnchor() && active === this.position()) return;
    // Only window/semantic boundaries enter Angular. Track photo.id preserves DOM at normalization.
    this.ngZone.run(() => {
      this.windowAnchor.set(anchor);
      this.position.set(active);
      this.cdr.detectChanges();
    });
    this.cacheCardElements();
  }

  private cacheCardElements(): void {
    this.cardElements.clear();
    for (const ref of this.cardRefs ?? []) {
      const rail = ref.nativeElement,
        index = Number(rail.dataset['logicalIndex']);
      const face = rail.querySelector<HTMLButtonElement>('.photo-card');
      if (face) this.cardElements.set(index, { rail, face });
    }
    for (const key of this.hoverProgress.keys())
      if (!this.cardElements.has(key)) this.hoverProgress.delete(key);
  }

  private renderCards(delta: number): void {
    if (!this.photoCount() || this.destroyed) return;
    const selected = this.activePresentation,
      config = this.layoutConfig();
    // Update all progresses before computing neighbors so iteration order never changes the pose.
    for (const index of this.cardElements.keys()) {
      const current = this.hoverProgress.get(index) ?? 0,
        target = index === selected ? 1 : 0;
      this.hoverProgress.set(
        index,
        this.isReducedMotion ? 0 : approach(current, target, delta / 0.38),
      );
    }
    const emphasis = Math.max(0, ...this.hoverProgress.values());
    const layouts = new Map(
      [...this.cardElements.keys()].map(
        (index) =>
          [index, getArcCardLayout(index, this.motionPosition, this.photoCount(), config)] as const,
      ),
    );
    for (const [index, { rail, face }] of this.cardElements) {
      const layout = layouts.get(index)!;
      const progress = this.hoverProgress.get(index) ?? 0;
      let neighbor = 0,
        depth = 0;
      for (const [other, p] of this.hoverProgress) {
        const distance = Math.abs(index - other);
        if (distance > 0 && distance <= 2) {
          neighbor += Math.sign(index - other) * (distance === 1 ? 24 : 12) * p;
          depth += 12 * p;
        }
      }
      const adjacent = [layouts.get(index - 1), layouts.get(index + 1)].filter(
        (card): card is ArcCardLayout => !!card && this.isInteractive(card.logicalIndex),
      );
      const pose = presentGalleryCard(
        layout,
        config,
        this.presentationViewport,
        progress,
        neighbor,
        depth,
        adjacent,
      );
      rail.style.transform = 'translate(-50%, -50%) ' + pose.rail.toString();
      face.style.transform = pose.local.toString();
      // Grouping properties only on the leaf material, never the 3D rail/camera ancestors.
      face.style.opacity = String(layout.opacity + (1 - layout.opacity) * progress);
      face.style.filter = 'brightness(' + (1 - 0.18 * Math.max(0, emphasis - progress)) + ')';
      face.style.setProperty('--hover-progress', String(progress));
      face.classList.toggle('photo-card--presented', progress > 0.02);
      const interactive = this.isInteractive(index) && !this.isSuspended();
      face.style.pointerEvents = interactive ? 'auto' : 'none';
      const moving =
        !this.hardStopped &&
        (this.autoVelocity !== 0 || this.inertiaVelocity !== 0 || this.isDragging);
      rail.style.willChange = moving ? 'transform' : 'auto';
      face.style.willChange = !this.hardStopped && this.hasHoverTransition() ? 'transform' : 'auto';
    }
  }

  private readonly scheduleMeasurement = (): void => {
    if (!this.sceneRef || this.destroyed || this.measurementFrame) return;
    this.ngZone.runOutsideAngular(
      () =>
        (this.measurementFrame = requestAnimationFrame(() => {
          this.measurementFrame = 0;
          if (this.destroyed) return;
          const scene = this.sceneRef.nativeElement,
            box = scene.getBoundingClientRect();
          const width = scene.clientWidth;
          const height = document.documentElement.clientHeight;
          const coarse = this.pointerPreference?.matches ?? false;
          this.supportsFinePointer =
            matchMedia('(hover: hover) and (pointer: fine)').matches && !coarse;
          if (
            width > 0 &&
            (width !== this.sceneWidth() ||
              height !== this.viewportHeight() ||
              coarse !== this.coarsePointer())
          ) {
            this.ngZone.run(() => {
              this.sceneWidth.set(width);
              this.viewportHeight.set(height);
              this.coarsePointer.set(coarse);
              this.cdr.detectChanges();
            });
            this.cacheCardElements();
          }
          const view = window.visualViewport;
          const style = getComputedStyle(scene);
          const safe = (name: string) => parseFloat(style.getPropertyValue(name)) || 0;
          const left = (view?.offsetLeft ?? 0) + Math.max(16, safe('--safe-area-left'));
          const top = (view?.offsetTop ?? 0) + Math.max(16, safe('--safe-area-top'));
          const right =
            (view?.offsetLeft ?? 0) +
            (view?.width ?? innerWidth) -
            Math.max(16, safe('--safe-area-right'));
          const bottom =
            (view?.offsetTop ?? 0) +
            (view?.height ?? innerHeight) -
            Math.max(16, safe('--safe-area-bottom'));
          this.presentationViewport = {
            width: this.cardWidth(),
            height: (this.cardWidth() * 2560) / 1706,
            perspective: 1100,
            safe: {
              left: Math.max(box.left + 16, left) - (box.left + box.width / 2),
              right: Math.min(box.right - 16, right) - (box.left + box.width / 2),
              top: Math.max(box.top + 16, top) - (box.top + box.height / 2),
              bottom: Math.min(box.bottom - 16, bottom) - (box.top + box.height / 2),
            },
          };
          this.renderCards(0);
          this.syncMotionLoop();
        })),
    );
  };

  private readonly onPreferences = (): void => {
    this.isReducedMotion = this.motionPreference?.matches ?? false;
    this.inertiaVelocity = 0;
    this.autoVelocity = 0;
    this.hoverCandidate = null;
    this.hoverCandidateAt = 0;
    if (this.isReducedMotion) this.hoverProgress.clear();
    this.scheduleMeasurement();
    this.syncMotionLoop();
  };
  private readonly onVisibility = (): void => {
    this.isPageHidden = document.hidden;
    this.syncMotionLoop();
  };
  private readonly onWindowBlur = (): void => {
    this.resetPointerState(false);
    this.hoveredLogicalIndex = null;
    this.lastHoverPointer = null;
    this.hoverCandidate = null;
    this.hoverCandidateAt = 0;
    this.syncMotionLoop();
  };
  private eventLogical(event: Event): number | null {
    const target = event.target;
    const rail =
      target instanceof Element ? target.closest<HTMLElement>('[data-logical-index]') : null;
    return rail && this.sceneRef.nativeElement.contains(rail)
      ? Number(rail.dataset['logicalIndex'])
      : null;
  }
  private updateHoverFromPointer(event: PointerEvent): void {
    if (
      this.hardStopped ||
      this.isPointerDown ||
      !this.supportsFinePointer ||
      event.pointerType !== 'mouse'
    )
      return;
    if (this.lastHoverPointer?.x === event.clientX && this.lastHoverPointer.y === event.clientY)
      return;
    this.lastHoverPointer = { x: event.clientX, y: event.clientY };
    const index = this.eventLogical(event);
    if (index !== null && this.isInteractive(index)) {
      this.hoverLeaveAt = 0;
      if (this.hoveredLogicalIndex === index) {
        this.hoverCandidate = null;
        this.hoverCandidateAt = 0;
      } else if (this.hoverCandidate !== index) {
        // Brief intent window prevents every card crossed en route from moving
        // the destination under the pointer. Uses the same RAF, not a timer.
        this.hoverCandidate = index;
        this.hoverCandidateAt = performance.now() + 80;
        this.scheduleMeasurement();
      }
    } else {
      this.hoverCandidate = null;
      this.hoverCandidateAt = 0;
      if (this.hoveredLogicalIndex !== null) this.hoverLeaveAt = performance.now() + 80;
    }
    this.syncMotionLoop();
  }
  private readonly onPointerOut = (event: PointerEvent): void => {
    if (
      event.relatedTarget instanceof Node &&
      this.sceneRef.nativeElement.contains(event.relatedTarget)
    )
      return;
    // Lifting a photo can move it away from a stationary pointer. Keep that pose
    // until actual mouse movement, instead of an invisible original hit plane
    // covering a now-visible neighbor or layout-induced pointerout causing flicker.
    if (this.lastHoverPointer?.x === event.clientX && this.lastHoverPointer.y === event.clientY)
      return;
    if (event.pointerType === 'mouse') {
      this.lastHoverPointer = null;
      this.hoverCandidate = null;
      this.hoverCandidateAt = 0;
      if (this.hoveredLogicalIndex !== null) this.hoverLeaveAt = performance.now() + 80;
      this.syncMotionLoop();
    }
  };
  private readonly onFocusIn = (event: FocusEvent): void => {
    this.focusWithin = true;
    this.ngZone.run(() => this.focusedLogicalIndex.set(this.eventLogical(event)));
    this.scheduleMeasurement();
    this.syncMotionLoop();
  };
  private readonly onFocusOut = (): void => {
    queueMicrotask(() => {
      if (this.destroyed) return;
      this.focusWithin = this.sceneRef.nativeElement.contains(document.activeElement);
      if (!this.focusWithin) this.ngZone.run(() => this.focusedLogicalIndex.set(null));
      this.syncMotionLoop();
    });
  };

  readonly onPointerDown = (event: PointerEvent): void => {
    if (
      this.hardStopped ||
      !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0)
    )
      return;
    this.dragHadFocus = this.focusWithin;
    this.isPointerDown = true;
    this.isDragging = false;
    this.pointerId = event.pointerId;
    this.hoverCandidate = null;
    this.hoverCandidateAt = 0;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartPosition = this.motionPosition;
    this.lastSamplePosition = this.motionPosition;
    this.lastSampleTimestamp = performance.now();
    this.inertiaVelocity = 0;
    this.autoVelocity = 0;
    this.syncMotionLoop();
  };
  readonly onPointerMove = (event: PointerEvent): void => {
    this.updateHoverFromPointer(event);
    if (!this.isPointerDown || event.pointerId !== this.pointerId || this.hardStopped) return;
    const x = event.clientX - this.dragStartX,
      y = event.clientY - this.dragStartY;
    if (!this.isDragging) {
      if (Math.max(Math.abs(x), Math.abs(y)) < 8) return;
      if (Math.abs(y) >= Math.abs(x)) {
        this.resetPointerState(false);
        this.syncMotionLoop();
        return;
      }
      this.isDragging = true;
      this.hoveredLogicalIndex = null;
      this.sceneRef.nativeElement.setPointerCapture(event.pointerId);
    }
    if (event.cancelable) event.preventDefault();
    const next = this.dragStartPosition - x / (this.coarsePointer() ? 220 : 280);
    const now = performance.now(),
      elapsed = Math.max(1, now - this.lastSampleTimestamp);
    this.inertiaVelocity = Math.max(
      -3,
      Math.min(3, ((next - this.lastSamplePosition) * 1000) / elapsed),
    );
    this.lastSamplePosition = next;
    this.lastSampleTimestamp = now;
    this.pendingDragPosition = next;
    this.syncMotionLoop();
  };
  readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    const now = performance.now();
    if (this.isDragging) this.lastDragEndAt = now; // ALL drags, even reduced motion / zero velocity.
    // Pointer focus acquired during a drag must not masquerade as a keyboard pause.
    // Preserve focus that was already in the gallery before the gesture.
    if (
      this.isDragging &&
      !this.dragHadFocus &&
      this.sceneRef.nativeElement.contains(document.activeElement)
    ) {
      (document.activeElement as HTMLElement).blur();
    }
    const inertia =
      this.isDragging &&
      !this.isReducedMotion &&
      now - this.lastSampleTimestamp <= 100 &&
      Math.abs(this.inertiaVelocity) > 0.08;
    this.resetPointerState(inertia, true);
    this.syncMotionLoop();
  };
  readonly onPointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    // Touch implicitly captures on the pressed button. Promoting capture to the
    // scene emits a bubbled lostpointercapture from that button, not a cancellation.
    if (
      event.type === 'lostpointercapture' &&
      this.sceneRef.nativeElement.hasPointerCapture(event.pointerId)
    )
      return;
    if (this.isDragging) this.lastDragEndAt = performance.now();
    this.resetPointerState(false);
    this.syncMotionLoop();
  };
  private resetPointerState(allowInertia: boolean, retainPending = false): void {
    const id = this.pointerId;
    this.pointerId = undefined;
    this.isDragging = false;
    this.isPointerDown = false;
    if (!retainPending) this.pendingDragPosition = undefined;
    if (!allowInertia) this.inertiaVelocity = 0;
    if (id !== undefined && this.sceneRef?.nativeElement.hasPointerCapture(id))
      this.sceneRef.nativeElement.releasePointerCapture(id);
  }

  requestPhoto(card: RenderedGalleryCard): void {
    if (
      this.hardStopped ||
      !this.isInteractive(card.logicalIndex) ||
      this.isDragging ||
      performance.now() - this.lastDragEndAt < 350
    )
      return;
    this.cardElements.get(card.logicalIndex)?.face.focus({ preventScroll: true });
    this.photoRequested.emit(positiveModulo(card.logicalIndex, this.photoCount()));
  }
  onSceneKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || this.isSuspended()) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.inertiaVelocity = 0;
      this.autoVelocity = 0;
      this.hoveredLogicalIndex = null;
      this.setMotionPosition(
        Math.round(this.motionPosition) + (event.key === 'ArrowRight' ? 1 : -1),
      );
      this.renderCards(0);
      this.cardElements.get(Math.round(this.motionPosition))?.face.focus({ preventScroll: true });
      this.syncMotionLoop();
    } else if (
      (event.key === 'Enter' || event.key === ' ') &&
      event.target === event.currentTarget &&
      this.photoCount()
    ) {
      event.preventDefault();
      this.photoRequested.emit(positiveModulo(Math.round(this.motionPosition), this.photoCount()));
    }
    // A focused button already implements Enter/Space -> click. Never emit twice.
  }
  isInteractive(index: number): boolean {
    return Math.abs(index - this.position()) <= this.layoutConfig().visibleRadius;
  }
  isActive(card: RenderedGalleryCard): boolean {
    return this.position() === card.logicalIndex;
  }
  isBroken(id: number): boolean {
    return this.brokenPhotoIds().has(id);
  }
  markImageFailed(id: number): void {
    this.brokenPhotoIds.update((ids) => new Set(ids).add(id));
  }
  stageTransform(): string {
    const config = this.layoutConfig();
    return 'rotateX(' + config.cameraPitch + 'deg) rotateY(' + config.cameraYaw + 'deg)';
  }
}
