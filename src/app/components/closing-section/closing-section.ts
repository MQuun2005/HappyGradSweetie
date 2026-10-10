import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { ClosingContent } from '../../models/celebration.models';

@Component({
  selector: 'app-closing-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './closing-section.html',
  styleUrl: './closing-section.css',
})
export class ClosingSectionComponent {
  @Input({ required: true }) content!: ClosingContent;
  @Output() readonly replayRequested = new EventEmitter<void>();

  protected readonly sparkles = Array.from({ length: 12 }, (_, index) => index);
}
