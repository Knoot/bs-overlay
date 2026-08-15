import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CyberpunkPlayingLayoutComponent } from './cyberpunk-playing-layout.component';
import { CyberpunkProfileLayoutComponent } from './cyberpunk-profile-layout.component';

@Component({
  selector: 'app-cyberpunk-overlay-layout',
  standalone: true,
  imports: [CommonModule, CyberpunkProfileLayoutComponent, CyberpunkPlayingLayoutComponent],
  templateUrl: './cyberpunk-overlay-layout.component.html',
  styles: [':host { display: contents; }']
})
export class CyberpunkOverlayLayoutComponent {}
