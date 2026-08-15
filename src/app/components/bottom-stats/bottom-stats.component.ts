import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AccStatComponent } from '../acc-stat/acc-stat.component';
import { ComboStatComponent } from '../combo-stat/combo-stat.component';
import { MissStatComponent } from '../miss-stat/miss-stat.component';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-bottom-stats',
  standalone: true,
  imports: [CommonModule, MissStatComponent, ComboStatComponent, AccStatComponent],
  templateUrl: './bottom-stats.component.html',
  styles: [':host { display: contents; }']
})
export class BottomStatsComponent {
  readonly ui = inject(OverlayStateService).ui;
}
