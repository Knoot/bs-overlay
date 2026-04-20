import { Injectable } from '@angular/core';
import { PLACEHOLDER_COVER } from '../constants/overlay.constants';
import { MapInfoPayload, OverlayConfig, ScoreEventPayload, ViewMode, WsPayload } from '../models/overlay.models';
import { BeatleaderService } from './beatleader.service';
import { OverlayConfigService } from './overlay-config.service';
import { OverlayDomService } from './overlay-dom.service';
import { OverlaySocketService } from './overlay-socket.service';

@Injectable({ providedIn: 'root' })
export class OverlayFacadeService {
  private config!: OverlayConfig;
  private isGamePlaying = false;
  private duration = 0;
  private lastKnownSongTime = 0;
  private lastTimeAnchorMs = 0;
  private mapTimeMultiplier = 1;
  private progressRafId: number | null = null;
  private lastBlFetch = 0;
  private isFetchingBL = false;
  private blRefreshInterval: number | null = null;
  private readonly keydownHandler = (event: KeyboardEvent) => {
    if (event.key === 'F2') {
      this.dom.toggleSettingsModal();
    }
  };

  constructor(
    private readonly configService: OverlayConfigService,
    private readonly dom: OverlayDomService,
    private readonly beatleader: BeatleaderService,
    private readonly socket: OverlaySocketService
  ) {}

  init(): void {
    this.dom.initializeElements();
    this.dom.setupInitialView();
    this.config = this.configService.loadConfig();
    this.dom.populateInputs(this.config);
    this.dom.applyTheme(this.config);
    this.dom.applyLanguage(this.config);
    this.dom.applyModules(this.config);
    this.dom.applyLayout(this.config);
    this.dom.applyGlow(this.config);
    this.dom.applyPanelBackgrounds(this.config);
    this.connectWS();

    this.blRefreshInterval = window.setInterval(() => {
      void this.fetchBL();
    }, 900000);

    document.addEventListener('keydown', this.keydownHandler);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    this.stopProgressLoop();
    this.socket.destroy();

    if (this.blRefreshInterval !== null) {
      window.clearInterval(this.blRefreshInterval);
      this.blRefreshInterval = null;
    }
  }

  saveSettings(): void {
    const prevBlId = this.config.blId;
    this.config = this.dom.readFormConfig(this.config);

    if (this.config.blId !== prevBlId) {
      this.config.resolvedBlId = '';
      this.config.resolvedBlQuery = '';
      this.lastBlFetch = 0;
      this.dom.resetBLDisplay(this.config.lang, 'loading');
    }

    this.configService.setConfig(this.config);
    this.configService.persistConfig();
    this.configService.syncQueryParams(this.config);
    this.dom.hideSettingsModal();
    this.dom.applyTheme(this.config);
    this.dom.applyLanguage(this.config);
    this.dom.applyModules(this.config);
    this.dom.applyLayout(this.config);
    this.dom.applyGlow(this.config);
    this.dom.applyPanelBackgrounds(this.config);
    this.connectWS();

    if (this.shouldShowBeatLeaderMenu()) {
      void this.fetchBL(true);
    }
  }

  private connectWS(): void {
    this.isGamePlaying = false;
    this.duration = 0;
    this.mapTimeMultiplier = 1;
    this.lastKnownSongTime = 0;
    this.stopProgressLoop();
    this.dom.setAppVisible(false);
    this.dom.showDebug(`Connecting to ${this.config.ws}...`, this.config.showDebugUI);

    this.socket.connect(this.config.ws, {
      onOpen: () => {
        this.dom.showDebug('WebSocket Connected', this.config.showDebugUI);
        this.dom.setAppVisible(true);
        this.setMode('menu');
      },
      onMessage: (payload) => this.handleWsMessage(payload),
      onDisconnect: (error) => {
        this.isGamePlaying = false;
        this.stopProgressLoop();
        this.lastKnownSongTime = 0;
        this.lastTimeAnchorMs = 0;
        this.mapTimeMultiplier = 1;
        this.dom.setAppVisible(false);
        const suffix = error ? ` (${this.describeError(error)})` : '';
        this.dom.showDebug(`WS Lost. Reconnecting...${suffix}`, this.config.showDebugUI);
      }
    });
  }

