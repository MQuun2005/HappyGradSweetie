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

  it('ignores modifier keys without consuming the one eligible autoplay retry', async () => {
    fixture.detectChanges();
    const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    const play = spyOn(audio, 'play').and.rejectWith(new DOMException('Blocked', 'NotAllowedError'));
    fixture.componentRef.setInput('autoplayEnabled', true);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    expect(play).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }));
    expect(play).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await Promise.resolve();
    expect(play).toHaveBeenCalledTimes(2);
    document.dispatchEvent(new PointerEvent('pointerdown'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('does not schedule a fade after a pending play resolves after destroy', async () => {
    fixture.detectChanges();
    const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    let resolve!: () => void;
    spyOn(audio, 'play').and.returnValue(new Promise<void>(done => resolve = done));
    const raf = spyOn(window, 'requestAnimationFrame').and.returnValue(1);
    fixture.componentInstance.playFromUserGesture();
    fixture.destroy();
    resolve();
    await Promise.resolve();
    expect(raf).not.toHaveBeenCalled();
  });
});
