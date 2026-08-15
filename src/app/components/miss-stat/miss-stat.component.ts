import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AnimatedNumberDirective } from '../../directives/animated-number.directive';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-miss-stat',
  standalone: true,
  imports: [CommonModule, AnimatedNumberDirective],
  templateUrl: './miss-stat.component.html',
  styles: [':host { display: contents; }']
})
export class MissStatComponent {
  readonly score = inject(OverlayStateService).score;
}
