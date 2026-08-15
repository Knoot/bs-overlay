import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-song-identity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './song-identity.component.html',
  styles: [':host { display: contents; }']
})
export class SongIdentityComponent {
  private readonly state = inject(OverlayStateService);
  readonly song = this.state.song;
  readonly ui = this.state.ui;
}
