import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getStoryProfile, storyTravel } from '../utils/opening-story';

/** CSS owns the sticky track; ScrollTrigger only reads scroll progress (no pin or snap). */
@Directive({ selector: '[appOpeningStory]' })
export class OpeningStoryDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input() enabled = false;
  @Input() suspended = false;
  @Input() replayToken = 0;

  private hero?: HTMLElement;
  private view?: Window;
  private media?: MediaQueryList;
  private observer?: IntersectionObserver;
  private context?: gsap.Context;
  private timeline?: gsap.core.Timeline;
  private scrollContext?: gsap.Context;
  private scrollTimeline?: gsap.core.Timeline;
  private trigger?: ScrollTrigger;
  private layoutObserver?: ResizeObserver;
  private portraitObserver?: MutationObserver;
  private layoutFrame = 0;
  private layoutKey = '';
  private played = false;
  private destroyed = false;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly zone: NgZone,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  ngAfterViewInit(): void {
    this.hero = this.host.nativeElement.querySelector<HTMLElement>('#home') ?? undefined;
    this.view = this.document.defaultView ?? undefined;
    if (!this.hero || !this.view) return;

    this.zone.runOutsideAngular(() => {
      this.media = this.view!.matchMedia('(prefers-reduced-motion: reduce)');
      this.media.addEventListener('change', this.onMotionPreference);
      this.view!.addEventListener('scroll', this.onScroll, { passive: true });
      this.hero!.addEventListener('focusin', this.onFocus);
      this.document.addEventListener('visibilitychange', this.onVisibility);
      if (typeof IntersectionObserver !== 'undefined') {
        this.observer = new IntersectionObserver(() => this.reconcile(), { threshold: [0, 0.2] });
        this.observer.observe(this.hero!);
      }
      // A restored/deep-linked chapter must not trigger an offscreen entrance.
      if (this.view!.location.hash && this.view!.location.hash !== '#home') {
        this.played = true;
      }
      this.layoutObserver = new ResizeObserver(() => this.scheduleLayout());
      this.layoutObserver.observe(this.hero!);
      const slot = this.host.nativeElement.querySelector<HTMLElement>('.hero__portrait-slot');
      if (slot) this.layoutObserver.observe(slot);
      const portrait = this.host.nativeElement.querySelector<HTMLElement>(
        '.hero__portrait-position .hero__portrait',
      );
      if (portrait) {
        this.portraitObserver = new MutationObserver(() => this.scheduleLayout());
        this.portraitObserver.observe(portrait, { attributes: true, attributeFilter: ['class'] });
      }
      this.host.nativeElement.addEventListener('load', this.onAssetLoad, true);
      this.view!.addEventListener('resize', this.onResize, { passive: true });
      void this.document.fonts.ready.then(() => {
        if (!this.destroyed) this.scheduleLayout();
      });
      this.refreshLayout();
      this.reconcile();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.hero) return;
    this.zone.runOutsideAngular(() => {
      if (changes['replayToken']) {
        this.restoreStyles();
        this.played = false;
      }
      this.reconcile();
      this.syncSuspension();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.restoreStyles();
    this.scrollContext?.revert();
    this.layoutObserver?.disconnect();
    this.portraitObserver?.disconnect();
    this.view?.cancelAnimationFrame(this.layoutFrame);
    this.view?.removeEventListener('resize', this.onResize);
    this.host.nativeElement.removeEventListener('load', this.onAssetLoad, true);
    this.observer?.disconnect();
    this.media?.removeEventListener('change', this.onMotionPreference);
    this.view?.removeEventListener('scroll', this.onScroll);
    this.hero?.removeEventListener('focusin', this.onFocus);
    this.document.removeEventListener('visibilitychange', this.onVisibility);
    this.host.nativeElement.removeAttribute('data-entrance-state');
    this.host.nativeElement.removeAttribute('data-story-profile');
  }

  private reconcile(): void {
    if (this.destroyed || !this.hero || !this.view) return;
    if (this.media?.matches) {
      this.finish();
      return;
    }
    if (!this.enabled || this.suspended || this.document.hidden) {
      this.timeline?.pause();
      this.setState(this.timeline ? 'paused' : 'waiting');
      return;
    }
    const box = this.hero.getBoundingClientRect();
    const viewportHeight =
      this.view.visualViewport?.height ?? this.document.documentElement.clientHeight;
    const visible = box.bottom > viewportHeight * 0.2 && box.top < viewportHeight * 0.8;
    if (!visible) {
      if (this.timeline) this.finish();
      else if (this.played) this.setState('complete');
      return;
    }
    if (this.timeline) {
      this.timeline.resume();
      this.setState('running');
    } else if (!this.played) {
      this.startEntrance();
    } else {
      this.setState('complete');
    }
  }

  private startEntrance(): void {
    this.played = true;
    this.setState('running');
    try {
      this.context = gsap.context(() => {
        const query = (selector: string) =>
          this.host.nativeElement.querySelectorAll<HTMLElement>(selector);
        this.timeline = gsap.timeline({
          defaults: { ease: 'power2.out' },
          onComplete: () => this.finish(),
        });
        this.timeline
          .fromTo(query('[data-hero-glow]'), { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0)
          .fromTo(
            query('[data-hero-heading]'),
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.035 },
            0.1,
          )
          .fromTo(
            query('[data-hero-portrait]'),
            { opacity: 0, scale: 0.98, y: 24 },
            { opacity: 1, scale: 1, y: 0, duration: 0.67 },
            0.18,
          )
          .fromTo(
            query('[data-hero-details], [data-hero-decoration]'),
            { opacity: 0 },
            { opacity: 1, duration: 0.5 },
            0.45,
          );
      }, this.host.nativeElement);
    } catch {
      // CSS is fully readable by default; animation failure must never hide the gift.
      this.finish();
    }
  }

  private finish(): void {
    this.played = true;
    this.restoreStyles();
    this.setState('complete');
  }

  private restoreStyles(): void {
    this.timeline?.kill();
    this.timeline = undefined;
    this.context?.revert();
    this.context = undefined;
  }

  private setState(state: 'waiting' | 'running' | 'paused' | 'complete'): void {
    this.host.nativeElement.dataset['entranceState'] = state;
  }

  private readonly onScroll = (): void => {
    // A user who moves on immediately should see final content, not two transform writers.
    if (this.timeline && this.enabled && !this.suspended && !this.document.hidden) this.finish();
    else if (!this.played) this.reconcile();
  };
  private readonly onVisibility = (): void => {
    this.reconcile();
    this.syncSuspension();
  };
  private readonly onMotionPreference = (): void => {
    this.reconcile();
    this.refreshLayout();
  };
  private readonly onFocus = (): void => {
    if (this.timeline) this.finish();
  };

  /** Measure the normal-flow slot, not an animated descendant. Safe to call after modal unlock. */
  refreshLayout(): void {
    if (!this.hero || !this.view || this.destroyed) return;
    const host = this.host.nativeElement;
    const slot = host.querySelector<HTMLElement>('.hero__portrait-slot');
    const positioner = host.querySelector<HTMLElement>('.hero__portrait-position');
    const invitation = host.querySelector<HTMLElement>('#invitation');
    if (!slot || !positioner || !invitation) return;
    const root = this.document.documentElement;
    const heroBox = this.hero.getBoundingClientRect();
    const box = slot.getBoundingClientRect();
    const width = root.clientWidth;
    const height = root.clientHeight;
    const left = box.left - heroBox.left,
      top = box.top - heroBox.top;
    host.style.setProperty('--portrait-left', `${left}px`);
    host.style.setProperty('--portrait-top', `${top}px`);
    host.style.setProperty('--portrait-width', `${box.width}px`);
    host.style.setProperty('--portrait-height', `${box.height}px`);
    host.style.setProperty('--story-viewport', `${height}px`);
    const fineHover =
      this.view.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !this.view.matchMedia('(any-pointer: coarse)').matches;
    const profile = getStoryProfile({
      width,
      height,
      fineHover,
      reducedMotion: !!this.media?.matches,
      fallback: !!host.querySelector('.hero__portrait--fallback'),
      contentFits: heroBox.height <= height + 8,
      portraitHeight: box.height,
    });
    // Toolbar-only changes on touch do not rebuild the timeline or the normal-flow chapters.
    const key = [
      profile,
      width,
      fineHover ? height : 0,
      box.width,
      box.height,
      heroBox.height,
    ].join(':');
    if (key === this.layoutKey) {
      this.trigger?.refresh();
      this.syncSuspension();
      return;
    }
    this.layoutKey = key;
    this.scrollContext?.revert();
    this.scrollContext = undefined;
    this.scrollTimeline = undefined;
    this.trigger = undefined;
    host.dataset['storyProfile'] = profile;
    if (profile === 'static') return;
    try {
      gsap.registerPlugin(ScrollTrigger);
      const portrait = host.querySelector<HTMLElement>('.hero__portrait-motion')!;
      const card = host.querySelector<HTMLElement>('.invitation__card')!;
      const travel = storyTravel(width, height, box.left, top, box.width, box.height);
      this.scrollContext = gsap.context(() => {
        const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
        if (profile === 'sticky') {
          timeline
            .to(
              portrait,
              { x: travel.x * 0.5, y: travel.y * 0.5, scale: 0.94, duration: 0.3 },
              0.15,
            )
            .to(portrait, { x: travel.x, y: travel.y, scale: 0.86, duration: 0.3 }, 0.45)
            .to(portrait, { scale: 0.84, opacity: 0, duration: 0.25 }, 0.75)
            .fromTo(card, { y: 24 }, { y: 0, duration: 0.55 }, 0.45);
        } else {
          timeline.to(
            portrait,
            { y: width < 768 ? 16 : 24, scale: width < 768 ? 0.98 : 0.96, duration: 1 },
            0,
          );
        }
        this.scrollTimeline = timeline;
        this.trigger = ScrollTrigger.create({
          trigger: this.hero,
          start: 'top top',
          endTrigger: invitation,
          end: 'top top',
          animation: timeline,
          scrub: 0.45,
          pin: false,
          onUpdate: (self) => {
            host.dataset['storyProgress'] = self.progress.toFixed(3);
          },
        });
      }, host);
      this.synchronize();
      this.syncSuspension();
    } catch {
      this.scrollContext?.revert();
      this.scrollContext = undefined;
      this.trigger = undefined;
      host.dataset['storyProfile'] = 'static';
    }
  }

  /** Instant anchors/restoration should not wait for numeric scrub catch-up. */
  synchronize(): void {
    if (!this.trigger || !this.scrollTimeline || !this.view || !this.enabled || this.suspended)
      return;
    this.trigger.update();
    const progress = Math.max(
      0,
      Math.min(
        1,
        (this.view.scrollY - this.trigger.start) / (this.trigger.end - this.trigger.start || 1),
      ),
    );
    this.trigger.getTween()?.pause();
    this.scrollTimeline.progress(progress);
    this.host.nativeElement.dataset['storyProgress'] = progress.toFixed(3);
  }

  private syncSuspension(): void {
    if (!this.enabled || this.suspended || this.document.hidden) {
      this.trigger?.disable(false);
      this.trigger?.getTween()?.pause();
    } else {
      this.trigger?.enable(false, false);
      this.synchronize();
    }
  }

  private scheduleLayout(): void {
    if (this.layoutFrame || this.destroyed || !this.view) return;
    this.layoutFrame = this.view.requestAnimationFrame(() => {
      this.layoutFrame = 0;
      this.refreshLayout();
    });
  }
  private readonly onResize = (): void => this.scheduleLayout();
  private readonly onAssetLoad = (): void => this.scheduleLayout();
}
