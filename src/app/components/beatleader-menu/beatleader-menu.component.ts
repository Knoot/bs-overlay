import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-beatleader-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './beatleader-menu.component.html',
  styles: [':host { display: contents; }']
})
export class BeatleaderMenuComponent {}
