import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-profile-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-avatar.component.html',
  styles: [':host { display: contents; }']
})
export class ProfileAvatarComponent {
  private readonly state = inject(OverlayStateService);
  readonly profile = this.state.profile;
  readonly ui = this.state.ui;
}
