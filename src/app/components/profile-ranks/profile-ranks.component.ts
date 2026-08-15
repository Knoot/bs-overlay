import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ProfileGlobalRankComponent } from '../profile-global-rank/profile-global-rank.component';
import { ProfileLocalRankComponent } from '../profile-local-rank/profile-local-rank.component';
import { ProfilePpComponent } from '../profile-pp/profile-pp.component';

@Component({
  selector: 'app-profile-ranks',
  standalone: true,
  imports: [CommonModule, ProfileGlobalRankComponent, ProfileLocalRankComponent, ProfilePpComponent],
  templateUrl: './profile-ranks.component.html',
  styles: [':host { display: contents; }']
})
export class ProfileRanksComponent {}
