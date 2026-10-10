import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionNavigatorComponent } from './section-navigator';

describe('SectionNavigatorComponent', () => {
  let fixture: ComponentFixture<SectionNavigatorComponent>;
  let component: SectionNavigatorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionNavigatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionNavigatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders all 6 section dots with accessible labels', () => {
    const dots = fixture.nativeElement.querySelectorAll('.section-nav__dot');
    expect(dots.length).toBe(6);
  });

  it('highlights the active section dot', () => {
    fixture.componentRef.setInput('activeSectionId', 'memories');
    fixture.detectChanges();

    const activeDot = fixture.nativeElement.querySelector('.section-nav__dot--active');
    expect(activeDot).not.toBeNull();
    expect(activeDot?.getAttribute('aria-label')).toContain('Kỷ niệm 3D');
  });

  it('emits sectionSelected when clicked', () => {
    const selected: string[] = [];
    component.sectionSelected.subscribe((id) => selected.push(id));

    const dots = fixture.nativeElement.querySelectorAll('.section-nav__dot');
    (dots[1] as HTMLButtonElement).click();

    expect(selected).toEqual(['invitation']);
  });
});
