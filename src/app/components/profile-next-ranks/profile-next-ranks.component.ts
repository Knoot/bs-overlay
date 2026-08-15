import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-profile-next-ranks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-next-ranks.component.html',
  styles: [':host { display: contents; }']
})
export class ProfileNextRanksComponent {
  readonly profile = inject(OverlayStateService).profile;
}
