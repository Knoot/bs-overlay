import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-profile-name',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-name.component.html',
  styles: [':host { display: contents; }']
})
export class ProfileNameComponent {
  readonly profile = inject(OverlayStateService).profile;
}
