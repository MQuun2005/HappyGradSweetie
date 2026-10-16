import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CursorStardustComponent } from './cursor-stardust';

describe('CursorStardustComponent', () => {
  let fixture: ComponentFixture<CursorStardustComponent>;
  let shell: HTMLElement;
  let pointer: MediaQueryList;
  let motion: MediaQueryList;
  let animate: jasmine.Spy;
  let cancel: jasmine.Spy;
  let hidden: jasmine.Spy;
  let now: number;
  const query = (matches: boolean) => Object.assign(new EventTarget(), { matches }) as MediaQueryList;
  const change = (media: MediaQueryList, matches: boolean) => {
    Object.assign(media, { matches });
    media.dispatchEvent(new Event('change'));
  };
  const move = (x = 100, type = 'mouse', buttons = 0, target = shell) => {
    now += 60;
    target.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, clientX: x, clientY: 100, pointerType: type, buttons,
    }));
  };

  beforeEach(async () => {
    pointer = query(true);
    motion = query(false);
    spyOn(window, 'matchMedia').and.callFake(q => q.includes('reduced-motion') ? motion : pointer);
    hidden = spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    now = 0;
    spyOn(performance, 'now').and.callFake(() => now);
    cancel = jasmine.createSpy('cancel');
    animate = spyOn(HTMLElement.prototype, 'animate').and.returnValue({ cancel } as unknown as Animation);
    await TestBed.configureTestingModule({ imports: [CursorStardustComponent] }).compileComponents();
    fixture = TestBed.createComponent(CursorStardustComponent);
    shell = document.createElement('div');
    shell.className = 'app-shell';
    document.body.append(shell);
    fixture.detectChanges();
  });
  afterEach(() => shell.remove());

  it('keeps a fixed decorative pool and uses finite animations without replacing the cursor', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('.particle').length).toBe(16);
    expect(root.querySelector('button, a, [tabindex]')).toBeNull();
    for (let i = 0; i < 40; i++) move(100 + i * 12);
    expect(animate).toHaveBeenCalledTimes(40);
    expect(cancel).toHaveBeenCalledTimes(24);
    expect(root.querySelectorAll('.particle').length).toBe(16);
    expect(animate.calls.mostRecent().args[1]).toEqual({ duration: 850, easing: 'ease-out' });
  });

  it('limits emission frequency and distance, and stops on scroll', () => {
    move(100);
    move(101);
    expect(animate).toHaveBeenCalledTimes(1);
    now -= 110;
    move(130);
    expect(animate).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('scroll'));
    expect(cancel).toHaveBeenCalled();
  });

  it('does not emit on touch, drag, photo faces, or outside page content', () => {
    move(100, 'touch');
    move(120, 'mouse', 1);
    const photo = document.createElement('button');
    photo.className = 'photo-card';
    shell.append(photo);
    move(140, 'mouse', 0, photo);
    move(160, 'mouse', 0, document.body);
    expect(animate).not.toHaveBeenCalled();
    move(180);
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it('disables immediately for overlays, coarse input, reduced motion and hidden tabs', () => {
    move();
    fixture.componentRef.setInput('enabled', false);
    fixture.detectChanges();
    move(120);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalled();
    fixture.componentRef.setInput('enabled', true);
    fixture.detectChanges();
    change(pointer, false);
    move(140);
    change(pointer, true);
    change(motion, true);
    move(160);
    change(motion, false);
    hidden.and.returnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    move(180);
    expect(animate).toHaveBeenCalledTimes(1);
    hidden.and.returnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    move(200);
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it('cancels active particles and detaches event handlers on destroy', () => {
    move();
    const documentRemove = spyOn(document, 'removeEventListener').and.callThrough();
    const pointerRemove = spyOn(pointer, 'removeEventListener').and.callThrough();
    fixture.destroy();
    move(120);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalled();
    expect(documentRemove).toHaveBeenCalledWith('pointermove', jasmine.any(Function));
    expect(documentRemove).toHaveBeenCalledWith('visibilitychange', jasmine.any(Function));
    expect(pointerRemove).toHaveBeenCalledWith('change', jasmine.any(Function));
  });
});
