import { ComponentFixture, TestBed } from '@angular/core/testing';

import { celebrationContent } from '../../data/celebration-content';
import { InteractivePhotoGalleryComponent } from './interactive-photo-gallery';

describe('InteractivePhotoGalleryComponent', () => {
  let fixture: ComponentFixture<InteractivePhotoGalleryComponent>;
  let component: InteractivePhotoGalleryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractivePhotoGalleryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InteractivePhotoGalleryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('content', celebrationContent.gallery);
  });

  it('renders the virtual 34-photo gallery without reading an input setter as a getter', () => {
    fixture.componentRef.setInput('photos', celebrationContent.photos);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.photoCount()).toBe(34);
    expect(fixture.nativeElement.querySelectorAll('.photo-card').length).toBe(component.renderedCards().length);
    expect(fixture.nativeElement.querySelectorAll('.photo-card img').length).toBe(component.renderedCards().length);
    expect(component.renderedCards().length).toBeGreaterThan(0);
    expect(component.renderedCards().length).toBeLessThanOrEqual(11);
    expect(fixture.nativeElement.querySelector('.gallery__controls p')?.textContent).toContain('1 / 34');
    expect(fixture.nativeElement.querySelector('.photo-card')?.getAttribute('aria-setsize')).toBe('34');
  });

  it('handles an empty gallery without a runtime exception', () => {
    fixture.componentRef.setInput('photos', []);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.photoCount()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.photo-card').length).toBe(0);
    expect(fixture.nativeElement.querySelector('.gallery__empty')).not.toBeNull();
  });

  it('loops controls and emits the selected photo index', () => {
    fixture.componentRef.setInput('photos', celebrationContent.photos);
    fixture.detectChanges();
    const requested: number[] = [];
    component.photoRequested.subscribe((index) => requested.push(index));

    component.previousPhoto();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.gallery__controls p')?.textContent).toContain('34 / 34');

    const activeCard = fixture.nativeElement.querySelector('[aria-current="true"]') as HTMLButtonElement;
    activeCard.click();
    expect(requested).toEqual([33]);
  });
});
