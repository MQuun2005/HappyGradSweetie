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
});
