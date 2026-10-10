import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ClosingContent } from '../../models/celebration.models';

@Component({
  selector: 'app-closing-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './closing-section.html',
  styleUrl: './closing-section.css',
})
export class ClosingSectionComponent {
  @Input({ required: true }) content!: ClosingContent;
}
