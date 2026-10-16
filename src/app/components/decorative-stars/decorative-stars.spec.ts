import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecorativeStarsComponent } from './decorative-stars';

describe('DecorativeStarsComponent', () => {
  let fixture: ComponentFixture<DecorativeStarsComponent>;
  let notify: IntersectionObserverCallback;
  let observer: jasmine.SpyObj<IntersectionObserver>;
  let hidden: jasmine.Spy;
  const intersect = (isIntersecting: boolean) =>
    notify([{ isIntersecting } as IntersectionObserverEntry], observer);
  const state = () =>
    (fixture.nativeElement as HTMLElement).style.getPropertyValue('--star-play-state');

  beforeEach(async () => {
    observer = jasmine.createSpyObj('IntersectionObserver', ['observe', 'disconnect']);
    spyOn(window, 'IntersectionObserver').and.callFake(function (callback) {
      notify = callback;
      return observer;
    });
    hidden = spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    await TestBed.configureTestingModule({
      imports: [DecorativeStarsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DecorativeStarsComponent);
    fixture.detectChanges();
  });

  it('renders a bounded, decorative, non-focusable portrait composition', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelectorAll('.star').length).toBe(6);
    expect(host.querySelectorAll('.stardust').length).toBe(6);
    expect(host.querySelector('button, a, [tabindex]')).toBeNull();
    expect(
      [...host.querySelectorAll('svg')].every((svg) => svg.getAttribute('focusable') === 'false'),
    ).toBeTrue();
  });

  it('uses deterministic closing and accent compositions without duplicating the field', () => {
    fixture.componentRef.setInput('variant', 'closing');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.star').length).toBe(10);
    expect(fixture.nativeElement.getAttribute('data-variant')).toBe('closing');
    fixture.componentRef.setInput('variant', 'accent');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.star').length).toBe(1);
  });

  it('only animates while visible and resumes without recreating stars', () => {
    const first = fixture.nativeElement.querySelector('.star');
    expect(state()).toBe('paused');
    intersect(true);
    expect(state()).toBe('running');
    intersect(false);
    expect(state()).toBe('paused');
    intersect(true);
    expect(state()).toBe('running');
    expect(fixture.nativeElement.querySelector('.star')).toBe(first);
  });

  it('keeps chapter and gallery decoration in a bounded edge composition', () => {
    for (const variant of ['chapter', 'gallery', 'paper']) {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      const stars = [...fixture.nativeElement.querySelectorAll('.star')] as HTMLElement[];
      expect(stars.length).toBe(6);
      expect(stars.every(star => parseFloat(star.style.left) <= 18 ||
        parseFloat(star.style.left) >= 82)).toBeTrue();
    }
  });

  it('pauses on tab visibility changes and cleans up the observer and listener', () => {
    intersect(true);
    hidden.and.returnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(state()).toBe('paused');
    hidden.and.returnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(state()).toBe('running');
    const remove = spyOn(document, 'removeEventListener').and.callThrough();
    fixture.destroy();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith('visibilitychange', jasmine.any(Function));
  });
});
