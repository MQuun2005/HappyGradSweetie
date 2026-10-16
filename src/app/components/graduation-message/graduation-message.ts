import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TextSectionContent } from '../../models/celebration.models';
import { DecorativeStarsComponent } from '../decorative-stars/decorative-stars';

@Component({
  selector: 'app-graduation-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecorativeStarsComponent],
  templateUrl: './graduation-message.html',
  styleUrl: './graduation-message.css',
})
export class GraduationMessageComponent {
  @Input({ required: true }) content!: TextSectionContent;
}
