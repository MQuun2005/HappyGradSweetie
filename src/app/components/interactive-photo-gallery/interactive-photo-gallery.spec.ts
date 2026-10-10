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
});
