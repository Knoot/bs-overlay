import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-modal.component.html',
  styles: [':host { display: contents; }']
})
export class SettingsModalComponent {
  @Input({ required: true }) activeSettingsTab!: 'general' | 'beatleader' | 'song';

  @Output() readonly save = new EventEmitter<void>();
  @Output() readonly settingsTabChange = new EventEmitter<'general' | 'beatleader' | 'song'>();

  setSettingsTab(tab: 'general' | 'beatleader' | 'song'): void {
    this.settingsTabChange.emit(tab);
  }

  saveSettings(): void {
    this.save.emit();
  }
}
