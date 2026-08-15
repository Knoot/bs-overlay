import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AnimatedNumberDirective } from '../../directives/animated-number.directive';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-combo-stat',
  standalone: true,
  imports: [CommonModule, AnimatedNumberDirective],
  templateUrl: './combo-stat.component.html',
  styles: [':host { display: contents; }']
})
export class ComboStatComponent {
  readonly score = inject(OverlayStateService).score;
}
