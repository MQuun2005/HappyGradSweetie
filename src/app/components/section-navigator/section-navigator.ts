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
    { id: 'home', label: 'Trang đầu', number: '01' },
    { id: 'invitation', label: 'Thiệp tốt nghiệp', number: '02' },
    { id: 'message', label: 'Lời nhắn nhủ', number: '03' },
    { id: 'memories', label: 'Kỷ niệm 3D', number: '04' },
    { id: 'letter', label: 'Lá thư từ anh', number: '05' },
    { id: 'closing', label: 'Khép lại & Khởi đầu', number: '06' },
  ];

  select(id: string): void {
    this.sectionSelected.emit(id);
  }
}
