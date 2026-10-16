import { ComponentFixture, TestBed } from '@angular/core/testing';
import { celebrationContent } from '../../data/celebration-content';
import { GraduationHeroComponent } from './graduation-hero';

describe('GraduationHeroComponent', () => {
  let fixture: ComponentFixture<GraduationHeroComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraduationHeroComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GraduationHeroComponent);
    fixture.componentRef.setInput('content', celebrationContent.hero);
    fixture.detectChanges();
  });

  it('renders approved copy, a single h1 and decorative text outside the accessibility tree', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('h1').length).toBe(1);
    expect(root.querySelector('h1')!.textContent).toBe(celebrationContent.hero.title);
    expect(root.querySelector('.hero__subheading')!.textContent).toContain('Nguyễn Võ Mai Khuê');
    expect(root.querySelector('.hero__name')!.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.hero__portrait-scroll .hero__portrait-entrance')).not.toBeNull();
  });

  it('groups graduation phrases without rewriting the personal dedication', () => {
    const title = 'Chúc mừng tốt nghiệp nhan cục dàng!';
    fixture.componentRef.setInput('content', { ...celebrationContent.hero, title });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const lines = [...root.querySelectorAll('.hero__title-line')];
    expect(lines.map((line) => line.textContent?.trim())).toEqual([
      'Chúc mừng', 'tốt nghiệp', 'nhan cục dàng!',
    ]);
    expect(root.querySelector('h1')!.textContent).toBe(title);
    expect(root.querySelector('.hero__title-dedication')!.textContent?.trim()).toBe('nhan cục dàng!');
  });

  it('preserves punctuation and uses natural wrapping for other titles', () => {
    for (const title of ['Chúc mừng tốt nghiệp, vợ iu!', 'Một ngày dành cho Mai Khuê']) {
      fixture.componentRef.setInput('content', { ...celebrationContent.hero, title });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1').textContent).toBe(title);
    }
    expect(fixture.nativeElement.querySelectorAll('.hero__title-line').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.hero__title-dedication')).toBeNull();
  });

  it('routes a normal CTA click through App, but preserves modified anchor clicks', () => {
    const emit = spyOn(fixture.componentInstance.sectionRequested, 'emit');
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    const click = new MouseEvent('click', { button: 0, cancelable: true });
    anchor.dispatchEvent(click);
    expect(click.defaultPrevented).toBeTrue();
    expect(emit).toHaveBeenCalledOnceWith('invitation');
    const modified = new MouseEvent('click', { button: 0, ctrlKey: true, cancelable: true });
    // Invoke the Angular handler directly so the test does not open a browser tab.
    fixture.debugElement.query((el) => el.name === 'a').triggerEventHandler('click', modified);
    expect(modified.defaultPrevented).toBeFalse();
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
