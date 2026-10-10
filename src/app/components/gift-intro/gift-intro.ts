import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { IntroContent } from '../../models/celebration.models';

@Component({
  selector: 'app-gift-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gift-intro.html',
  styleUrl: './gift-intro.css',
})
export class GiftIntroComponent implements AfterViewInit {
  @ViewChild('openButton') private openButton?: ElementRef<HTMLButtonElement>;
  @Input({ required: true }) content!: IntroContent;
  @Output() readonly opened = new EventEmitter<void>();

  ngAfterViewInit(): void {
    queueMicrotask(() => this.openButton?.nativeElement.focus());
  }
}
