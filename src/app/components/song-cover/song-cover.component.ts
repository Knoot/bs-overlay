import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-song-cover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './song-cover.component.html',
  styles: [':host { display: contents; }']
})
export class SongCoverComponent {
  private readonly state = inject(OverlayStateService);
  readonly song = this.state.song;
  readonly ui = this.state.ui;
}
