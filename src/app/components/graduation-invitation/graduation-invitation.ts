import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { InvitationContent } from '../../models/celebration.models';
import { DecorativeStarsComponent } from '../decorative-stars/decorative-stars';

@Component({
  selector: 'app-graduation-invitation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecorativeStarsComponent],
  templateUrl: './graduation-invitation.html',
  styleUrl: './graduation-invitation.css',
})
export class GraduationInvitationComponent {
  @Input({ required: true }) content!: InvitationContent;
}
