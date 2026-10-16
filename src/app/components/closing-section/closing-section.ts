import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { ClosingContent } from '../../models/celebration.models';
import { DecorativeStarsComponent } from '../decorative-stars/decorative-stars';

@Component({
  selector: 'app-closing-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecorativeStarsComponent],
  templateUrl: './closing-section.html',
  styleUrl: './closing-section.css',
})
export class ClosingSectionComponent {
  @Input({ required: true }) content!: ClosingContent;
  @Output() readonly replayRequested = new EventEmitter<void>();
}
