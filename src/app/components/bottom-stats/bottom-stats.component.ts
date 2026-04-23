import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-bottom-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bottom-stats.component.html',
  styles: [':host { display: contents; }']
})
export class BottomStatsComponent {}
