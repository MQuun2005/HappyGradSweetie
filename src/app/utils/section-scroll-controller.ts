import {
  activeChapter,
  chooseAlignment,
  isSectionId,
  SECTION_IDS,
  SectionId,
  SectionMetrics,
  ScrollDirection,
} from './section-alignment';

interface ReadingPosition {
  y: number;
  chapter: SectionId;
  offset: number;
}
interface ScrollCommand {
  id?: SectionId;
  y?: number;
  kind: 'navigation' | 'restoration' | 'alignment';
}
interface ScrollCallbacks {
  active: (id: SectionId) => void;
  layout: () => void;
  synchronize: () => void;
}

/** The only owner of page scroll corrections. Native wheel/touch scrolling is never prevented. */
export class SectionScrollController {
  private readonly view: Window;
  private readonly abort = new AbortController();
  private readonly sections: HTMLElement[];
  private readonly reduced: MediaQueryList;
  private readonly touch: MediaQueryList;
  private readonly previousRestoration: ScrollRestoration;
  private metrics: SectionMetrics[] = [];
  private resizeObserver?: ResizeObserver;
  private frame = 0;
  private layoutFrame = 0;
  private stableFrame = 0;
  private endTimer = 0;
  private watchdog = 0;
  private active: SectionId = 'home';
  private direction: ScrollDirection = 0;
  private lastY = 0;
  private width = 0;
  private reading?: ReadingPosition;
  private command?: ScrollCommand;
  private suspended = false;
  private destroyed = false;
  private initial = true;
  private pendingRestore?: { id?: SectionId; y?: number };
  private popUrl?: string;
  private burst = false;
  private burstMoved = false;
  private corrected = false;
  private gestureBlocked = false;
  private pointer?: { id: number; x: number; y: number; gallery: boolean };
  private touches = 0;
  private readonly keys = new Set<string>();

