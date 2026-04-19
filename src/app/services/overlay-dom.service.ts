import { Injectable } from '@angular/core';
import { PLACEHOLDER_COVER } from '../constants/overlay.constants';
import { Lang, OverlayConfig, OverlayElements, PlayerCandidate, ViewMode } from '../models/overlay.models';
import { OverlayConfigService } from './overlay-config.service';

@Injectable({ providedIn: 'root' })
export class OverlayDomService {
  private els?: OverlayElements;
  private debugTimeout: number | null = null;

  constructor(private readonly configService: OverlayConfigService) {}

  initializeElements(): OverlayElements {
    this.els = {
      app: this.mustGet('app-container'),
      menuOverlay: this.mustGet('menu-overlay'),
      playingOverlay: this.mustGet('playing-overlay'),
      topGlassPanel: this.mustGet('top-glass-panel'),
      headerRow: this.mustGet('header-row'),
      textBlock: this.mustGet('text-block'),
      statsRow: this.mustGet('stats-row'),
      progFill: this.mustGet('progress-fill'),
      time: this.mustGet('time-prog'),
      title: this.mustGet('title'),
      artist: this.mustGet('artist-mapper'),
      metaLine: this.mustGet('meta-line'),
      bsrLine: this.mustGet('bsr-line'),
      diff: this.mustGet('difficulty'),
      bpm: this.mustGet('bpm'),
      key: this.mustGet('key'),
      date: this.mustGet('map-date'),
      coverWrapper: this.mustGet('cover-wrapper'),
      cover: this.mustGet('cover') as HTMLImageElement,
      bottomStats: this.mustGet('bottom-stats'),
      bottomStatRow: this.mustQuery('.bottom-stat-row'),
      accLarge: this.mustQuery('.acc-large'),
      accNum: this.mustGet('acc-num'),
      accGrade: this.mustGet('acc-grade'),
      combo: this.mustGet('combo-val'),
      miss: this.mustGet('miss-val'),
      hpBarWrapper: this.mustGet('hp-bar-wrapper'),
      hpVal: this.mustGet('hp-val'),
      hpFill: this.mustGet('hp-bar-fill'),
      debug: this.mustGet('debug'),
      settings: this.mustGet('settings-modal'),
      blWrapper: this.mustGet('bl-wrapper'),
      blInfo: this.mustGet('bl-info'),
      blAvatarWrapper: this.mustGet('bl-avatar-wrapper'),
      blAvatar: this.mustGet('bl-avatar') as HTMLImageElement,
      blName: this.mustGet('bl-name'),
      blGlobal: this.mustGet('bl-global'),
      blLocal: this.mustGet('bl-local'),
      blPp: this.mustGet('bl-pp'),
      inputWs: this.mustGet('inp-ws') as HTMLInputElement,
      inputScale: this.mustGet('inp-scale') as HTMLInputElement,
      inputBl: this.mustGet('inp-bl') as HTMLInputElement,
      inputShowBl: this.mustGet('inp-show-bl') as HTMLInputElement,
      inputShowDebug: this.mustGet('inp-show-debug') as HTMLInputElement,
      inputGlowAvatar: this.mustGet('inp-glow-avatar') as HTMLInputElement,
      inputShowCover: this.mustGet('inp-show-cover') as HTMLInputElement,
      inputShowTitle: this.mustGet('inp-show-title') as HTMLInputElement,
      inputShowArtist: this.mustGet('inp-show-artist') as HTMLInputElement,
      inputShowMeta: this.mustGet('inp-show-meta') as HTMLInputElement,
      inputShowBsr: this.mustGet('inp-show-bsr') as HTMLInputElement,
      inputShowProgress: this.mustGet('inp-show-progress') as HTMLInputElement,
      inputShowHp: this.mustGet('inp-show-hp') as HTMLInputElement,
      inputShowStats: this.mustGet('inp-show-stats') as HTMLInputElement,
      inputShowAcc: this.mustGet('inp-show-acc') as HTMLInputElement,
      inputMapBg: this.mustGet('inp-map-bg') as HTMLInputElement,
      inputBlBg: this.mustGet('inp-bl-bg') as HTMLInputElement
    };

    return this.els;
  }

  get elements(): OverlayElements {
    if (!this.els) {
      throw new Error('Overlay elements are not initialized');
    }

    return this.els;
  }

  setupInitialView(): void {
    this.elements.app.style.display = 'none';
    this.elements.cover.src = PLACEHOLDER_COVER;
  }