  private handleWsMessage(data: WsPayload): void {
    try {
      const eventName = data._event;

      if (eventName === 'gameState') {
        this.setMode(data.gameStateChanged === 'Playing' ? 'playing' : 'menu');
      }

      if (eventName === 'mapInfo' && data.mapInfoChanged) {
        this.handleMapInfo(data.mapInfoChanged);
      }

      if (eventName === 'score' && data.scoreEvent) {
        this.handleScore(data.scoreEvent);
      }

      if (eventName === 'pause') {
        this.isGamePlaying = false;
        this.stopProgressLoop();
        if (data.pauseTime !== undefined) {
          this.syncSongTime(data.pauseTime);
        }
      }

      if (eventName === 'resume') {
        if (data.resumeTime !== undefined) {
          this.syncSongTime(data.resumeTime);
        } else {
          this.lastTimeAnchorMs = performance.now();
        }

        this.isGamePlaying = true;
        this.startProgressLoop();
      }
    } catch (error) {
      this.dom.showDebug(`WS handler error: ${this.describeError(error)}`, this.config.showDebugUI);
    }
  }

  private handleMapInfo(mapInfo: MapInfoPayload): void {
    const mapper = mapInfo.mapper && mapInfo.mapper !== 'Not mapped' ? mapInfo.mapper : '';
    const diffStyle = this.getDifficultyStyle(mapInfo.difficulty || '');

    this.dom.updateSongBasics({
      title: mapInfo.sub_name ? `${mapInfo.name} ${mapInfo.sub_name}` : mapInfo.name || '',
      artist: mapper ? `${mapInfo.artist} // ${mapper}` : mapInfo.artist || '-',
      difficultyHtml: this.formatDifficultyDisplay(mapInfo.characteristic || '', mapInfo.difficulty || ''),
      diffColor: diffStyle.color,
      diffShadow: diffStyle.shadow,
      bpm: mapInfo.BPM || 0,
      coverSrc: mapInfo.coverRaw ? `data:image/png;base64,${mapInfo.coverRaw}` : PLACEHOLDER_COVER
    });

    this.duration = (mapInfo.duration || 0) / 1000;
    this.mapTimeMultiplier = Math.max(0, Number(mapInfo.timeMultiplier) || 1);
    this.syncSongTime(mapInfo.time !== undefined ? mapInfo.time : 0);

    if (!(this.duration > 0)) {
      this.dom.setDefaultTime();
    }

    if (mapInfo.BSRKey) {
      this.dom.updateBsrLine(`BSR: ${mapInfo.BSRKey}`, '');
      if (mapInfo.level_id?.startsWith('custom_level_')) {
        void this.fetchBSR(mapInfo.level_id.substring(13));
      }
    } else if (mapInfo.level_id?.startsWith('custom_level_')) {
      void this.fetchBSR(mapInfo.level_id.substring(13));
    } else {
      this.dom.updateBsrLine('OST/DLC', '');
    }

    if (this.isGamePlaying) {
      this.startProgressLoop();
    }
  }

  private handleScore(score: ScoreEventPayload): void {
    if (score.accuracy !== undefined) {
      const accObj = this.getGrade(score.accuracy);
      this.dom.updateAccuracy(score.accuracy, accObj.grade, accObj.color);
    }

    if (score.combo !== undefined) {
      this.dom.updateCombo(score.combo);
    }

    if (score.missCount !== undefined) {
      this.dom.updateMiss(score.missCount);
    }

    if (score.currentHealth !== undefined) {
      this.dom.updateHealth(score.currentHealth);
    }

    if (score.time !== undefined) {
      this.syncSongTime(score.time);
      if (this.isGamePlaying) {
        this.startProgressLoop();
      }
    }
  }

