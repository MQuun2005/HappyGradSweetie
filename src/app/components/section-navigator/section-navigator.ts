import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface NavSectionItem {
  readonly id: string;
  readonly label: string;
  readonly number: string;
}

@Component({
  selector: 'app-section-navigator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-navigator.html',
  styleUrl: './section-navigator.css',
})
export class SectionNavigatorComponent {
  @Input() activeSectionId = 'home';
  @Output() readonly sectionSelected = new EventEmitter<string>();

  readonly sections: readonly NavSectionItem[] = [
    { id: 'home', label: 'Lời chúc đầu tiên', number: '01' },
    { id: 'invitation', label: 'Ngày của vợ iu', number: '02' },
    { id: 'message', label: 'Anh có điều muốn nói', number: '03' },
    { id: 'memories', label: '34 chiếc ảnh xinh', number: '04' },
    { id: 'letter', label: 'Thư gửi vợ iu', number: '05' },
    { id: 'closing', label: 'Lời cuối anh gửi', number: '06' },
  ];

  select(id: string): void {
    this.sectionSelected.emit(id);
  }
}
