import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { IntroContent } from '../../models/celebration.models';

@Component({
  selector: 'app-gift-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gift-intro.html',
  styleUrl: './gift-intro.css',
})
export class GiftIntroComponent {
  @Input({ required: true }) content!: IntroContent;
  @Output() readonly opened = new EventEmitter<void>();
}
