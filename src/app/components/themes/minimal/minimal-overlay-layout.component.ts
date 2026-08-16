import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MinimalPlayingLayoutComponent } from './minimal-playing-layout.component';
import { MinimalProfileLayoutComponent } from './minimal-profile-layout.component';

@Component({
  selector: 'app-minimal-overlay-layout',
  standalone: true,
  imports: [CommonModule, MinimalProfileLayoutComponent, MinimalPlayingLayoutComponent],
  templateUrl: './minimal-overlay-layout.component.html',
  styles: [':host { display: contents; }']
})
export class MinimalOverlayLayoutComponent {}
