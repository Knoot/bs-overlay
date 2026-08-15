import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AnimatedNumberDirective } from '../../directives/animated-number.directive';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-acc-stat',
  standalone: true,
  imports: [CommonModule, AnimatedNumberDirective],
  templateUrl: './acc-stat.component.html',
  styles: [':host { display: contents; }']
})
export class AccStatComponent {
  private readonly state = inject(OverlayStateService);
  readonly score = this.state.score;
  readonly ui = this.state.ui;
}
