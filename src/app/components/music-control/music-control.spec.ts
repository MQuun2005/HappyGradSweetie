import { ComponentFixture, TestBed } from '@angular/core/testing';

import { celebrationContent } from '../../data/celebration-content';
import { MusicControlComponent } from './music-control';

describe('MusicControlComponent', () => {
  let fixture: ComponentFixture<MusicControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusicControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MusicControlComponent);
    fixture.componentRef.setInput('config', {
      ...celebrationContent.music,
      src: 'data:audio/mpeg;base64,SUQz',
    });
    fixture.componentRef.setInput('autoplayEnabled', false);
  });

  it('renders one preloadable looping audio element without a music button', () => {
    fixture.detectChanges();

    const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    expect(audio).not.toBeNull();
    expect(audio.loop).toBeTrue();
    expect(audio.getAttribute('preload')).toBe('auto');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('clamps the fade when the first RAF timestamp precedes playback scheduling', async () => {
    fixture.detectChanges();
    const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    spyOn(audio, 'play').and.resolveTo();
    spyOnProperty(audio, 'paused', 'get').and.returnValue(true);
    spyOn(performance, 'now').and.returnValue(1000);
    let frame!: FrameRequestCallback;
    spyOn(window, 'requestAnimationFrame').and.callFake(callback => { frame = callback; return 1; });
    fixture.componentInstance.playFromUserGesture();
    await Promise.resolve();
    expect(() => frame(997)).not.toThrow();
    expect(audio.volume).toBe(0);
    frame(1600);
    expect(audio.volume).toBeCloseTo(0.35);
  });

});
