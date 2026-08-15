import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AnimatedNumberDirective } from '../../directives/animated-number.directive';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-pp-predictor',
  standalone: true,
  imports: [CommonModule, AnimatedNumberDirective],
  templateUrl: './pp-predictor.component.html',
  styles: [':host { display: contents; }']
})
export class PpPredictorComponent {
  readonly ppPredictor = inject(OverlayStateService).ppPredictor;
}
