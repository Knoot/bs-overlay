import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { SettingsModalComponent } from './components/settings-modal/settings-modal.component';
import { OverlayConfig } from './models/overlay.models';
import { OverlayThemeHostComponent } from './components/themes/overlay-theme-host/overlay-theme-host.component';
import { OverlayFacadeService } from './services/overlay-facade.service';
import { OverlayStateService } from './services/overlay-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, OverlayThemeHostComponent, SettingsModalComponent],
  templateUrl: './app.component.html',
  styleUrls: [
    './app.component.scss',
    './overlay-theme.scss',
    './components/themes/cyberpunk/cyberpunk-theme.scss',
    './components/themes/sunset/sunset-theme.scss',
    './components/themes/minimal/minimal-theme.scss',
    './overlay-base.scss',
    './overlay-settings.scss'
  ],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private readonly overlayFacade = inject(OverlayFacadeService);
  private readonly state = inject(OverlayStateService);
  readonly ui = this.state.ui;
  readonly settings = this.state.settings;

  ngAfterViewInit(): void {
    this.overlayFacade.init();
  }

  ngOnDestroy(): void {
    this.overlayFacade.destroy();
  }

  saveSettings(config: OverlayConfig): void {
    this.overlayFacade.saveSettings(config);
  }
}
