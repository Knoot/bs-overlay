import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-map-ratings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-ratings.component.html',
  styles: [':host { display: contents; }']
})
export class MapRatingsComponent {
  readonly mapRatings = inject(OverlayStateService).mapRatings;

  formatMapRating(value: number | null): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return '--';
    }

    return `${value.toFixed(2)}★`;
  }
}
