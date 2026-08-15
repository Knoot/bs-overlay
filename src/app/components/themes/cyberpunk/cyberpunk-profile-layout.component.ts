import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ProfileAvatarComponent } from '../../profile-avatar/profile-avatar.component';
import { ProfileNameComponent } from '../../profile-name/profile-name.component';
import { ProfileNextRanksComponent } from '../../profile-next-ranks/profile-next-ranks.component';
import { ProfileRanksComponent } from '../../profile-ranks/profile-ranks.component';
import { OverlayStateService } from '../../../services/overlay-state.service';

@Component({
  selector: 'app-cyberpunk-profile-layout',
  standalone: true,
  imports: [CommonModule, ProfileAvatarComponent, ProfileNameComponent, ProfileRanksComponent, ProfileNextRanksComponent],
  templateUrl: './cyberpunk-profile-layout.component.html',
  styles: [':host { display: contents; }']
})
export class CyberpunkProfileLayoutComponent {
  private readonly state = inject(OverlayStateService);
  readonly profile = this.state.profile;
  readonly ui = this.state.ui;
}