  applyLanguage(config: OverlayConfig): void {
    const translations = this.configService.getTranslations(config.lang);
    const isDefaultTitle =
      this.elements.title.textContent === this.configService.getText('en', 'waitingSong') ||
      this.elements.title.textContent === this.configService.getText('ru', 'waitingSong') ||
      this.elements.title.textContent === 'Waiting for song...';

    const isDefaultLoading =
      this.elements.blName.textContent === this.configService.getText('en', 'loading') ||
      this.elements.blName.textContent === this.configService.getText('ru', 'loading') ||
      this.elements.blName.textContent === 'Loading...';

    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');

      if (!key || !translations[key]) {
        return;
      }

      if (element.id === 'title' && !isDefaultTitle) {
        return;
      }

      if (element.id === 'bl-name' && !isDefaultLoading) {
        return;
      }

      element.textContent = translations[key];
    });

    this.elements.inputBl.placeholder = translations['blPlaceholder'];
    document.documentElement.lang = config.lang;
  }

  populateInputs(config: OverlayConfig): void {
    this.elements.inputWs.value = config.ws;
    this.elements.inputScale.value = String(config.scale);
    this.elements.inputBl.value = config.blId;
    this.elements.inputShowBl.checked = config.showBL !== false;
    this.elements.inputShowDebug.checked = config.showDebugUI !== false;
    this.elements.inputGlowAvatar.checked = config.glowAvatar !== false;
    this.elements.inputShowCover.checked = config.showCover !== false;
    this.elements.inputShowTitle.checked = config.showTitle !== false;
    this.elements.inputShowArtist.checked = config.showArtist !== false;
    this.elements.inputShowMeta.checked = config.showMeta !== false;
    this.elements.inputShowBsr.checked = config.showBsr !== false;
    this.elements.inputShowProgress.checked = config.showProgress !== false;
    this.elements.inputShowHp.checked = config.showHp !== false;
    this.elements.inputShowStats.checked = config.showStats !== false;
    this.elements.inputShowAcc.checked = config.showAcc !== false;
    this.elements.inputMapBg.checked = config.showMapBg !== false;
    this.elements.inputBlBg.checked = config.showBLBg !== false;

    const layoutRadio = document.querySelector<HTMLInputElement>(`input[name="layout"][value="${config.layout}"]`);
    const langRadio = document.querySelector<HTMLInputElement>(`input[name="lang"][value="${config.lang}"]`);
    if (layoutRadio) layoutRadio.checked = true;
    if (langRadio) langRadio.checked = true;
  }

  readFormConfig(currentConfig: OverlayConfig): OverlayConfig {
    const checkedLayout = document.querySelector<HTMLInputElement>('input[name="layout"]:checked')?.value ?? currentConfig.layout;
    const checkedLang = document.querySelector<HTMLInputElement>('input[name="lang"]:checked')?.value ?? currentConfig.lang;

    return {
      ...currentConfig,
      ws: this.elements.inputWs.value.trim() || 'ws://127.0.0.1:2947/socket',
      scale: this.configService.clampScale(Number.parseFloat(this.elements.inputScale.value)),
      blId: this.elements.inputBl.value.trim(),
      showBL: this.elements.inputShowBl.checked,
      showDebugUI: this.elements.inputShowDebug.checked,
      glowAvatar: this.elements.inputGlowAvatar.checked,
      showCover: this.elements.inputShowCover.checked,
      showTitle: this.elements.inputShowTitle.checked,
      showArtist: this.elements.inputShowArtist.checked,
      showMeta: this.elements.inputShowMeta.checked,
      showBsr: this.elements.inputShowBsr.checked,
      showProgress: this.elements.inputShowProgress.checked,
      showHp: this.elements.inputShowHp.checked,
      showStats: this.elements.inputShowStats.checked,
      showAcc: this.elements.inputShowAcc.checked,
      showMapBg: this.elements.inputMapBg.checked,
      showBLBg: this.elements.inputBlBg.checked,
      layout: this.configService.isLayout(checkedLayout) ? checkedLayout : currentConfig.layout,
      lang: this.configService.isLang(checkedLang) ? checkedLang : currentConfig.lang
    };
  }

  applyLayout(config: OverlayConfig): void {
    const isLeft = config.layout.includes('left');
    const isTop = config.layout.includes('top');

    this.elements.app.style.transformOrigin = `${isLeft ? 'left' : 'right'} ${isTop ? 'top' : 'bottom'}`;
    this.elements.app.style.transform = `scale(${config.scale})`;
    this.elements.app.style.top = isTop ? '20px' : 'auto';
    this.elements.app.style.bottom = isTop ? 'auto' : '20px';
    this.elements.app.style.left = isLeft ? '20px' : 'auto';
    this.elements.app.style.right = isLeft ? 'auto' : '20px';
    this.elements.playingOverlay.style.flexDirection = isTop ? 'column' : 'column-reverse';
    this.elements.menuOverlay.style.top = isTop ? '0' : 'auto';
    this.elements.menuOverlay.style.bottom = isTop ? 'auto' : '0';
    this.elements.playingOverlay.style.top = isTop ? '0' : 'auto';
    this.elements.playingOverlay.style.bottom = isTop ? 'auto' : '0';
    this.elements.app.style.alignItems = isLeft ? 'flex-start' : 'flex-end';
    this.elements.playingOverlay.style.alignItems = isLeft ? 'flex-start' : 'flex-end';
    this.elements.headerRow.style.flexDirection = isLeft ? 'row' : 'row-reverse';
    this.elements.textBlock.style.alignItems = isLeft ? 'flex-start' : 'flex-end';
    this.elements.textBlock.style.textAlign = isLeft ? 'left' : 'right';
    this.elements.statsRow.style.justifyContent = isLeft ? 'flex-start' : 'flex-end';
    this.elements.bottomStats.style.alignItems = isLeft ? 'flex-start' : 'flex-end';
    this.elements.bottomStatRow.style.flexDirection = isLeft ? 'row' : 'row-reverse';
    this.elements.blWrapper.style.flexDirection = isLeft ? 'row' : 'row-reverse';
    this.elements.blInfo.style.alignItems = isLeft ? 'flex-start' : 'flex-end';
    this.elements.blInfo.style.textAlign = isLeft ? 'left' : 'right';
    this.elements.bsrLine.style.justifyContent = isLeft ? 'flex-start' : 'flex-end';
    this.elements.hpFill.style.marginLeft = isLeft ? '0' : 'auto';
    this.elements.progFill.style.marginLeft = isLeft ? '0' : 'auto';
  }

  applyModules(config: OverlayConfig): void {
    this.elements.coverWrapper.style.display = config.showCover ? 'flex' : 'none';
    this.elements.title.style.display = config.showTitle ? '' : 'none';
    this.elements.artist.style.display = config.showArtist ? '' : 'none';
    this.elements.metaLine.style.display = config.showMeta ? '' : 'none';
    this.elements.bsrLine.style.display = config.showBsr ? '' : 'none';

    const showAnyText = config.showTitle || config.showArtist || config.showMeta || config.showBsr;
    this.elements.textBlock.style.display = showAnyText ? 'flex' : 'none';

    const showHeader = config.showCover || showAnyText;
    this.elements.headerRow.style.display = showHeader ? 'flex' : 'none';
    this.elements.statsRow.style.display = config.showProgress ? 'flex' : 'none';

    const showTopPanel = showHeader || config.showProgress;
    this.elements.topGlassPanel.style.display = showTopPanel ? 'flex' : 'none';
    this.elements.hpBarWrapper.style.display = config.showHp ? 'flex' : 'none';
    this.elements.bottomStatRow.style.display = config.showStats ? 'flex' : 'none';
    this.elements.accLarge.style.display = config.showAcc ? 'flex' : 'none';

    const showBottomStats = config.showStats || config.showAcc;
    this.elements.bottomStats.style.display = showBottomStats ? 'flex' : 'none';
  }

  applyGlow(config: OverlayConfig): void {
    this.elements.blAvatarWrapper.classList.toggle('active-glow', config.glowAvatar !== false);
    this.elements.coverWrapper.classList.toggle('active-glow', config.glowAvatar !== false);
  }

  applyPanelBackgrounds(config: OverlayConfig): void {
    this.elements.topGlassPanel.classList.toggle('panel-no-bg', config.showMapBg === false);
    this.elements.menuOverlay.classList.toggle('panel-no-bg', config.showBLBg === false);
  }

  toggleSettingsModal(): void {
    this.elements.settings.classList.toggle('show');
  }

  hideSettingsModal(): void {
    this.elements.settings.classList.remove('show');
  }

  setAppVisible(visible: boolean): void {
    this.elements.app.style.display = visible ? 'flex' : 'none';
  }

  setViewMode(mode: ViewMode, showBL: boolean): void {
    if (mode === 'playing') {
      this.elements.menuOverlay.classList.remove('active');
      this.elements.playingOverlay.classList.add('active');
      return;
    }

    this.elements.playingOverlay.classList.remove('active');
    this.elements.menuOverlay.classList.toggle('active', showBL);
  }

  resetBLDisplay(lang: Lang, messageKey: string = 'loading'): void {
    this.elements.blName.textContent = this.configService.getText(lang, messageKey);
    this.elements.blGlobal.textContent = '#--';
    this.elements.blLocal.textContent = '#--';
    this.elements.blPp.textContent = '-- pp';
    this.elements.blAvatar.src = '';
    this.elements.blAvatarWrapper.style.display = 'none';
  }

  renderBLPlayer(player: PlayerCandidate): void {
    this.elements.blName.textContent = player.name || 'Unknown';
    this.elements.blGlobal.textContent = player.rank ? `#${player.rank.toLocaleString()}` : '#--';
    this.elements.blLocal.textContent = player.countryRank
      ? `#${player.countryRank.toLocaleString()} (${player.country || 'N/A'})`
      : '#-- (N/A)';
    this.elements.blPp.textContent = player.pp ? `${Math.round(player.pp).toLocaleString()} pp` : '-- pp';

    if (player.avatar) {
      this.elements.blAvatar.src = player.avatar;
      this.elements.blAvatarWrapper.style.display = 'block';
    } else {
      this.elements.blAvatar.src = '';
      this.elements.blAvatarWrapper.style.display = 'none';
    }
  }

  showDebug(message: string, enabled: boolean): void {
    console.log('[BS+ Overlay]', message);
    if (!enabled) return;

    if (this.debugTimeout !== null) {
      window.clearTimeout(this.debugTimeout);
    }

    this.elements.debug.textContent = message;
    this.elements.debug.style.opacity = '1';
    this.debugTimeout = window.setTimeout(() => {
      this.elements.debug.style.opacity = '0';
    }, 5000);
  }

  renderProgress(timeSec: number, duration: number): void {
    if (!(duration > 0)) return;

    const safeTime = Math.max(0, Math.min(timeSec, duration));
    const pct = Math.min((safeTime / duration) * 100, 100);
    this.elements.progFill.style.width = `${pct}%`;

    const curM = Math.floor(safeTime / 60);
    const curS = Math.floor(safeTime % 60).toString().padStart(2, '0');
    const totM = Math.floor(duration / 60);
    const totS = Math.floor(duration % 60).toString().padStart(2, '0');
    this.elements.time.textContent = `${curM}:${curS} / ${totM}:${totS}`;
  }

  updateSongBasics(params: {
    title: string;
    artist: string;
    difficultyHtml: string;
    diffColor: string;
    diffShadow: string;
    bpm: number;
    coverSrc: string;
  }): void {
    this.elements.title.textContent = params.title;
    this.elements.artist.textContent = params.artist;
    this.elements.diff.style.setProperty('--diff-color', params.diffColor);
    this.elements.diff.style.setProperty('--diff-shadow', params.diffShadow);
    this.elements.diff.innerHTML = params.difficultyHtml;
    this.elements.bpm.textContent = `BPM ${Math.round(params.bpm || 0)}`;
    this.elements.cover.src = params.coverSrc;
  }

  updateBsrLine(keyText: string, dateText: string): void {
    this.elements.key.textContent = keyText;
    this.elements.date.textContent = dateText;
  }

  updateAccuracy(accuracy: number, grade: string, color: string): void {
    this.elements.accNum.textContent = `${(accuracy * 100).toFixed(1)}%`;
    this.elements.accGrade.textContent = grade;
    this.elements.accGrade.style.color = color;
    this.elements.accGrade.style.textShadow = `0 0 10px ${color}, 1px 1px 3px #000`;
  }

  updateCombo(combo: number): void {
    this.elements.combo.textContent = String(combo);
  }

  updateMiss(missCount: number): void {
    this.elements.miss.textContent = String(missCount);
  }

  updateHealth(currentHealth: number): void {
    const hpPct = Math.round(currentHealth * 100);
    this.elements.hpVal.textContent = `${hpPct}%`;
    this.elements.hpFill.style.width = `${hpPct}%`;
  }

  setDefaultTime(): void {
    this.elements.time.textContent = '0:00 / 0:00';
  }

  private mustGet(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Required element #${id} was not found`);
    return element;
  }

  private mustQuery(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Required element ${selector} was not found`);
    return element;
  }
}
