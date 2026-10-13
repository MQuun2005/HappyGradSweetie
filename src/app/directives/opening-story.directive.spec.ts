import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OpeningStoryDirective } from './opening-story.directive';

@Component({
  imports: [OpeningStoryDirective],
  template: `<div appOpeningStory [enabled]="enabled" [suspended]="suspended" [replayToken]="token">
    <section id="home">
      <div data-hero-glow></div>
      <span data-hero-decoration>✧</span>
      <h1 data-hero-heading>Vợ iu tốt nghiệp rồi!</h1>
      <div data-hero-portrait>Portrait</div>
      <p data-hero-details>Lead</p>
    </section>
  </div>`,
})
class TestHost {
  enabled = false;
  suspended = false;
  token = 0;
}

describe('OpeningStoryDirective — entrance lifecycle', () => {
  let fixture: ComponentFixture<TestHost>;
  let media: MediaQueryList;
  let reduced: boolean;
  let hidden: boolean;
  let rect: DOMRect;
  const state = () => fixture.nativeElement.firstElementChild.dataset.entranceState;
  const render = () => fixture.detectChanges();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    reduced = false;
    hidden = false;
    media = window.matchMedia('(prefers-reduced-motion: reduce)');
    spyOnProperty(media, 'matches', 'get').and.callFake(() => reduced);
    spyOn(window, 'matchMedia').and.returnValue(media);
    rect = new DOMRect(0, 0, 1000, 800);
    spyOn(HTMLElement.prototype, 'getBoundingClientRect').and.callFake(() => rect);
    spyOnProperty(document, 'hidden', 'get').and.callFake(() => hidden);
    fixture = TestBed.createComponent(TestHost);
  });

  afterEach(() => fixture.destroy());

  it('waits behind Intro, starts once, settles on scroll and starts a fresh entrance on replay', () => {
    render();
    expect(state()).toBe('waiting');
    expect(fixture.nativeElement.querySelector('h1').style.opacity).toBe('');
    fixture.componentInstance.enabled = true;
    render();
    expect(state()).toBe('running');
    window.dispatchEvent(new Event('scroll'));
    expect(state()).toBe('complete');
    render();
    expect(state()).toBe('complete');
    fixture.componentInstance.enabled = false;
    fixture.componentInstance.token++;
    render();
    fixture.componentInstance.enabled = true;
    render();
    expect(state()).toBe('running');
  });

  it('pauses and resumes for a modal, then restores all inline styles on destroy', () => {
    fixture.componentInstance.enabled = true;
    render();
    fixture.componentInstance.suspended = true;
    render();
    expect(state()).toBe('paused');
    fixture.componentInstance.suspended = false;
    render();
    expect(state()).toBe('running');
    const heading = fixture.nativeElement.querySelector('h1') as HTMLElement;
    fixture.destroy();
    expect(heading.style.opacity).toBe('');
    expect(heading.style.transform).toBe('');
  });

  it('responds to reduced motion while running, without leaving hidden content or replaying', () => {
    fixture.componentInstance.enabled = true;
    render();
    reduced = true;
    media.dispatchEvent(new Event('change'));
    expect(state()).toBe('complete');
    expect(fixture.nativeElement.querySelector('h1').style.opacity).toBe('');
    reduced = false;
    media.dispatchEvent(new Event('change'));
    expect(state()).toBe('complete');
  });

  it('does not run offscreen, and starts when entering the Hero', () => {
    rect = new DOMRect(0, -2000, 1000, 800);
    fixture.componentInstance.enabled = true;
    render();
    expect(state()).not.toBe('running');
    rect = new DOMRect(0, 0, 1000, 800);
    window.dispatchEvent(new Event('scroll'));
    expect(state()).toBe('running');
  });

  it('renders reduced motion as normal visible content immediately', () => {
    reduced = true;
    render();
    expect(state()).toBe('complete');
    expect(fixture.nativeElement.querySelector('[data-hero-portrait]').style.transform).toBe('');
  });

  it('settles immediately on keyboard focus so a focused CTA is never faded out', () => {
    fixture.componentInstance.enabled = true;
    render();
    fixture.nativeElement.querySelector('#home').dispatchEvent(new FocusEvent('focusin'));
    expect(state()).toBe('complete');
    expect(fixture.nativeElement.querySelector('[data-hero-details]').style.opacity).toBe('');
  });

  it('pauses a hidden tab and resumes only when the page is visible', () => {
    fixture.componentInstance.enabled = true;
    render();
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(state()).toBe('paused');
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(state()).toBe('running');
  });

  it('skips entrance for a chapter deep link instead of animating behind that chapter', () => {
    const previous = location.href;
    try {
      history.replaceState(null, '', '#memories');
      fixture.componentInstance.enabled = true;
      render();
      expect(state()).toBe('complete');
      expect(fixture.nativeElement.querySelector('h1').style.transform).toBe('');
    } finally {
      history.replaceState(null, '', previous);
    }
  });
});
