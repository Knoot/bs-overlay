import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AnimatedNumberDirective } from '../../../directives/animated-number.directive';
import { RadialProgressCoverComponent } from '../../radial-progress-cover/radial-progress-cover.component';
import { OverlayStateService } from '../../../services/overlay-state.service';

@Component({
  selector: 'app-minimal-playing-layout',
  standalone: true,
  imports: [CommonModule, AnimatedNumberDirective, RadialProgressCoverComponent],
  templateUrl: './minimal-playing-layout.component.html',
  styles: [':host { display: contents; }']
})
export class MinimalPlayingLayoutComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly state = inject(OverlayStateService);

  readonly ui = this.state.ui;
  readonly song = this.state.song;
  readonly score = this.state.score;
  readonly difficultyHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.song().difficultyHtml));

  bpmText(): string {
    const bpm = this.song().bpm;
    return typeof bpm === 'number' && Number.isFinite(bpm) ? `BPM ${Math.round(bpm)}` : 'BPM -';
  }
}