  constructor(
    private readonly document: Document,
    private readonly callbacks: ScrollCallbacks,
  ) {
    if (!document.defaultView) throw new Error('Page scrolling requires a browser window.');
    this.view = document.defaultView;
    this.sections = SECTION_IDS.flatMap((id) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    if (this.sections.length !== SECTION_IDS.length)
      throw new Error('Chapter anchors are incomplete.');
    this.reduced = this.view.matchMedia('(prefers-reduced-motion: reduce)');
    this.touch = this.view.matchMedia('(any-pointer: coarse)');
    this.previousRestoration = this.view.history.scrollRestoration;
    this.view.history.scrollRestoration = 'manual';
    document.documentElement.dataset['scrollCoordinator'] = 'ready';
    this.width = document.documentElement.clientWidth;
    this.lastY = this.view.scrollY;
    this.measure();
    this.listen(this.view, 'scroll', this.onScroll);
    this.listen(document, 'scrollend', this.onScrollEnd);
    this.listen(this.view, 'resize', this.onResize);
    this.listen(this.view.visualViewport, 'resize', this.onViewportResize);
    this.listen(this.view, 'popstate', this.onPopState);
    this.listen(this.view, 'hashchange', this.onHashChange);
    this.listen(document, 'wheel', this.onWheel);
    this.listen(document, 'pointerdown', this.onPointerDown);
    this.listen(document, 'pointermove', this.onPointerMove);
    this.listen(document, 'pointerup', this.onPointerEnd);
    this.listen(document, 'pointercancel', this.onPointerEnd);
    this.listen(document, 'touchstart', this.onTouchStart);
    this.listen(document, 'touchend', this.onTouchEnd);
    this.listen(document, 'touchcancel', this.onTouchEnd);
    this.listen(document, 'keydown', this.onKeyDown);
    this.listen(document, 'keyup', this.onKeyUp);
    this.listen(document, 'click', this.onAnchorClick, false);
    this.listen(this.view, 'blur', this.onBlur);
    this.listen(this.reduced, 'change', this.onPreference);
    this.resizeObserver = new ResizeObserver(() => this.queueLayout(true));
    this.sections.forEach((section) => this.resizeObserver!.observe(section));
    void document.fonts.ready.then(() => {
      if (!this.destroyed) this.queueLayout(true);
    });
    this.queueLayout(false);
  }

  navigate(id: SectionId, history: 'push' | 'replace' | 'none' = 'push', smooth = true): void {
    if (this.suspended) {
      this.pendingRestore = { id };
      return;
    }
    this.cancelCommand();
    this.saveReading();
    const state = { ...this.historyState(), happyGradReading: undefined };
    if (history === 'push' && this.view.location.hash !== `#${id}`) {
      this.view.history.pushState(state, '', `#${id}`);
    } else if (history === 'replace') {
      this.view.history.replaceState(state, '', `#${id}`);
    }
    this.beginCommand({ id, kind: 'navigation' });
    this.document
      .getElementById(id)!
      .scrollIntoView({
        block: 'start',
        behavior: smooth && !this.reduced.matches ? 'smooth' : 'instant',
      });
    if (!smooth || this.reduced.matches) this.callbacks.synchronize();
    this.checkStableAfterQuiet();
  }

  suspend(): void {
    if (this.suspended) return;
    this.cancelCommand();
    this.saveReading();
    this.suspended = true;
    this.burst = false;
    this.clearEndCheck();
    this.setState('suspended');
  }

  resume(): void {
    if (!this.suspended) return;
    this.suspended = false;
    this.lastY = this.view.scrollY;
    this.measure();
    this.callbacks.layout();
    this.callbacks.synchronize();
    this.burst = false;
    this.setState('idle');
    this.restorePending();
    this.updateActive();
  }

  destroy(): void {
    this.destroyed = true;
    this.abort.abort();
    this.resizeObserver?.disconnect();
    this.clearEndCheck();
    this.view.clearTimeout(this.watchdog);
    this.view.cancelAnimationFrame(this.frame);
    this.view.cancelAnimationFrame(this.layoutFrame);
    this.view.history.scrollRestoration = this.previousRestoration;
    delete this.document.documentElement.dataset['scrollCoordinator'];
    delete this.document.documentElement.dataset['scrollState'];
    delete this.document.documentElement.dataset['scrollReason'];
  }

  private listen(
    target: EventTarget | null | undefined,
    name: string,
    listener: (event: never) => void,
    passive = true,
  ): void {
    target?.addEventListener(name, listener as EventListener, {
      passive,
      signal: this.abort.signal,
    });
  }

  private get height(): number {
    return this.view.visualViewport?.height ?? this.document.documentElement.clientHeight;
  }
  private get held(): boolean {
    return !!this.pointer || this.touches > 0 || this.keys.size > 0;
  }
  private target(event: Event): Element | null {
    return event.target instanceof Element ? event.target : null;
  }
  private historyState(): Record<string, unknown> {
    const value: unknown = this.view.history.state;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }
  private hash(): SectionId | undefined {
    try {
      const id = decodeURIComponent(this.view.location.hash.slice(1));
      return isSectionId(id) ? id : undefined;
    } catch {
      return undefined;
    }
  }
  private measure(): void {
    const y = this.view.scrollY;
    this.metrics = this.sections.map((element) => {
      const box = element.getBoundingClientRect();
      return { id: element.id as SectionId, top: box.top + y, height: box.height };
    });
  }
  private currentReading(): ReadingPosition {
    const y = this.view.scrollY;
    const section =
      [...this.metrics].reverse().find((section) => section.top <= y + 4) ?? this.metrics[0];
    return { y, chapter: section.id, offset: Math.max(0, y - section.top) };
  }
  private saveReading(): void {
    if (this.suspended) return;
    this.reading = this.currentReading();
    this.view.history.replaceState({ ...this.historyState(), happyGradReading: this.reading }, '');
  }
  private updateActive(): void {
    if (this.suspended) return;
    const next =
      this.command?.id ?? activeChapter(this.metrics, this.view.scrollY, this.height, this.active);
    if (next !== this.active) {
      this.active = next;
      this.callbacks.active(next);
    }
  }
  private setState(value: string, reason = ''): void {
    this.document.documentElement.dataset['scrollState'] = value;
    this.document.documentElement.dataset['scrollReason'] = reason;
  }
  private beginCommand(command: ScrollCommand): void {
    this.command = command;
    this.burst = false;
    this.setState(command.kind);
    this.updateActive();
    // A safety release, not a completion timer or a second settlement.
    this.view.clearTimeout(this.watchdog);
    this.watchdog = this.view.setTimeout(() => this.cancelCommand(), 5000);
  }
  private cancelCommand(): void {
    if (this.command) this.view.scrollTo({ top: this.view.scrollY, behavior: 'instant' });
    this.command = undefined;
    this.view.clearTimeout(this.watchdog);
    this.clearEndCheck();
    this.setState(this.suspended ? 'suspended' : 'idle');
  }
  private clearEndCheck(): void {
    this.view.clearTimeout(this.endTimer);
    this.view.cancelAnimationFrame(this.stableFrame);
    this.stableFrame = 0;
  }
  private newInput(): void {
    if (this.suspended) return;
    if (!this.burst || this.command) {
      this.corrected = false;
      this.gestureBlocked = false;
      this.burstMoved = false;
    }
    this.cancelCommand();
    this.burst = true;
    this.setState('native-input');
  }
  private checkStableAfterQuiet(): void {
    this.clearEndCheck();
    this.endTimer = this.view.setTimeout(() => this.checkStable(), this.touch.matches ? 240 : 180);
  }
  private checkStable(): void {
    if (this.suspended || this.held || this.destroyed) return;
    this.view.cancelAnimationFrame(this.stableFrame);
    let previous = this.view.scrollY,
      frames = 0;
    const tick = () => {
      this.stableFrame = 0;
      if (this.destroyed || this.suspended || this.held) return;
      const y = this.view.scrollY;
      frames = Math.abs(y - previous) <= 1 ? frames + 1 : 0;
      previous = y;
      if (frames >= 4) this.completeScroll();
      else this.stableFrame = this.view.requestAnimationFrame(tick);
    };
    this.stableFrame = this.view.requestAnimationFrame(tick);
  }
  private completeScroll(): void {
    this.clearEndCheck();
    if (this.command) {
      const requested = this.command.id
        ? this.metrics.find((section) => section.id === this.command!.id)?.top
        : this.command.y;
      const maximum = Math.max(0, this.document.documentElement.scrollHeight - this.height);
      const target = requested === undefined ? undefined : Math.max(0, Math.min(requested, maximum));
      // A stale native scrollend or a few stalled frames must not release the
      // target lock while the browser's smooth scroll is still in transit.
      if (target !== undefined && Math.abs(this.view.scrollY - target) > 4) {
        this.checkStableAfterQuiet();
        return;
      }
      this.command = undefined;
      this.view.clearTimeout(this.watchdog);
      this.burst = false;
      this.callbacks.synchronize();
      this.updateActive();
      this.saveReading();
      this.setState('idle', 'command-complete');
      return;
    }
    if (!this.burst || this.suspended) return;
    // A click/focus interaction is not a scroll gesture and must not move the page.
    if (!this.burstMoved) {
      this.burst = false;
      this.setState('idle', 'no-scroll');
      return;
    }
    const story = this.document.querySelector<HTMLElement>('[appOpeningStory]');
    const storyRange: readonly [number, number] | null =
      story?.dataset['storyProfile'] === 'sticky'
        ? [this.metrics[0].top, this.metrics[1].top]
        : null;
    const decision = chooseAlignment({
      sections: this.metrics,
      y: this.view.scrollY,
      viewportHeight: this.height,
      direction: this.direction,
      touch: this.touch.matches,
      reducedMotion: this.reduced.matches,
      zoomed: Math.abs((this.view.visualViewport?.scale ?? 1) - 1) > 0.01,
      suspended: this.suspended,
      gestureActive: this.held || this.gestureBlocked,
      corrected: this.corrected,
      storyRange,
    });
    this.burst = false;
    this.setState('idle', decision.reason);
    if (decision.target) {
      this.corrected = true;
      this.beginCommand({ id: decision.target.id, kind: 'alignment' });
      this.view.scrollTo({ top: decision.target.top, behavior: 'smooth' });
      this.checkStableAfterQuiet();
    } else this.saveReading();
  }
  private queueLayout(preserve: boolean): void {
    if (this.destroyed || this.layoutFrame) return;
    const old = this.reading;
    this.layoutFrame = this.view.requestAnimationFrame(() => {
      this.layoutFrame = 0;
      if (this.suspended) return;
      this.callbacks.layout();
      this.measure();
      if (this.initial) {
        this.initial = false;
        this.pendingRestore ??= { id: this.hash() };
        this.restorePending();
      } else if (preserve && old && !this.burst && !this.command && !this.held) {
        const section = this.metrics.find((section) => section.id === old.chapter)!;
        this.view.scrollTo({
          top: section.top + Math.min(old.offset, Math.max(0, section.height - 1)),
          behavior: 'instant',
        });
        this.callbacks.synchronize();
      }
      this.updateActive();
      if (!this.command) this.saveReading();
    });
  }
  private restorePending(): void {
    if (this.suspended) return;
    const pending = this.pendingRestore ?? (this.initial ? { id: this.hash() } : undefined);
    this.pendingRestore = undefined;
    this.initial = false;
    if (!pending) return;
    if (pending.y !== undefined) {
      this.cancelCommand();
      this.beginCommand({ kind: 'restoration', y: pending.y });
      this.view.scrollTo({ top: pending.y, behavior: 'instant' });
      this.callbacks.synchronize();
      this.checkStableAfterQuiet();
    } else if (pending.id) this.navigate(pending.id, 'none', false);
  }

  private readonly onScroll = (): void => {
    if (this.suspended) return;
    const y = this.view.scrollY,
      delta = y - this.lastY;
    if (Math.abs(delta) > 0.5 && !this.command) {
      this.direction = delta > 0 ? 1 : -1;
      if (this.burst) this.burstMoved = true;
    }
    this.lastY = y;
    if (!this.frame)
      this.frame = this.view.requestAnimationFrame(() => {
        this.frame = 0;
        this.updateActive();
        this.reading = this.currentReading();
      });
    if (!('onscrollend' in this.document)) this.checkStableAfterQuiet();
  };
  private readonly onScrollEnd = (): void => {
    this.clearEndCheck();
    this.checkStable();
  };
  private readonly onResize = (): void => {
    const width = this.document.documentElement.clientWidth;
    const changedWidth = Math.abs(width - this.width) > 2;
    this.width = width;
    this.queueLayout(changedWidth || !this.touch.matches);
  };
  private readonly onViewportResize = (): void => {
    this.clearEndCheck();
    this.burst = false;
    this.queueLayout(false);
  };
  private readonly onPreference = (): void => {
    this.cancelCommand();
    this.burst = false;
    this.queueLayout(false);
  };
  private readonly onPopState = (): void => {
    this.popUrl = this.view.location.href;
    const reading = this.historyState()['happyGradReading'] as Partial<ReadingPosition> | undefined;
    this.pendingRestore =
      typeof reading?.y === 'number' && Number.isFinite(reading.y)
        ? { y: reading.y }
        : { id: this.hash() };
    this.restorePending();
  };
  private readonly onHashChange = (): void => {
    if (this.popUrl === this.view.location.href) {
      this.popUrl = undefined;
      return;
    }
    this.popUrl = undefined;
    this.pendingRestore = { id: this.hash() };
    this.restorePending();
  };
  private readonly onAnchorClick = (event: MouseEvent): void => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor = this.target(event)?.closest<HTMLAnchorElement>('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, this.view.location.href);
    if (
      url.origin !== this.view.location.origin ||
      url.pathname !== this.view.location.pathname ||
      url.search !== this.view.location.search
    )
      return;
    const id = url.hash.slice(1);
    if (isSectionId(id)) {
      event.preventDefault();
      this.navigate(id);
    }
  };
  private readonly onWheel = (event: WheelEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      this.cancelCommand();
      this.burst = false;
      return;
    }
    if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
      this.newInput();
      this.checkStableAfterQuiet();
    }
  };
  private readonly onPointerDown = (event: PointerEvent): void => {
    this.newInput();
    this.pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      gallery: !!this.target(event)?.closest('#memories'),
    };
  };
  private readonly onPointerMove = (event: PointerEvent): void => {
    const pointer = this.pointer;
    if (!pointer || pointer.id !== event.pointerId || !pointer.gallery) return;
    const x = Math.abs(event.clientX - pointer.x),
      y = Math.abs(event.clientY - pointer.y);
    if (x > 8 && x > y) this.gestureBlocked = true;
  };
  private readonly onPointerEnd = (event: PointerEvent): void => {
    if (this.pointer?.id === event.pointerId) this.pointer = undefined;
    this.checkStableAfterQuiet();
  };
  private readonly onTouchStart = (event: TouchEvent): void => {
    this.touches = event.touches.length;
    if (this.touches > 1) {
      this.gestureBlocked = true;
      this.burst = false;
    }
  };
  private readonly onTouchEnd = (event: TouchEvent): void => {
    this.touches = event.touches.length;
    this.checkStableAfterQuiet();
  };
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      this.target(event)?.closest('input, textarea, select, [contenteditable]')
    )
      return;
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
      this.newInput();
      this.keys.add(event.key);
    }
  };
  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (this.keys.delete(event.key)) this.checkStableAfterQuiet();
  };
  private readonly onBlur = (): void => {
    this.pointer = undefined;
    this.touches = 0;
    this.keys.clear();
    this.burst = false;
    this.cancelCommand();
  };
}
