import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { OverlayFacadeService } from './services/overlay-facade.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './overlay-theme.css', './overlay-base.css', './overlay-settings.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private readonly overlayFacade = inject(OverlayFacadeService);
  activeSettingsTab: 'general' | 'beatleader' | 'song' = 'general';

  ngAfterViewInit(): void {
    this.overlayFacade.init();
  }

  ngOnDestroy(): void {
    this.overlayFacade.destroy();
  }

  saveSettings(): void {
    this.overlayFacade.saveSettings();
  }

  setSettingsTab(tab: 'general' | 'beatleader' | 'song'): void {
    this.activeSettingsTab = tab;
  }
}
