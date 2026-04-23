import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BottomStatsComponent } from '../bottom-stats/bottom-stats.component';
import { HpBarComponent } from '../hp-bar/hp-bar.component';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { SongHeaderComponent } from '../song-header/song-header.component';

@Component({
  selector: 'app-playing-overlay',
  standalone: true,
  imports: [CommonModule, SongHeaderComponent, ProgressBarComponent, HpBarComponent, BottomStatsComponent],
  templateUrl: './playing-overlay.component.html',
  styles: [':host { display: contents; }']
})
export class PlayingOverlayComponent {}
