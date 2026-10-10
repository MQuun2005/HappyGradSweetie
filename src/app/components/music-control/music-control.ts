import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';

import { MusicConfig } from '../../models/celebration.models';

@Component({
  selector: 'app-music-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './music-control.html',
  styleUrl: './music-control.css',
})
export class MusicControlComponent implements OnChanges {
  @ViewChild('audio') private audioRef?: ElementRef<HTMLAudioElement>;

  @Input({ required: true }) config!: MusicConfig;

  readonly isPlaying = signal(false);
  readonly isUnavailable = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.isPlaying.set(false);
      this.isUnavailable.set(false);
    }
  }

  async toggle(): Promise<void> {
    const audio = this.audioRef?.nativeElement;
    if (!audio || !this.config.src) {
      return;
    }

    if (audio.paused) {
      try {
        audio.volume = Math.min(1, Math.max(0, this.config.volume));
        await audio.play();
        this.isPlaying.set(true);
      } catch {
        this.isUnavailable.set(true);
      }
      return;
    }

    audio.pause();
    this.isPlaying.set(false);
  }

  stop(): void {
    this.isPlaying.set(false);
  }
}
