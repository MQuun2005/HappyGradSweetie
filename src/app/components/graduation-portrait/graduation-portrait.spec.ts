import { ComponentFixture, TestBed } from '@angular/core/testing';
import { celebrationContent } from '../../data/celebration-content';
import { GraduationPortraitComponent } from './graduation-portrait';

describe('GraduationPortraitComponent', () => {
  let fixture: ComponentFixture<GraduationPortraitComponent>;
  const root = () => fixture.nativeElement as HTMLElement;
  const fail = () => {
    root().querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraduationPortraitComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GraduationPortraitComponent);
    fixture.componentRef.setInput('content', celebrationContent.hero);
    fixture.detectChanges();
  });

  it('reserves dimensions and exposes one real accessible image with responsive WebP sources', () => {
    const img = root().querySelector('img')!;
    expect(root().querySelectorAll('img').length).toBe(1);
    expect(img.alt).toBe(celebrationContent.hero.portraitAlt);
    expect(img.getAttribute('width')).toBe('1024');
    expect(img.getAttribute('height')).toBe('1536');
    expect(img.getAttribute('src')).toBe('Image/hero/mai-khue-cutout.png');
    expect(root().querySelector('source')!.srcset).toContain('480w');
    expect(img.fetchPriority).toBe('high');
  });

  it('falls back WebP → approved PNG → original → readable error without retrying forever', () => {
    const changed = spyOn(fixture.componentInstance.fallbackChanged, 'emit');
    fail();
    expect(root().querySelector('source')).toBeNull();
    expect(root().querySelector('img')!.getAttribute('src')).toBe('Image/hero/mai-khue-cutout.png');
    fail();
    expect(root().querySelector('img')!.getAttribute('src')).toBe('Image/original/1.jpg');
    expect(root().classList.contains('portrait--editorial')).toBeTrue();
    expect(changed).toHaveBeenCalledWith(true);
    fail();
    expect(root().querySelector('img')).toBeNull();
    expect(root().querySelector('[role="status"]')!.textContent).toContain('Lời chúc vẫn ở đây');
  });

  it('resets the fallback only when content is replaced, not on ordinary change detection', () => {
    fail();
    fixture.detectChanges();
    expect(fixture.componentInstance.fallbackStep()).toBe(1);
    fixture.componentRef.setInput('content', { ...celebrationContent.hero });
    fixture.detectChanges();
    expect(fixture.componentInstance.fallbackStep()).toBe(0);
  });
});
