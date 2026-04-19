import { Injectable } from '@angular/core';
import { DEFAULT_CONFIG, I18N, STORAGE_KEY } from '../constants/overlay.constants';
import { Lang, Layout, OverlayConfig } from '../models/overlay.models';

@Injectable({ providedIn: 'root' })
export class OverlayConfigService {
  private config: OverlayConfig = { ...DEFAULT_CONFIG };

  loadConfig(): OverlayConfig {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        this.config = { ...DEFAULT_CONFIG, ...(JSON.parse(saved) as Partial<OverlayConfig>) };
      } catch (error) {
        console.warn('[BS+ Overlay] Invalid saved config. Resetting localStorage config.', error);
        localStorage.removeItem(STORAGE_KEY);
        this.config = { ...DEFAULT_CONFIG };
      }
    } else {
      this.config = { ...DEFAULT_CONFIG };
    }

    this.config.scale = this.clampScale(Number.parseFloat(String(this.config.scale)));
    return this.getConfig();
  }

  getConfig(): OverlayConfig {
    return { ...this.config };
  }

  setConfig(config: OverlayConfig): void {
    this.config = { ...config };
  }

  patchConfig(partial: Partial<OverlayConfig>): OverlayConfig {
    this.config = { ...this.config, ...partial };
    return this.getConfig();
  }

  persistConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.warn('[BS+ Overlay] Failed to persist config:', error);
    }
  }

  getText(lang: Lang, key: string): string {
    return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
  }

  getTranslations(lang: Lang): Record<string, string> {
    return I18N[lang] ?? I18N.en;
  }

  clampScale(value: number): number {
    if (!Number.isFinite(value)) {
      return 1;
    }

    return Math.min(2, Math.max(0.5, value));
  }

  isLayout(value: string): value is Layout {
    return ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value);
  }

  isLang(value: string): value is Lang {
    return value === 'en' || value === 'ru';
  }
}
