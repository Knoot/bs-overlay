import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AnimatedNumberDirective } from '../../directives/animated-number.directive';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-profile-pp',
  standalone: true,
  imports: [CommonModule, AnimatedNumberDirective],
  templateUrl: './profile-pp.component.html',
  styles: [':host { display: contents; }']
})
export class ProfilePpComponent {
  readonly profile = inject(OverlayStateService).profile;
}
