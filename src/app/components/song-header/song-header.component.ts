import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-song-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './song-header.component.html',
  styles: [':host { display: contents; }']
})
export class SongHeaderComponent {}
