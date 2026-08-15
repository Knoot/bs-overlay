import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { OverlayStateService } from '../../services/overlay-state.service';

@Component({
  selector: 'app-song-meta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './song-meta.component.html',
  styles: [':host { display: contents; }']
})
export class SongMetaComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly state = inject(OverlayStateService);
  readonly song = this.state.song;
  readonly ui = this.state.ui;
  readonly difficultyHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.song().difficultyHtml));

  bpmText(): string {
    const bpm = this.song().bpm;
    return typeof bpm === 'number' && Number.isFinite(bpm) ? `BPM ${Math.round(bpm)}` : 'BPM -';
  }
}
