import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-profile-global-rank',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-global-rank.component.html',
  styles: [':host { display: contents; }']
})
export class ProfileGlobalRankComponent {
  readonly profile = inject(OverlayStateService).profile;
}
