import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-radial-progress-cover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radial-progress-cover.component.html',
  styles: [':host { display: contents; }']
})
export class RadialProgressCoverComponent {
  private readonly state = inject(OverlayStateService);

  readonly song = this.state.song;
  readonly progress = this.state.progress;
  readonly ui = this.state.ui;

  progressDegrees(): number {
    return (this.progressPercent() / 100) * 360;
  }

  timeText(): string {
    const state = this.progress();
    return `${this.formatTime(state.currentTime)} / ${this.formatTime(state.duration)}`;
  }

  private progressPercent(): number {
    const state = this.progress();
    return state.duration > 0 ? Math.min(Math.max((state.currentTime / state.duration) * 100, 0), 100) : 0;
  }

  private formatTime(timeSec: number): string {
    const safeTime = Math.max(0, Number(timeSec) || 0);
    const minutes = Math.floor(safeTime / 60);
    const seconds = Math.floor(safeTime % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
