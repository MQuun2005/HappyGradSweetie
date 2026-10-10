import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { HeroContent } from '../../models/celebration.models';

@Component({
  selector: 'app-graduation-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graduation-hero.html',
  styleUrl: './graduation-hero.css',
})
export class GraduationHeroComponent {
  @Input({ required: true }) content!: HeroContent;
}
