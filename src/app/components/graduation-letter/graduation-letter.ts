import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { LetterContent } from '../../models/celebration.models';

@Component({
  selector: 'app-graduation-letter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graduation-letter.html',
  styleUrl: './graduation-letter.css',
})
export class GraduationLetterComponent {
  @Input({ required: true }) content!: LetterContent;
}
