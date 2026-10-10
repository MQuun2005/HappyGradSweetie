import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TextSectionContent } from '../../models/celebration.models';

@Component({
  selector: 'app-graduation-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graduation-message.html',
  styleUrl: './graduation-message.css',
})
export class GraduationMessageComponent {
  @Input({ required: true }) content!: TextSectionContent;
}
