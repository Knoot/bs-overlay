import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SunsetPlayingLayoutComponent } from './sunset-playing-layout.component';
import { SunsetProfileLayoutComponent } from './sunset-profile-layout.component';

@Component({
  selector: 'app-sunset-overlay-layout',
  standalone: true,
  imports: [CommonModule, SunsetProfileLayoutComponent, SunsetPlayingLayoutComponent],
  templateUrl: './sunset-overlay-layout.component.html',
  styles: [':host { display: contents; }']
})
export class SunsetOverlayLayoutComponent {}
