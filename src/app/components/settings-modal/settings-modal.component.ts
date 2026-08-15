import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_CONFIG, DEFAULT_PROXY_CONFIG } from '../../constants/overlay.constants';
import { OverlayConfig } from '../../models/overlay.models';
import { OverlayConfigService } from '../../services/overlay-config.service';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.component.html',
  styles: [':host { display: contents; }']
})
export class SettingsModalComponent implements OnChanges {
  private readonly configService = inject(OverlayConfigService);

  @Input({ required: true }) config!: OverlayConfig;
  @Input({ required: true }) visible!: boolean;

  form: OverlayConfig = { ...DEFAULT_CONFIG };
  activeSettingsTab: 'general' | 'beatleader' | 'song' = 'general';
  activeRankServiceTab: 'bl' | 'ss' = 'bl';

  @Output() readonly save = new EventEmitter<OverlayConfig>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.form = { ...this.config };
    }
  }

  t(key: string): string {
    return this.configService.getText(this.form.lang, key);
  }

  setSettingsTab(tab: 'general' | 'beatleader' | 'song'): void {
    this.activeSettingsTab = tab;
  }

  setRankServiceTab(tab: 'bl' | 'ss'): void {
    this.activeRankServiceTab = tab;
  }

  saveSettings(): void {
    this.save.emit({ ...this.form });
  }

  restoreProxySettings(): void {
    this.form = {
      ...this.form,
      customProxy: DEFAULT_PROXY_CONFIG
    };
  }
}
