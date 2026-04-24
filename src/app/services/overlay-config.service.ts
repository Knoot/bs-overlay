import { Injectable } from '@angular/core';
import { DEFAULT_CONFIG, I18N, STORAGE_KEY } from '../constants/overlay.constants';
import { Lang, Layout, OverlayConfig, Theme } from '../models/overlay.models';

@Injectable({ providedIn: 'root' })
export class OverlayConfigService {
  private config: OverlayConfig = { ...DEFAULT_CONFIG };

  loadConfig(): OverlayConfig {
    const saved = localStorage.getItem(STORAGE_KEY);
    const baseConfig = { ...DEFAULT_CONFIG };

    if (saved) {
      try {
        this.config = { ...baseConfig, ...(JSON.parse(saved) as Partial<OverlayConfig>) };
      } catch (error) {
        console.warn('[BS+ Overlay] Invalid saved config. Resetting localStorage config.', error);
        localStorage.removeItem(STORAGE_KEY);
        this.config = baseConfig;
      }
    } else {
      this.config = baseConfig;
    }

    this.config = { ...this.config, ...this.readQueryParams() };
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
    return [
      'top-left',
      'top-center',
      'top-right',
      'middle-left',
      'middle-right',
      'bottom-left',
      'bottom-center',
      'bottom-right'
    ].includes(value);
  }

  isLang(value: string): value is Lang {
    return value === 'en' || value === 'ru';
  }

  isTheme(value: string): value is Theme {
    return value === 'cyberpunk' || value === 'sunset';
  }

  syncQueryParams(config: OverlayConfig): void {
    const params = new URLSearchParams();

    params.set('lang', config.lang);
    params.set('theme', config.theme);
    params.set('ws', config.ws);
    params.set('customProxy', config.customProxy);
    params.set('layout', config.layout);
    params.set('scale', String(this.clampScale(config.scale)));
    params.set('nameSource', config.nameSource);
    params.set('avatarSource', config.avatarSource);
    params.set('showBL', String(config.showBL));
    params.set('showSS', String(config.showSS));
    params.set('showBLNextGlobal', String(config.showBLNextGlobal));
    params.set('showBLNextRegion', String(config.showBLNextRegion));
    params.set('showBLNextFriends', String(config.showBLNextFriends));
    params.set('showDebugUI', String(config.showDebugUI));
    params.set('glowAvatar', String(config.glowAvatar));
    params.set('showCover', String(config.showCover));
    params.set('showTitle', String(config.showTitle));
    params.set('showArtist', String(config.showArtist));
    params.set('showMeta', String(config.showMeta));
    params.set('showBsr', String(config.showBsr));
    params.set('showMapRatings', String(config.showMapRatings));
    params.set('showSSStars', String(config.showSSStars));
    params.set('showProgress', String(config.showProgress));
    params.set('showHp', String(config.showHp));
    params.set('showStats', String(config.showStats));
    params.set('showAcc', String(config.showAcc));
    params.set('showMapBg', String(config.showMapBg));
    params.set('showBLBg', String(config.showBLBg));

    if (config.blId) {
      params.set('blId', config.blId);
    }

    if (config.ssId) {
      params.set('ssId', config.ssId);
    }

    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}${window.location.hash}` : `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }

  private readQueryParams(): Partial<OverlayConfig> {
    const params = new URLSearchParams(window.location.search);
    const partial: Partial<OverlayConfig> = {};
    const lang = params.get('lang');
    const theme = params.get('theme');
    const ws = params.get('ws');
    const customProxy = params.get('customProxy');
    const layout = params.get('layout');
    const scale = params.get('scale');
    const nameSource = params.get('nameSource');
    const avatarSource = params.get('avatarSource');
    const blId = params.get('blId');
    const ssId = params.get('ssId');

    if (lang && this.isLang(lang)) {
      partial.lang = lang;
    }

    if (theme && this.isTheme(theme)) {
      partial.theme = theme;
    }

    if (ws) {
      partial.ws = ws;
    }

    if (customProxy !== null) {
      partial.customProxy = customProxy.trim();
    }

    if (layout && this.isLayout(layout)) {
      partial.layout = layout;
    }

    if (scale !== null) {
      const parsedScale = Number.parseFloat(scale);
      if (Number.isFinite(parsedScale)) {
        partial.scale = this.clampScale(parsedScale);
      }
    }

    if (blId !== null) {
      partial.blId = blId.trim();
    }

    if (nameSource === 'beatleader' || nameSource === 'scoresaber') {
      partial.nameSource = nameSource;
    }

    if (avatarSource === 'beatleader' || avatarSource === 'scoresaber') {
      partial.avatarSource = avatarSource;
    }

    if (ssId !== null) {
      partial.ssId = ssId.trim();
    }

    this.assignBooleanParam(params, partial, 'showBL');
    this.assignBooleanParam(params, partial, 'showSS');
    this.assignBooleanParam(params, partial, 'showBLNextGlobal');
    this.assignBooleanParam(params, partial, 'showBLNextRegion');
    this.assignBooleanParam(params, partial, 'showBLNextFriends');
    this.assignBooleanParam(params, partial, 'showDebugUI');
    this.assignBooleanParam(params, partial, 'glowAvatar');
    this.assignBooleanParam(params, partial, 'showCover');
    this.assignBooleanParam(params, partial, 'showTitle');
    this.assignBooleanParam(params, partial, 'showArtist');
    this.assignBooleanParam(params, partial, 'showMeta');
    this.assignBooleanParam(params, partial, 'showBsr');
    this.assignBooleanParam(params, partial, 'showMapRatings');
    this.assignBooleanParam(params, partial, 'showSSStars');
    this.assignBooleanParam(params, partial, 'showProgress');
    this.assignBooleanParam(params, partial, 'showHp');
    this.assignBooleanParam(params, partial, 'showStats');
    this.assignBooleanParam(params, partial, 'showAcc');
    this.assignBooleanParam(params, partial, 'showMapBg');
    this.assignBooleanParam(params, partial, 'showBLBg');

    return partial;
  }

  private assignBooleanParam(
    params: URLSearchParams,
    target: Partial<OverlayConfig>,
    key:
      | 'showBL'
      | 'showSS'
      | 'showBLNextGlobal'
      | 'showBLNextRegion'
      | 'showBLNextFriends'
      | 'showDebugUI'
      | 'glowAvatar'
      | 'showCover'
      | 'showTitle'
      | 'showArtist'
      | 'showMeta'
      | 'showBsr'
      | 'showMapRatings'
      | 'showSSStars'
      | 'showProgress'
      | 'showHp'
      | 'showStats'
      | 'showAcc'
      | 'showMapBg'
      | 'showBLBg'
  ): void {
    const value = params.get(key);

    if (value === null) {
      return;
    }

    const parsed = this.parseBoolean(value);
    if (parsed !== null) {
      target[key] = parsed;
    }
  }

  private parseBoolean(value: string): boolean | null {
    if (value === 'true' || value === '1') {
      return true;
    }

    if (value === 'false' || value === '0') {
      return false;
    }

    return null;
  }
}