  private async fetchBSR(hash: string): Promise<void> {
    try {
      this.dom.updateBsrLine('BSR: Loading...', '');
      const data = await this.beatleader.fetchBsr(hash);
      const dateText = data.uploaded ? new Date(data.uploaded).toLocaleDateString() : '';
      this.dom.updateBsrLine(`BSR: ${data.id ?? 'N/A'}`, dateText);
    } catch {
      this.dom.updateBsrLine('BSR: N/A', '');
    }
  }

  private async fetchBL(force: boolean = false): Promise<void> {
    if (!this.shouldShowBeatLeaderMenu() || this.isFetchingBL) {
      return;
    }

    if (!force && Date.now() - this.lastBlFetch < 900000) {
      return;
    }

    this.isFetchingBL = true;

    try {
      const result = await this.beatleader.fetchPlayer(this.config.blId, this.config.resolvedBlId, this.config.resolvedBlQuery);

      if (!result.player?.name) {
        throw new Error('Player not found');
      }

      this.config = {
        ...this.config,
        resolvedBlId: result.resolvedBlId,
        resolvedBlQuery: result.resolvedBlQuery
      };
      this.configService.setConfig(this.config);
      this.configService.persistConfig();

      this.dom.renderBLPlayer(result.player);
      this.lastBlFetch = Date.now();

      if (result.bestMatchName) {
        this.dom.showDebug(`BL best match: ${result.bestMatchName}`, this.config.showDebugUI);
      }

      this.dom.showDebug('BL Profile Loaded Successfully!', this.config.showDebugUI);
    } catch (error) {
      const message = this.describeError(error);
      this.dom.resetBLDisplay(this.config.lang, message === 'Player not found' ? 'profileNotFound' : 'profileLoadError');
      this.dom.showDebug(`BL Error: ${message}`, this.config.showDebugUI);
    } finally {
      this.isFetchingBL = false;
    }
  }

  private setMode(mode: ViewMode): void {
    const showBeatLeaderMenu = this.shouldShowBeatLeaderMenu();

    if (mode === 'playing') {
      this.isGamePlaying = true;
      this.lastTimeAnchorMs = performance.now();
      this.dom.setViewMode('playing', showBeatLeaderMenu);
      this.dom.applyLayout(this.config);
      this.startProgressLoop();
      return;
    }

    this.isGamePlaying = false;
    this.stopProgressLoop();
    this.dom.setViewMode('menu', showBeatLeaderMenu);
    this.dom.applyLayout(this.config);

    if (showBeatLeaderMenu) {
      void this.fetchBL();
    }
  }

  private shouldShowBeatLeaderMenu(): boolean {
    return this.config.showBL && this.config.blId.trim().length > 0;
  }

  private syncSongTime(timeSec: number): void {
    const safeTime = Math.max(0, Number(timeSec) || 0);
    this.lastKnownSongTime = safeTime;
    this.lastTimeAnchorMs = performance.now();

    if (this.duration > 0) {
      this.dom.renderProgress(safeTime, this.duration);
    }
  }

  private startProgressLoop(): void {
    if (this.progressRafId !== null) {
      return;
    }

    const tick = () => {
      this.progressRafId = null;

      if (!this.isGamePlaying || !(this.duration > 0)) {
        return;
      }

      const now = performance.now();
      const elapsedSec = Math.max(0, (now - this.lastTimeAnchorMs) / 1000);
      const predictedTime = this.lastKnownSongTime + elapsedSec * this.mapTimeMultiplier;
      this.dom.renderProgress(predictedTime, this.duration);
      this.progressRafId = requestAnimationFrame(tick);
    };

    this.progressRafId = requestAnimationFrame(tick);
  }

