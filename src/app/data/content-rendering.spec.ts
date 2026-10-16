import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClosingSectionComponent } from '../components/closing-section/closing-section';
import { GiftIntroComponent } from '../components/gift-intro/gift-intro';
import { GraduationInvitationComponent } from '../components/graduation-invitation/graduation-invitation';
import { GraduationLetterComponent } from '../components/graduation-letter/graduation-letter';
import { GraduationMessageComponent } from '../components/graduation-message/graduation-message';
import { celebrationContent } from './celebration-content';

describe('Phase 6 content rendering', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClosingSectionComponent,
        GiftIntroComponent,
        GraduationInvitationComponent,
        GraduationLetterComponent,
        GraduationMessageComponent,
      ],
    }).compileComponents();
  });

  it('renders Intro copy and emits opening synchronously, without a duplicate heart', () => {
    const fixture = TestBed.createComponent(GiftIntroComponent);
    fixture.componentRef.setInput('content', celebrationContent.intro);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    let opened = false;
    fixture.componentInstance.opened.subscribe(() => (opened = true));
    expect(button.textContent?.trim()).toBe(celebrationContent.intro.actionLabel);
    button.click();
    expect(opened).toBeTrue();
  });

  it('renders exact recipient, degree, school and semantic date', () => {
    const fixture = TestBed.createComponent(GraduationInvitationComponent);
    fixture.componentRef.setInput('content', celebrationContent.invitation);
    fixture.detectChanges();
    const time = fixture.nativeElement.querySelector('time') as HTMLTimeElement;
    expect(time.dateTime).toBe('2026-10-17');
    expect(time.textContent).toBe(celebrationContent.invitation.dateLabel);
    for (const key of ['recipient', 'degree', 'school'] as const) {
      expect(fixture.nativeElement.textContent).toContain(celebrationContent.invitation[key]);
    }
  });

  it('renders the complete Message without truncating the approved copy', () => {
    const fixture = TestBed.createComponent(GraduationMessageComponent);
    fixture.componentRef.setInput('content', celebrationContent.message);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.message__body').textContent).toBe(
      celebrationContent.message.body,
    );
  });

  it('renders all four complete letter paragraphs and preserves the signature newline', () => {
    const fixture = TestBed.createComponent(GraduationLetterComponent);
    fixture.componentRef.setInput('content', celebrationContent.letter);
    fixture.detectChanges();
    const paragraphs: NodeListOf<HTMLParagraphElement> = fixture.nativeElement.querySelectorAll(
      '.letter > p:not(.letter__eyebrow)',
    );
    expect(Array.from(paragraphs, (p) => p.textContent)).toEqual([
      ...celebrationContent.letter.paragraphs,
    ]);
    const footer = fixture.nativeElement.querySelector('footer') as HTMLElement;
    expect(footer.textContent).toBe('Thương vợ iu rất nhiều,\nQuân iu');
    expect(getComputedStyle(footer).whiteSpace).toBe('pre-line');
  });

  it('shows the closing highlight and retains Gallery/replay actions', () => {
    const fixture: ComponentFixture<ClosingSectionComponent> =
      TestBed.createComponent(ClosingSectionComponent);
    fixture.componentRef.setInput('content', celebrationContent.closing);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.closing__highlight').textContent).toBe(
      celebrationContent.closing.finalHighlight,
    );
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('#memories');
    const replay = spyOn(fixture.componentInstance.replayRequested, 'emit');
    fixture.nativeElement.querySelector('button').click();
    expect(replay).toHaveBeenCalledTimes(1);
  });

  it('reveals even a very tall letter on entry and disconnects its observer', () => {
    let onIntersection!: IntersectionObserverCallback;
    const disconnect = jasmine.createSpy('disconnect');
    const observer = spyOn(window, 'IntersectionObserver').and.callFake(function (callback) {
      onIntersection = callback;
      return {
        observe: () => {},
        unobserve: () => {},
        disconnect,
        takeRecords: () => [],
        root: null,
        rootMargin: '0px',
        thresholds: [0],
      };
    });
    const fixture = TestBed.createComponent(GraduationLetterComponent);
    fixture.componentRef.setInput('content', celebrationContent.letter);
    fixture.detectChanges();
    expect(observer.calls.mostRecent().args[1]?.threshold).toBe(0);
    onIntersection(
      [{ isIntersecting: true, intersectionRatio: 0.03 } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.letter--entered')).not.toBeNull();
    expect(disconnect).toHaveBeenCalledTimes(1);
    fixture.destroy();
    expect(disconnect).toHaveBeenCalledTimes(2);
  });
});
