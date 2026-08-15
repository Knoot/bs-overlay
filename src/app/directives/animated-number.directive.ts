import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';

export type AnimatedNumberFormat = 'integer' | 'percent0' | 'percent1' | 'pp0' | 'pp2';

@Directive({
  selector: '[appAnimatedNumber]',
  standalone: true
})
export class AnimatedNumberDirective implements OnChanges, OnDestroy {
  private static readonly DURATION_MS = 280;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private animationId: number | null = null;
  private renderedValue: number | null = null;

  @Input('appAnimatedNumber') value = 0;
  @Input() animatedNumberFormat: AnimatedNumberFormat = 'integer';

  ngOnChanges(changes: SimpleChanges): void {
    if (!('value' in changes)) {
      this.render(this.getSafeValue());
      return;
    }

    this.animateTo(this.getSafeValue());
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
  }

  private animateTo(target: number): void {
    const start = this.renderedValue ?? target;

    this.cancelAnimation();

    if (Math.abs(start - target) < 0.0001) {
      this.render(target);
      return;
    }

    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / AnimatedNumberDirective.DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;

      this.render(current);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(tick);
        return;
      }

      this.render(target);
      this.animationId = null;
    };

    this.animationId = requestAnimationFrame(tick);
  }

  private render(value: number): void {
    this.renderedValue = value;
    this.element.textContent = this.format(value);
  }

  private format(value: number): string {
    switch (this.animatedNumberFormat) {
      case 'percent0':
        return `${Math.round(value * 100)}%`;
      case 'percent1':
        return `${(value * 100).toFixed(1)}%`;
      case 'pp0':
        return `${Math.round(value).toLocaleString()} pp`;
      case 'pp2':
        return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pp`;
      case 'integer':
      default:
        return String(Math.round(value));
    }
  }

  private getSafeValue(): number {
    const parsed = Number(this.value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private cancelAnimation(): void {
    if (this.animationId === null) {
      return;
    }

    cancelAnimationFrame(this.animationId);
    this.animationId = null;
  }
}
