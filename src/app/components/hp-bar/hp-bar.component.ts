import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-hp-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hp-bar.component.html',
  styles: [':host { display: contents; }']
})
export class HpBarComponent {}
