import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Inject,
  NgZone,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

import { ClosingSectionComponent } from './components/closing-section/closing-section';
import { GiftIntroComponent } from './components/gift-intro/gift-intro';
import { GraduationHeroComponent } from './components/graduation-hero/graduation-hero';
import { GraduationInvitationComponent } from './components/graduation-invitation/graduation-invitation';
import { GraduationLetterComponent } from './components/graduation-letter/graduation-letter';
import { GraduationMessageComponent } from './components/graduation-message/graduation-message';
import { InteractivePhotoGalleryComponent } from './components/interactive-photo-gallery/interactive-photo-gallery';
import { MusicControlComponent } from './components/music-control/music-control';
import { PhotoLightboxComponent } from './components/photo-lightbox/photo-lightbox';
import { SectionNavigatorComponent } from './components/section-navigator/section-navigator';
import { celebrationContent } from './data/celebration-content';

const SECTION_IDS = ['home', 'invitation', 'message', 'memories', 'letter', 'closing'] as const;
type SectionId = (typeof SECTION_IDS)[number];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GraduationHeroComponent,
    GraduationInvitationComponent,
    GraduationMessageComponent,
    InteractivePhotoGalleryComponent,
    MusicControlComponent,
    GraduationLetterComponent,
    ClosingSectionComponent,
    PhotoLightboxComponent,
    GiftIntroComponent,
    SectionNavigatorComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild(MusicControlComponent) private musicControl?: MusicControlComponent;

  protected readonly content = celebrationContent;
  protected readonly lightboxIndex = signal<number | null>(null);
  protected readonly introVisible = signal(this.shouldShowIntro());
  protected readonly activeSectionId = signal<SectionId>('home');

  private readonly sections: HTMLElement[] = [];
  private sectionObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private sectionFrame?: number;
  private settleTimer?: ReturnType<typeof setTimeout>;
  private programmaticTarget?: SectionId;
  private programmaticTimer?: ReturnType<typeof setTimeout>;
  private pageLockScrollY = 0;
  private pageLockStyles?: { position: string; top: string; left: string; right: string; width: string; overflow: string };

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.collectSections();
    this.installSectionTracking();
    this.setActiveFromHash();
    this.scheduleSectionEvaluation();

    if (this.introVisible()) {
      this.lockPageScroll();
    }
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    if (this.sectionFrame !== undefined) {
      cancelAnimationFrame(this.sectionFrame);
    }
    clearTimeout(this.settleTimer);
    clearTimeout(this.programmaticTimer);
    this.removeWindowListeners();
    this.unlockPageScroll();
  }

  protected scrollToSection(id: string): void {
    if (this.isSectionId(id)) {
      this.navigateToSection(id, 'push', 'smooth');
    }
  }

  protected openLightbox(index: number): void {
    if (index >= 0 && index < this.content.photos.length) {
      this.lightboxIndex.set(index);
    }
  }

  protected closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  protected replayJourney(): void {
    this.lightboxIndex.set(null);
    try {
      sessionStorage.removeItem('happy-grad-sweetie:intro-seen');
    } catch {
      // Session storage is optional; replay remains available.
    }

    if (typeof window !== 'undefined') {
      window.history.replaceState({ section: 'home' }, '', '#home');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    this.activeSectionId.set('home');
    this.introVisible.set(true);
    this.lockPageScroll();
  }

  protected openGift(): void {
    // This call stays in the button's trusted click event for iOS/Safari autoplay policy.
    this.musicControl?.playFromUserGesture();
    try {
      sessionStorage.setItem('happy-grad-sweetie:intro-seen', 'true');
    } catch {
      // Session storage is optional; the gift still opens when it is unavailable.
    }

    this.introVisible.set(false);
    this.unlockPageScroll();

    const hashSection = this.getHashSection();
    if (hashSection && hashSection !== 'home') {
      queueMicrotask(() => this.navigateToSection(hashSection, 'none', 'auto'));
    }
  }

  private collectSections(): void {
    for (const id of SECTION_IDS) {
      const element = this.document.getElementById(id);
      if (element) {
        this.sections.push(element);
      }
    }
  }

  private installSectionTracking(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if ('IntersectionObserver' in window) {
      this.sectionObserver = new IntersectionObserver(
        () => this.scheduleSectionEvaluation(),
        { threshold: [0, 0.15, 0.42, 0.7, 1] },
      );
      this.sections.forEach((section) => this.sectionObserver?.observe(section));
    }

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.scheduleSectionEvaluation());
      this.sections.forEach((section) => this.resizeObserver?.observe(section));
    }

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onWindowScroll, { passive: true });
      window.addEventListener('scrollend', this.onScrollEnd, { passive: true });
      window.addEventListener('hashchange', this.onHashChange);
      window.addEventListener('popstate', this.onHistoryNavigation);
      window.visualViewport?.addEventListener('resize', this.onVisualViewportResize, { passive: true });
    });
  }

  private removeWindowListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('scroll', this.onWindowScroll);
    window.removeEventListener('scrollend', this.onScrollEnd);
    window.removeEventListener('hashchange', this.onHashChange);
    window.removeEventListener('popstate', this.onHistoryNavigation);
    window.visualViewport?.removeEventListener('resize', this.onVisualViewportResize);
  }

  private readonly onWindowScroll = (): void => {
    this.scheduleSectionEvaluation();
    this.armScrollEndFallback();
  };

  private readonly onScrollEnd = (): void => {
    this.completeScroll();
  };

  private readonly onHashChange = (): void => {
    const id = this.getHashSection();
    if (id) {
      this.navigateToSection(id, 'none', 'auto');
    }
  };

  private readonly onHistoryNavigation = (): void => {
    const id = this.getHashSection();
    if (id) {
      this.navigateToSection(id, 'none', 'auto');
    }
  };

  private readonly onVisualViewportResize = (): void => {
    this.scheduleSectionEvaluation();
  };

  private navigateToSection(id: SectionId, historyMode: 'push' | 'none', behavior: ScrollBehavior): void {
    const section = this.document.getElementById(id);
    if (!section) {
      return;
    }

    this.programmaticTarget = id;
    this.setActiveSection(id);
    clearTimeout(this.programmaticTimer);

    if (historyMode === 'push' && typeof window !== 'undefined') {
      window.history.pushState({ section: id }, '', `#${id}`);
    }

    section.scrollIntoView({ behavior: this.prefersReducedMotion() ? 'auto' : behavior, block: 'start' });
    this.programmaticTimer = setTimeout(() => this.completeScroll(), behavior === 'auto' ? 40 : 1200);
  }

  private completeScroll(): void {
    clearTimeout(this.settleTimer);
    clearTimeout(this.programmaticTimer);
    this.programmaticTarget = undefined;
    this.scheduleSectionEvaluation();
    this.settleNearestShortSection();
  }

  private armScrollEndFallback(): void {
    clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => this.completeScroll(), 150);
  }

  private scheduleSectionEvaluation(): void {
    if (this.sectionFrame !== undefined || this.sections.length === 0) {
      return;
    }

    this.sectionFrame = requestAnimationFrame(() => {
      this.sectionFrame = undefined;
      this.evaluateActiveSection();
    });
  }

  private evaluateActiveSection(): void {
    if (this.programmaticTarget || typeof window === 'undefined') {
      return;
    }

    const line = this.getViewportHeight() * 0.42;
    const current = this.document.getElementById(this.activeSectionId());
    const currentRect = current?.getBoundingClientRect();
    const currentOwnsLine =
      currentRect !== undefined && line >= currentRect.top - 64 && line <= currentRect.bottom + 64;

    const containing = this.sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= line && rect.bottom >= line;
    });
    const closest = containing ?? this.sections.reduce((best, section) => {
      const sectionRect = section.getBoundingClientRect();
      const bestRect = best.getBoundingClientRect();
      const distance = Math.min(Math.abs(sectionRect.top - line), Math.abs(sectionRect.bottom - line));
      const bestDistance = Math.min(Math.abs(bestRect.top - line), Math.abs(bestRect.bottom - line));
      return distance < bestDistance ? section : best;
    });

    if (closest.id && (!currentOwnsLine || closest.id === this.activeSectionId())) {
      this.setActiveSection(closest.id as SectionId);
    }
  }

  private settleNearestShortSection(): void {
    if (this.programmaticTarget || this.introVisible() || this.lightboxIndex() !== null || typeof window === 'undefined') {
      return;
    }

    const viewportHeight = this.getViewportHeight();
    const threshold = Math.min(viewportHeight * 0.22, 220);
    const target = this.sections
      .filter((section) => section.getBoundingClientRect().height <= viewportHeight * 1.12)
      .map((section) => ({ section, distance: Math.abs(section.getBoundingClientRect().top) }))
      .sort((left, right) => left.distance - right.distance)[0];

    if (target && target.distance > 3 && target.distance <= threshold) {
      this.navigateToSection(target.section.id as SectionId, 'none', 'smooth');
    }
  }

  private setActiveFromHash(): void {
    this.setActiveSection(this.getHashSection() ?? 'home');
  }

  private setActiveSection(id: SectionId): void {
    if (this.activeSectionId() !== id) {
      this.ngZone.run(() => this.activeSectionId.set(id));
    }
  }

  private getHashSection(): SectionId | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    return this.isSectionId(id) ? id : undefined;
  }

  private isSectionId(id: string): id is SectionId {
    return (SECTION_IDS as readonly string[]).includes(id);
  }

  private getViewportHeight(): number {
    return typeof window === 'undefined' ? 0 : window.visualViewport?.height ?? window.innerHeight;
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private lockPageScroll(): void {
    if (typeof window === 'undefined' || this.pageLockStyles) {
      return;
    }

    const body = this.document.body;
    this.pageLockScrollY = window.scrollY;
    this.pageLockStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${this.pageLockScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }

  private unlockPageScroll(): void {
    if (typeof window === 'undefined' || !this.pageLockStyles) {
      return;
    }

    const body = this.document.body;
    Object.assign(body.style, this.pageLockStyles);
    const scrollY = this.pageLockScrollY;
    this.pageLockStyles = undefined;
    window.scrollTo({ top: scrollY, behavior: 'auto' });
  }

  private shouldShowIntro(): boolean {
    try {
      return sessionStorage.getItem('happy-grad-sweetie:intro-seen') !== 'true';
    } catch {
      return true;
    }
  }
}
