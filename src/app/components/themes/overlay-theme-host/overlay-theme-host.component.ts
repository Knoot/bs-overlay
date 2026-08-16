import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../../services/overlay-state.service';
import { CyberpunkOverlayLayoutComponent } from '../cyberpunk/cyberpunk-overlay-layout.component';
import { MinimalOverlayLayoutComponent } from '../minimal/minimal-overlay-layout.component';
import { SunsetOverlayLayoutComponent } from '../sunset/sunset-overlay-layout.component';

@Component({
  selector: 'app-overlay-theme-host',
  standalone: true,
  imports: [CommonModule, CyberpunkOverlayLayoutComponent, SunsetOverlayLayoutComponent, MinimalOverlayLayoutComponent],
  templateUrl: './overlay-theme-host.component.html',
  styles: [':host { display: contents; }']
})
export class OverlayThemeHostComponent {
  readonly ui = inject(OverlayStateService).ui;
}
