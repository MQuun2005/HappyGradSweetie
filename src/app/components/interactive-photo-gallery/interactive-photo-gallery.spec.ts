import { ComponentFixture, TestBed } from '@angular/core/testing';

import { celebrationContent } from '../../data/celebration-content';
import { InteractivePhotoGalleryComponent } from './interactive-photo-gallery';

describe('InteractivePhotoGalleryComponent', () => {
  let fixture: ComponentFixture<InteractivePhotoGalleryComponent>;
  let component: InteractivePhotoGalleryComponent;
  let visibility: IntersectionObserverCallback;
  let clock = 1000;
  // Explicit frame clock: tests never leave a real autoplay loop running.
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame = 0;

  beforeEach(async () => {
    frames = new Map();
    spyOn(window, 'requestAnimationFrame').and.callFake(callback => {
      frames.set(++nextFrame, callback); return nextFrame;
    });
    spyOn(window, 'cancelAnimationFrame').and.callFake(id => { frames.delete(id); });
    spyOn(performance, 'now').and.callFake(() => clock);
    spyOn(window, 'IntersectionObserver').and.callFake(function(callback) { return {
      observe: (target: Element) => { visibility = callback; callback([{target, isIntersecting: true, intersectionRatio: 1} as IntersectionObserverEntry], {} as IntersectionObserver); },
      unobserve: () => {}, disconnect: () => {}, takeRecords: () => [], root: null,
      rootMargin: '0px', thresholds: [0],
    }; });
    await TestBed.configureTestingModule({
      imports: [InteractivePhotoGalleryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InteractivePhotoGalleryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('content', celebrationContent.gallery);
  });

  afterEach(() => fixture.destroy());

  function mount(): HTMLElement {
    fixture.componentRef.setInput('photos', celebrationContent.photos);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.gallery__scene');
  }
  function pointer(type: string, x: number, y: number): PointerEvent {
    return new PointerEvent(type, {pointerId: 7, pointerType: 'touch', isPrimary: true,
      clientX: x, clientY: y, bubbles: true, cancelable: true});
  }
  function tick(ms: number): void {
    clock += ms;
    const callbacks = [...frames.values()]; frames.clear();
    callbacks.forEach(callback => callback(clock));
  }

  it('renders the virtual 34-photo gallery with front and back cards', () => {
    fixture.componentRef.setInput('photos', celebrationContent.photos);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.photoCount()).toBe(34);
    expect(fixture.nativeElement.querySelectorAll('.photo-card').length).toBe(component.renderedCards().length);
    expect(fixture.nativeElement.querySelectorAll('.photo-card img').length).toBe(component.renderedCards().length);
    expect(component.renderedCards().length).toBeGreaterThan(0);
    expect(component.renderedCards().length).toBeLessThanOrEqual(11);
    expect(fixture.nativeElement.querySelector('.photo-card')?.getAttribute('aria-setsize')).toBe('34');

    // Controls buttons are removed per user request
    expect(fixture.nativeElement.querySelector('.gallery__controls')).toBeNull();

    // Verify front cards exist and back cards exist
    const frontCards = fixture.nativeElement.querySelectorAll('.photo-card--front');
    const backCards = fixture.nativeElement.querySelectorAll('.photo-card--back');
    expect(frontCards.length).toBeGreaterThan(0);
    expect(backCards.length).toBeGreaterThan(0);
  });

  it('handles an empty gallery without a runtime exception', () => {
    fixture.componentRef.setInput('photos', []);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.photoCount()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.photo-card').length).toBe(0);
    expect(fixture.nativeElement.querySelector('.gallery__empty')).not.toBeNull();
  });

  it('allows clicking front cards to open photo and blocks back cards', () => {
    fixture.componentRef.setInput('photos', celebrationContent.photos);
    fixture.detectChanges();
    const requested: number[] = [];
    component.photoRequested.subscribe((index) => requested.push(index));

    // Clicking an active front card emits photo requested
    const frontCard = fixture.nativeElement.querySelector('.photo-card--front') as HTMLButtonElement;
    expect(frontCard).not.toBeNull();
    frontCard.click();
    expect(requested.length).toBe(1);

    // Clicking a back card does NOT emit photo requested
    const backCard = fixture.nativeElement.querySelector('.photo-card--back') as HTMLButtonElement;
    expect(backCard).not.toBeNull();
    backCard.click();
    expect(requested.length).toBe(1); // count remains 1
  });

  it('renders a single photo once, not eleven duplicates', () => {
    fixture.componentRef.setInput('photos', celebrationContent.photos.slice(0, 1));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.photo-card').length).toBe(1);
    expect(component.activePhotoNumber()).toBe(1);
  });

  it('cancels the motion RAF when suspended or outside the viewport', () => {
    const scene = mount();
    tick(16); tick(16);
    component.suspended = true;
    const paused = component.position();
    tick(2000);
    expect(component.position()).toBe(paused);
    component.suspended = false;
    const rect = scene.getBoundingClientRect();
    visibility([{target: scene, isIntersecting: false, intersectionRatio: 0,
      boundingClientRect: rect, intersectionRect: new DOMRect(), rootBounds: null, time: clock}], {} as IntersectionObserver);
    tick(16); // A final measurement is allowed; persistent motion is not.
    expect(frames.size).toBe(0);
  });

  it('leaves vertical scrolling native and captures only horizontal drags past 8px', () => {
    const scene = mount();
    const capture = spyOn(scene, 'setPointerCapture');
    component.onPointerDown(pointer('pointerdown', 200, 200));
    component.onPointerMove(pointer('pointermove', 203, 204));
    expect(capture).not.toHaveBeenCalled();
    const vertical = pointer('pointermove', 205, 240);
    component.onPointerMove(vertical);
    expect(vertical.defaultPrevented).toBeFalse();
    expect(capture).not.toHaveBeenCalled();
    component.onPointerDown(pointer('pointerdown', 200, 200));
    const horizontal = pointer('pointermove', 240, 204);
    component.onPointerMove(horizontal);
    expect(capture).toHaveBeenCalledOnceWith(7);
    expect(horizontal.defaultPrevented).toBeTrue();
  });

  it('suppresses clicks after even a slow drag with no release velocity', () => {
    const scene = mount(); spyOn(scene, 'setPointerCapture');
    const emit = spyOn(component.photoRequested, 'emit');
    component.onPointerDown(pointer('pointerdown', 200, 200));
    clock += 200;
    component.onPointerMove(pointer('pointermove', 220, 200));
    clock += 250; // Hold: velocity sample has expired before release.
    component.onPointerUp(pointer('pointerup', 220, 200));
    component.requestPhoto(component.renderedCards().find(card => card.logicalIndex === 0)!);
    expect(emit).not.toHaveBeenCalled();
    clock += 351;
    component.requestPhoto(component.renderedCards().find(card => card.logicalIndex === 0)!);
    expect(emit).toHaveBeenCalledOnceWith(0);
  });

  it('cancels a captured drag without a stuck gesture or accidental click', () => {
    const scene = mount(); spyOn(scene, 'setPointerCapture');
    const emit = spyOn(component.photoRequested, 'emit');
    component.onPointerDown(pointer('pointerdown', 200, 200));
    component.onPointerMove(pointer('pointermove', 240, 200));
    component.onPointerCancel(pointer('pointercancel', 240, 200));
    component.requestPhoto(component.renderedCards().find(card => card.logicalIndex === 0)!);
    expect(emit).not.toHaveBeenCalled();
    clock += 351;
    component.onPointerDown(pointer('pointerdown', 200, 200));
    component.onPointerUp(pointer('pointerup', 200, 200));
    component.requestPhoto(component.renderedCards().find(card => card.logicalIndex === 0)!);
    expect(emit).toHaveBeenCalledOnceWith(0);
  });

  it('does not cancel touch when implicit button capture is transferred to the scene', () => {
    const scene = mount(); const capture = spyOn(scene, 'setPointerCapture');
    spyOn(scene, 'hasPointerCapture').and.returnValue(true);
    spyOn(scene, 'releasePointerCapture');
    component.onPointerDown(pointer('pointerdown', 200, 200));
    component.onPointerMove(pointer('pointermove', 220, 200));
    component.onPointerCancel(pointer('lostpointercapture', 220, 200));
    component.onPointerMove(pointer('pointermove', 400, 200));
    tick(16);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(component.position()).toBe(-1);
    component.onPointerUp(pointer('pointerup', 400, 200));
  });

  it('moves through the seam with arrows and emits once from a focused card', () => {
    const scene = mount();
    scene.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true}));
    expect(component.activePhotoNumber()).toBe(34);
    const active = fixture.nativeElement.querySelector('[aria-current="true"]') as HTMLButtonElement;
    const emit = spyOn(component.photoRequested, 'emit');
    // Native buttons synthesize click for Enter. The bubbling key must not also emit.
    active.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
    active.click();
    expect(emit).toHaveBeenCalledOnceWith(33);
  });

  it('preserves the DOM list during sub-card motion and cleans up all scheduled frames', () => {
    mount(); tick(16);
    const cards = [...fixture.nativeElement.querySelectorAll('.photo-card')];
    const semantic = spyOn(component.position, 'set').and.callThrough();
    for (let i = 0; i < 60; i++) tick(16);
    expect([...fixture.nativeElement.querySelectorAll('.photo-card')]).toEqual(cards);
    expect(semantic).not.toHaveBeenCalled();
    fixture.destroy();
    expect(frames.size).toBe(0);
  });

  it('pauses for page visibility and resumes without accumulated time', () => {
    const hidden = spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    mount(); tick(16); tick(16);
    const motion = component as unknown as {motionPosition: number};
    hidden.and.returnValue(true); document.dispatchEvent(new Event('visibilitychange'));
    tick(16); const paused = motion.motionPosition;
    tick(10000);
    expect(frames.size).toBe(0);
    expect(motion.motionPosition).toBe(paused);
    hidden.and.returnValue(false); document.dispatchEvent(new Event('visibilitychange'));
    tick(16); // First frame only establishes the clock.
    expect(motion.motionPosition).toBe(paused);
    tick(16);
    expect(motion.motionPosition-paused).toBeLessThan(.01);
  });

  it('does not jump hover progress to the target on the first frame', () => {
    const scene = mount();
    const motion = component as unknown as {supportsFinePointer: boolean};
    motion.supportsFinePointer = true;
    component.suspended = true; component.suspended = false;
    const face = scene.querySelector<HTMLButtonElement>('[aria-current="true"]')!;
    face.dispatchEvent(new PointerEvent('pointermove', {bubbles:true, pointerType:'mouse',clientX:100,clientY:100}));
    tick(0);
    expect(Number(face.style.getPropertyValue('--hover-progress'))).toBe(0);
    tick(16);
    expect(Number(face.style.getPropertyValue('--hover-progress'))).toBeLessThan(.1);
  });

  it('holds stationary hover without a hit overlay, then hands off on actual pointer movement', () => {
    const scene = mount();
    const motion = component as unknown as {supportsFinePointer:boolean; hoveredLogicalIndex:number|null};
    motion.supportsFinePointer = true;
    expect(scene.querySelector('.photo-card__hit')).toBeNull();
    const first = scene.querySelector<HTMLButtonElement>('[data-logical-index="-3"] button')!;
    const next = scene.querySelector<HTMLButtonElement>('[data-logical-index="-2"] button')!;
    first.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',clientX:200,clientY:500}));
    // Browser retargeting caused by animation, not a user moving away.
    first.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,pointerType:'mouse',clientX:200,clientY:500,relatedTarget:document.body}));
    tick(100);
    expect(motion.hoveredLogicalIndex).toBe(-3);
    next.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',clientX:230,clientY:760}));
    tick(81);
    expect(motion.hoveredLogicalIndex).toBe(-2);
    next.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,pointerType:'mouse',clientX:1,clientY:1,relatedTarget:document.body}));
    tick(100);
    expect(motion.hoveredLogicalIndex).toBeNull();
  });

  it('does not activate intermediate photos while the mouse crosses them quickly', () => {
    const scene = mount();
    const motion = component as unknown as {supportsFinePointer:boolean; hoveredLogicalIndex:number|null};
    motion.supportsFinePointer = true;
    // Remain within the regular-width Karma fixture's interactive window.
    for (const index of [1,0,-1,-2]) {
      scene.querySelector(`[data-logical-index="${index}"] button`)!.dispatchEvent(
        new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',clientX:500+index*60,clientY:600}));
      tick(20);
      expect(motion.hoveredLogicalIndex).toBeNull();
    }
    tick(65);
    expect(motion.hoveredLogicalIndex).toBe(-2);
    component.suspended = true;
    tick(100);
    expect(motion.hoveredLogicalIndex).toBeNull();
    expect(frames.size).toBe(0);
  });

  it('normalizes large logical positions without replacing the photo DOM', () => {
    mount();
    const motion = component as unknown as {motionPosition:number; setMotionPosition(value:number):void};
    motion.setMotionPosition(.1);
    const cards = [...fixture.nativeElement.querySelectorAll('.photo-card')];
    motion.setMotionPosition(3400.1);
    expect(motion.motionPosition).toBeCloseTo(.1,8);
    expect([...fixture.nativeElement.querySelectorAll('.photo-card')]).toEqual(cards);
    expect(component.activePhotoNumber()).toBe(1);
  });
});
