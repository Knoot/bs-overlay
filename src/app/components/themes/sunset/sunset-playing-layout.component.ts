import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BottomStatsComponent } from '../../bottom-stats/bottom-stats.component';
import { HpBarComponent } from '../../hp-bar/hp-bar.component';
import { MapRatingsComponent } from '../../map-ratings/map-ratings.component';
import { PpPredictorComponent } from '../../pp-predictor/pp-predictor.component';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';
import { SongCoverComponent } from '../../song-cover/song-cover.component';
import { SongIdentityComponent } from '../../song-identity/song-identity.component';
import { SongMetaComponent } from '../../song-meta/song-meta.component';
import { OverlayStateService } from '../../../services/overlay-state.service';

@Component({
  selector: 'app-sunset-playing-layout',
  standalone: true,
  imports: [
    CommonModule,
    SongCoverComponent,
    SongIdentityComponent,
    SongMetaComponent,
    MapRatingsComponent,
    PpPredictorComponent,
    ProgressBarComponent,
    HpBarComponent,
    BottomStatsComponent
  ],
  templateUrl: './sunset-playing-layout.component.html',
  styles: [':host { display: contents; }']
})
export class SunsetPlayingLayoutComponent {
  readonly ui = inject(OverlayStateService).ui;
}
