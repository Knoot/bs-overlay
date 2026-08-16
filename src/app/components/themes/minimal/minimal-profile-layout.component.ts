import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ProfileAvatarComponent } from '../../profile-avatar/profile-avatar.component';
import { ProfileNameComponent } from '../../profile-name/profile-name.component';
import { ProfileNextRanksComponent } from '../../profile-next-ranks/profile-next-ranks.component';
import { ProfileRanksComponent } from '../../profile-ranks/profile-ranks.component';
import { OverlayStateService } from '../../../services/overlay-state.service';

@Component({
  selector: 'app-minimal-profile-layout',
  standalone: true,
  imports: [CommonModule, ProfileAvatarComponent, ProfileNameComponent, ProfileRanksComponent, ProfileNextRanksComponent],
  templateUrl: './minimal-profile-layout.component.html',
  styles: [':host { display: contents; }']
})
export class MinimalProfileLayoutComponent {
  private readonly state = inject(OverlayStateService);
  readonly ui = this.state.ui;
  readonly profile = this.state.profile;
}
