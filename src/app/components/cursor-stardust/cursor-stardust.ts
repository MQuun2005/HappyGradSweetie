import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';

@Component({
  selector: 'app-cursor-stardust',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cursor-stardust.html',
  styleUrl: './cursor-stardust.css',
  host: { 'aria-hidden': 'true' },
})
export class CursorStardustComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('particle') private particleRefs!: QueryList<ElementRef<HTMLElement>>;
  @Input() set enabled(value: boolean) {
    this.allowed = value;
    if (this.ready) this.zone.runOutsideAngular(this.syncListeners);
  }
  protected readonly particles = Array.from({ length: 16 }, (_, i) => i);

  private readonly zone = inject(NgZone);
  private nodes: HTMLElement[] = [];
  private animations: (Animation | undefined)[] = [];
  private pointerQuery?: MediaQueryList;
  private motionQuery?: MediaQueryList;
  private ready = false;
  private allowed = true;
  private listening = false;
  private next = 0;
  private lastPoint?: { x: number; y: number };
  private lastEmission = -Infinity;

  ngAfterViewInit(): void {
    this.nodes = this.particleRefs.map((ref) => ref.nativeElement);
    this.ready = true;
    this.zone.runOutsideAngular(() => {
      this.pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.pointerQuery.addEventListener('change', this.syncListeners);
      this.motionQuery.addEventListener('change', this.syncListeners);
      document.addEventListener('visibilitychange', this.syncListeners);
      this.syncListeners();
    });
  }

  private readonly syncListeners = (): void => {
    const shouldListen =
      this.ready &&
      this.allowed &&
      !document.hidden &&
      !!this.pointerQuery?.matches &&
      !this.motionQuery?.matches &&
      typeof this.nodes[0]?.animate === 'function';
    if (this.listening === shouldListen) return;
    this.listening = shouldListen;
    if (shouldListen) {
      document.addEventListener('pointermove', this.onMove, { passive: true });
      document.addEventListener('pointerdown', this.clear, { passive: true });
      document.addEventListener('pointercancel', this.clear, { passive: true });
      document.addEventListener('pointerout', this.onLeave, { passive: true });
      window.addEventListener('scroll', this.clear, { passive: true });
      window.addEventListener('blur', this.clear);
      window.addEventListener('resize', this.clear, { passive: true });
    } else {
      document.removeEventListener('pointermove', this.onMove);
      document.removeEventListener('pointerdown', this.clear);
      document.removeEventListener('pointercancel', this.clear);
      document.removeEventListener('pointerout', this.onLeave);
      window.removeEventListener('scroll', this.clear);
      window.removeEventListener('blur', this.clear);
      window.removeEventListener('resize', this.clear);
      this.clear();
    }
  };

  private readonly onMove = (event: PointerEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (
      event.pointerType !== 'mouse' ||
      event.buttons !== 0 ||
      !target?.closest('.app-shell') ||
      target.closest('.photo-card, input, textarea, [contenteditable="true"]')
    ) {
      this.clear();
      return;
    }
    const now = performance.now();
    if (now - this.lastEmission < 55) return;
    if (
      this.lastPoint &&
      Math.hypot(event.clientX - this.lastPoint.x, event.clientY - this.lastPoint.y) < 9
    )
      return;
    this.lastPoint = { x: event.clientX, y: event.clientY };
    this.lastEmission = now;
    const i = this.next;
    this.next = (i + 1) % this.nodes.length;
    this.animations[i]?.cancel();
    const node = this.nodes[i];
    const x = event.clientX + 9,
      y = event.clientY + 12;
    const drift = ((i % 3) - 1) * 14;
    const size = 0.65 + (i % 4) * 0.12;
    const transform = (dx: number, dy: number, scale: number, angle: number) =>
      `translate3d(${x + dx}px, ${y + dy}px, 0) scale(${scale}) rotate(${angle}deg)`;
    // One finite animation per pooled particle. No perpetual RAF, DOM creation or Signals.
    this.animations[i] = node.animate(
      [
        { transform: transform(0, 0, size * 0.6, -8), opacity: 0, offset: 0 },
        { transform: transform(drift * 0.2, 3, size, 0), opacity: 0.85, offset: 0.18 },
        { transform: transform(drift, 25, size * 0.25, 24), opacity: 0, offset: 1 },
      ],
      { duration: 850, easing: 'ease-out' },
    );
  };

  private readonly onLeave = (event: PointerEvent): void => {
    if (!event.relatedTarget) this.clear();
  };

  private readonly clear = (): void => {
    this.animations.forEach((animation) => animation?.cancel());
    this.animations = [];
    this.lastPoint = undefined;
    this.lastEmission = -Infinity;
  };

  ngOnDestroy(): void {
    this.ready = false;
    this.syncListeners();
    this.clear();
    this.pointerQuery?.removeEventListener('change', this.syncListeners);
    this.motionQuery?.removeEventListener('change', this.syncListeners);
    document.removeEventListener('visibilitychange', this.syncListeners);
  }
}
