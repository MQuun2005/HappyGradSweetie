import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { InvitationContent } from '../../models/celebration.models';

@Component({
  selector: 'app-graduation-invitation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graduation-invitation.html',
  styleUrl: './graduation-invitation.css',
})
export class GraduationInvitationComponent {
  @Input({ required: true }) content!: InvitationContent;
}