  private stopProgressLoop(): void {
    if (this.progressRafId !== null) {
      cancelAnimationFrame(this.progressRafId);
      this.progressRafId = null;
    }
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private normalizeCharacteristic(value: string): string {
    return String(value ?? '').toLowerCase().replace(/\s+/g, '');
  }

  private getCharacteristicIconSvg(characteristic: string): string {
    const normalized = this.normalizeCharacteristic(characteristic);
    const icons: Record<string, string> = {
      standard: '<svg class="difficulty-char-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13L7 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9 7L13 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M2.4 13.6l1.3-1.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M12.3 3.7l1.3-1.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M3 3l10 10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M2.3 2.3l1.5 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M12.2 12.2l1.5 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
      onesaber: '<svg class="difficulty-char-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13L13 3" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M2.2 13.8l1.5-1.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12.3 3.7l1.5-1.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
      lawless: '<svg class="difficulty-char-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.2 6.3c0-.8.6-1.5 1.4-1.5.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8.8 0 1.4.7 1.4 1.5 0 .5-.2.9-.6 1.2v1c0 1.9-1.6 3.5-3.6 3.5S4.8 10.4 4.8 8.5v-1c-.4-.3-.6-.7-.6-1.2Z" fill="currentColor"/><circle cx="6.5" cy="7.5" r="0.8" fill="#0b0b10"/><circle cx="9.5" cy="7.5" r="0.8" fill="#0b0b10"/><path d="M7.1 9.5 8 10.4l.9-.9" stroke="#0b0b10" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };

    return icons[normalized] || '';
  }

  private formatCharacteristicBadge(characteristic: string): string {
    const icon = this.getCharacteristicIconSvg(characteristic);
    return icon || `<span class="difficulty-text">${this.escapeHtml(characteristic)}</span>`;
  }

  private formatDifficultyLabel(difficulty: string): string {
    return String(difficulty ?? '')
      .replace(/^ExpertPlus$/i, 'Expert+')
      .replace(/^Expert Plus$/i, 'Expert+');
  }

  private formatDifficultyDisplay(characteristic: string, difficulty: string): string {
    const safeDifficulty = this.escapeHtml(this.formatDifficultyLabel(difficulty));
    const characteristicPart = this.formatCharacteristicBadge(characteristic);
    return `<span class="difficulty-badge" title="${this.escapeHtml(characteristic)} ${safeDifficulty}">${characteristicPart}<span class="difficulty-text">${safeDifficulty}</span></span>`;
  }

  private getGrade(acc: number): { grade: string; color: string } {
    let grade = 'E';
    if (acc >= 0.9) grade = 'SS';
    else if (acc >= 0.8) grade = 'S';
    else if (acc >= 0.65) grade = 'A';
    else if (acc >= 0.5) grade = 'B';
    else if (acc >= 0.35) grade = 'C';
    else if (acc >= 0.2) grade = 'D';

    let color = '#e0e0e0';
    if (acc >= 0.95) color = '#b046ff';
    else if (acc >= 0.9) color = '#ff3b3b';
    else if (acc >= 0.85) color = '#ff9800';
    else if (acc >= 0.8) color = '#00e5ff';
    else if (acc >= 0.7) color = '#39ff14';

    return { grade, color };
  }

  private getDifficultyStyle(diff: string): { color: string; shadow: string } {
    const value = String(diff || '').toLowerCase();
    if (value.includes('easy')) return { color: '#3cb371', shadow: 'rgba(60, 179, 113, 0.5)' };
    if (value.includes('normal')) return { color: '#59b0f4', shadow: 'rgba(89, 176, 244, 0.5)' };
    if (value.includes('hard')) return { color: '#ff9800', shadow: 'rgba(255, 152, 0, 0.5)' };
    if (value.includes('expert+') || value.includes('expertplus')) return { color: '#8f48db', shadow: 'rgba(143, 72, 219, 0.5)' };
    if (value.includes('expert')) return { color: '#e53935', shadow: 'rgba(229, 57, 53, 0.5)' };
    return { color: '#fff', shadow: 'rgba(255, 255, 255, 0.5)' };
  }

  private describeError(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string' && error) {
      return error;
    }

    return 'Unknown error';
  }
}
