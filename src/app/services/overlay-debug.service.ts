import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OverlayDebugService {
  private debugElement: HTMLElement | null = null;
  private debugTimeout: number | null = null;

  initializeElement(): void {
    this.debugElement = this.mustGet('debug');
  }

  show(message: string, enabled: boolean): void {
    console.log('[BS+ Overlay]', message);
    if (!enabled) return;

    if (this.debugTimeout !== null) {
      window.clearTimeout(this.debugTimeout);
    }

    const element = this.getDebugElement();
    element.textContent = message;
    element.style.opacity = '1';
    this.debugTimeout = window.setTimeout(() => {
      element.style.opacity = '0';
    }, 5000);
  }

  private getDebugElement(): HTMLElement {
    if (!this.debugElement) {
      throw new Error('Overlay debug element is not initialized');
    }

    return this.debugElement;
  }

  private mustGet(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Required element #${id} was not found`);
    return element;
  }
}
