import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
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
export class MusicControlComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('audio') private audioRef?: ElementRef<HTMLAudioElement>;

  @Input({ required: true }) config!: MusicConfig;
  @Input() autoplayEnabled = false;

  readonly isPlaying = signal(false);
  readonly isUnavailable = signal(false);
  readonly isAutoplayBlocked = signal(false);

  private hasViewInitialized = false;
  private hasTriedAutoplay = false;
  private hasTriedGesture = false;
  private fadeFrame?: number;
  private removeGestureRetry?: () => void;
  private destroyed = false;
  private playbackGeneration = 0;

  ngAfterViewInit(): void {
    this.hasViewInitialized = true;
    if (this.autoplayEnabled) {
      queueMicrotask(() => this.tryAutoplayOnce());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.playbackGeneration++;
      this.cancelFade();
      this.removeGestureRetry?.();
      this.removeGestureRetry = undefined;
      this.isPlaying.set(false);
      this.isUnavailable.set(false);
      this.isAutoplayBlocked.set(false);
      this.hasTriedAutoplay = false;
      this.hasTriedGesture = false;
    }

    if (changes['autoplayEnabled'] && this.hasViewInitialized && this.autoplayEnabled) {
      queueMicrotask(() => this.tryAutoplayOnce());
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.playbackGeneration++;
    this.cancelFade();
    this.removeGestureRetry?.();
    this.audioRef?.nativeElement.pause();
  }

  playFromUserGesture(): void {
    if (this.destroyed || this.hasTriedGesture || this.isUnavailable()) {
      return;
    }

    this.hasTriedGesture = true;
    this.removeGestureRetry?.();
    this.removeGestureRetry = undefined;
    void this.play(false);
  }

  markUnavailable(): void {
    this.cancelFade();
    this.isUnavailable.set(true);
    this.isPlaying.set(false);
    this.removeGestureRetry?.();
    this.removeGestureRetry = undefined;
  }

  private tryAutoplayOnce(): void {
    if (this.hasTriedAutoplay || this.isUnavailable() || !this.config.src) {
      return;
    }

    this.hasTriedAutoplay = true;
    void this.play(true);
  }

  private async play(isAutoplayAttempt: boolean): Promise<void> {
    const audio = this.audioRef?.nativeElement;
    if (this.destroyed || !audio || !this.config.src || this.isUnavailable()) {
      return;
    }

    if (!audio.paused) {
      this.isPlaying.set(true);
      return;
    }

    this.cancelFade();
    audio.loop = this.config.loop;
    audio.volume = 0;

    const generation = this.playbackGeneration;
    try {
      await audio.play();
      if (this.destroyed || generation !== this.playbackGeneration) return;
      this.isAutoplayBlocked.set(false);
      this.fadeToConfiguredVolume(audio);
    } catch {
      if (this.destroyed || generation !== this.playbackGeneration) return;
      this.isPlaying.set(false);
      this.isAutoplayBlocked.set(true);
      if (isAutoplayAttempt) {
        this.listenForOneEligibleGesture();
      }
    }
  }

  private listenForOneEligibleGesture(): void {
    if (this.removeGestureRetry || typeof document === 'undefined') {
      return;
    }

    const retry = (event: Event) => {
      if (
        event instanceof KeyboardEvent &&
        (event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.repeat ||
          event.isComposing ||
          ['Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(event.key))
      ) {
        return;
      }

      this.removeGestureRetry?.();
      this.removeGestureRetry = undefined;
      this.playFromUserGesture();
    };

    // Remove both listeners only after an eligible gesture. A once-listener also
    // consumes a rejected modifier key and silently loses the keyboard retry.
    document.addEventListener('pointerdown', retry, { capture: true });
    document.addEventListener('keydown', retry, { capture: true });
    this.removeGestureRetry = () => {
      document.removeEventListener('pointerdown', retry, true);
      document.removeEventListener('keydown', retry, true);
    };
  }

  private fadeToConfiguredVolume(audio: HTMLAudioElement): void {
    const target = Math.min(1, Math.max(0, this.config.volume));
    const start = performance.now();
    const duration = 600;

    const step = (now: number) => {
      // RAF's frame timestamp can slightly precede performance.now() at scheduling.
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      audio.volume = target * progress;
      if (progress < 1 && !audio.paused) {
        this.fadeFrame = requestAnimationFrame(step);
      } else {
        this.fadeFrame = undefined;
      }
    };

    this.fadeFrame = requestAnimationFrame(step);
  }

  private cancelFade(): void {
    if (this.fadeFrame !== undefined) {
      cancelAnimationFrame(this.fadeFrame);
      this.fadeFrame = undefined;
    }
  }
}
