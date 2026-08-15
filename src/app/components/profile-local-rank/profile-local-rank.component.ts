import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-profile-local-rank',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-local-rank.component.html',
  styles: [':host { display: contents; }']
})
export class ProfileLocalRankComponent {
  readonly profile = inject(OverlayStateService).profile;
}
