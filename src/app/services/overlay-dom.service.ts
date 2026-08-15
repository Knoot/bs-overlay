import { Injectable } from '@angular/core';
import { PLACEHOLDER_COVER } from '../constants/overlay.constants';
import {
  BeatleaderMapRatings,
  BeatleaderPlayerOverlayDetails,
  Lang,
  OverlayConfig,
  OverlayProfileNeighborState,
  PlayerCandidate,
  ViewMode
} from '../models/overlay.models';
import { OverlayConfigService } from './overlay-config.service';
import { OverlayStateService } from './overlay-state.service';

@Injectable({ providedIn: 'root' })
export class OverlayDomService {
  private layoutRafId: number | null = null;
  private blPlayer: PlayerCandidate | null = null;
  private blDetails: BeatleaderPlayerOverlayDetails = this.getEmptyBeatleaderDetails();
  private blStatusText = 'Loading...';
  private ssPlayer: PlayerCandidate | null = null;
  private ssStatusText = 'Loading...';

  constructor(
    private readonly configService: OverlayConfigService,
    private readonly state: OverlayStateService
  ) {}

  setupInitialView(): void {
    this.state.patchUi({ appVisible: false });
    this.state.resetSong(this.configService.getText(this.configService.getConfig().lang, 'waitingSong'), PLACEHOLDER_COVER);
  }

  applyLanguage(config: OverlayConfig): void {
    const translations = this.configService.getTranslations(config.lang);
    const currentSong = this.state.song();
    const isDefaultTitle =
      currentSong.title === this.configService.getText('en', 'waitingSong') ||
      currentSong.title === this.configService.getText('ru', 'waitingSong') ||
      currentSong.title === 'Waiting for song...';

    const currentProfile = this.state.profile();
    const isDefaultLoading =
      currentProfile.name === this.configService.getText('en', 'loading') ||
      currentProfile.name === this.configService.getText('ru', 'loading') ||
      currentProfile.name === 'Loading...';

    if (isDefaultTitle) {
      this.state.patchSong({ title: translations['waitingSong'] });
    }
    if (isDefaultLoading) {
      this.blStatusText = translations['loading'];
      this.ssStatusText = translations['loading'];
    }
    this.refreshRankProfile(config);
    document.documentElement.lang = config.lang;
  }

  applyTheme(config: OverlayConfig): void {
    this.state.patchUi({ theme: config.theme });
    document.documentElement.dataset['theme'] = config.theme;
  }

  applyLayout(config: OverlayConfig): void {
    this.applyLayoutNow(config);

    if (this.layoutRafId !== null) {
      cancelAnimationFrame(this.layoutRafId);
      this.layoutRafId = null;
    }

    if (this.getVerticalAlignment(config.layout) !== 'middle') {
      return;
    }

    this.layoutRafId = requestAnimationFrame(() => {
      this.applyLayoutNow(config);
      this.layoutRafId = null;
    });
  }

  private applyLayoutNow(config: OverlayConfig): void {
    const horizontal = this.getHorizontalAlignment(config.layout);
    const vertical = this.getVerticalAlignment(config.layout);
    const translateX = horizontal === 'center' ? '-50%' : '0';
    const translateY = '0';
    const transformParts = [`translate(${translateX}, ${translateY})`, `scale(${config.scale})`];
    const middleTop = this.getMiddleAnchorTop(config);

    const alignItems = horizontal === 'right' ? 'flex-end' : horizontal === 'center' ? 'center' : 'flex-start';
    const textAlign = horizontal === 'right' ? 'right' : horizontal === 'center' ? 'center' : 'left';
    const originY = vertical === 'middle' ? 'center' : vertical;

    this.state.patchUi({
      appTransformOrigin: `${horizontal} ${vertical === 'middle' ? 'center' : vertical}`,
      appTransform: transformParts.join(' '),
      appTop: vertical === 'top' ? '20px' : vertical === 'middle' ? middleTop : 'auto',
      appBottom: vertical === 'bottom' ? '20px' : 'auto',
      appLeft: horizontal === 'left' ? '20px' : horizontal === 'center' ? '50%' : 'auto',
      appRight: horizontal === 'right' ? '20px' : 'auto',
      appAlignItems: alignItems,
      playingFlexDirection: vertical === 'bottom' ? 'column-reverse' : 'column',
      playingTop: vertical === 'bottom' ? 'auto' : '0',
      playingBottom: vertical === 'bottom' ? '0' : 'auto',
      playingAlignItems: alignItems,
      menuTop: vertical === 'bottom' ? 'auto' : '0',
      menuBottom: vertical === 'bottom' ? '0' : 'auto',
      menuTransform: `scale(${config.profileScale})`,
      menuTransformOrigin: `${horizontal} ${originY}`,
      headerFlexDirection: horizontal === 'right' ? 'row-reverse' : 'row',
      textBlockAlignItems: alignItems,
      textBlockTextAlign: textAlign,
      statsRowJustifyContent: alignItems,
      bottomStatsAlignItems: alignItems,
      bottomStatRowFlexDirection: horizontal === 'right' ? 'row-reverse' : 'row',
      rankWrapperFlexDirection: horizontal === 'right' ? 'row-reverse' : 'row',
      rankInfoAlignItems: alignItems,
      rankInfoTextAlign: textAlign,
      bsrJustifyContent: alignItems
    });
  }

  applyModules(config: OverlayConfig): void {
    this.state.setPpPredictorEnabled(config.showPpPredictor);
    this.state.applyMapRatingSettings({ showMapRatings: config.showMapRatings, showSSStars: config.showSSStars });
    this.state.patchUi({
      coverDisplay: config.showCover ? 'flex' : 'none',
      titleDisplay: config.showTitle ? '' : 'none',
      artistDisplay: config.showArtist ? '' : 'none',
      metaDisplay: config.showMeta ? '' : 'none',
      bsrDisplay: config.showBsr ? '' : 'none',
      statsRowDisplay: config.showProgress ? 'flex' : 'none',
      hpDisplay: config.showHp ? 'flex' : 'none',
      bottomStatRowDisplay: config.showStats ? 'flex' : 'none',
      accDisplay: config.showAcc ? 'flex' : 'none',
      bottomStatsDisplay: config.showStats || config.showAcc ? 'flex' : 'none'
    });

    this.updateTextBlockVisibility(config);
    this.refreshRankProfile(config);
  }

  applyGlow(config: OverlayConfig): void {
    this.state.patchUi({
      avatarGlow: config.glowAvatar !== false,
      coverGlow: config.glowAvatar !== false
    });
  }

  applyPanelBackgrounds(config: OverlayConfig): void {
    this.state.patchUi({
      profileBackgroundEnabled: config.showBLBg !== false,
      topPanelNoBackground: config.showMapBg === false
    });
  }

  setAppVisible(visible: boolean): void {
    this.state.patchUi({ appVisible: visible });
  }

  cancelPendingLayout(): void {
    if (this.layoutRafId === null) {
      return;
    }

    cancelAnimationFrame(this.layoutRafId);
    this.layoutRafId = null;
  }

  resetGameOverlay(lang: Lang): void {
    this.state.resetScore();
    this.state.resetProgress();
    this.state.resetSong(this.configService.getText(lang, 'waitingSong'), PLACEHOLDER_COVER);
    this.resetMapRatings();
    this.resetSSStars();
    this.resetPpPredictor();
  }

  setViewMode(mode: ViewMode, showBL: boolean): void {
    if (mode === 'playing') {
      this.state.patchUi({ menuActive: false, playingActive: true });
      return;
    }

    this.state.patchUi({ playingActive: false, menuActive: showBL });
  }

  resetBLDisplay(lang: Lang, messageKey: string = 'loading'): void {
    this.blPlayer = null;
    this.blDetails = this.getEmptyBeatleaderDetails();
    this.blStatusText = this.configService.getText(lang, messageKey);
    this.refreshRankProfile(this.configService.getConfig());
  }

  renderBLPlayer(player: PlayerCandidate, details: BeatleaderPlayerOverlayDetails, config: OverlayConfig): void {
    this.blPlayer = player;
    this.blDetails = this.mergeBeatleaderDetails(details, this.blDetails);
    this.blStatusText = player.name || 'Unknown';
    this.refreshRankProfile(config);
  }

  getBeatleaderPlayer(): PlayerCandidate | null {
    return this.blPlayer ? { ...this.blPlayer } : null;
  }

  renderBLDetails(details: BeatleaderPlayerOverlayDetails, config: OverlayConfig): void {
    this.blDetails = this.mergeBeatleaderDetails(details, this.blDetails);
    this.refreshRankProfile(config);
  }

  hasBeatleaderNextGlobal(): boolean {
    return this.blDetails.global.status === 'ready';
  }

  hasBeatleaderNextRegion(): boolean {
    return this.blDetails.region.status === 'ready';
  }

  resetSSDisplay(lang: Lang, messageKey: string = 'loading'): void {
    this.ssPlayer = null;
    this.ssStatusText = this.configService.getText(lang, messageKey);
    this.refreshRankProfile(this.configService.getConfig());
  }

  renderSSPlayer(player: PlayerCandidate): void {
    this.ssPlayer = player;
    this.ssStatusText = player.name || 'Unknown';
    this.refreshRankProfile(this.configService.getConfig());
  }

  renderProgress(timeSec: number, duration: number): void {
    if (!(duration > 0)) return;

    const safeTime = Math.max(0, Math.min(timeSec, duration));
    this.state.setProgress(safeTime, duration);
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
    this.state.patchSong({
      title: params.title,
      artist: params.artist,
      difficultyHtml: params.difficultyHtml,
      diffColor: params.diffColor,
      diffShadow: params.diffShadow,
      bpm: params.bpm,
      coverSrc: params.coverSrc
    });
  }

  updateBsrLine(keyText: string, dateText: string): void {
    this.state.patchSong({
      bsrText: keyText,
      mapDateText: dateText
    });
  }

  resetMapRatings(): void {
    const config = this.configService.getConfig();
    this.state.resetBeatleaderMapRatings({ showMapRatings: config.showMapRatings, showSSStars: config.showSSStars });
    this.updateTextBlockVisibility(config);
  }

  setMapRatingsUnavailable(): void {
    const config = this.configService.getConfig();
    this.state.setBeatleaderMapRatingsUnavailable({ showMapRatings: config.showMapRatings, showSSStars: config.showSSStars });
    this.updateTextBlockVisibility(config);
  }

  renderMapRatings(ratings: BeatleaderMapRatings, config: OverlayConfig): void {
    const hasAnyRating =
      typeof ratings.stars === 'number' ||
      typeof ratings.tech === 'number' ||
      typeof ratings.acc === 'number' ||
      typeof ratings.pass === 'number';
    const hasCompleteBreakdown =
      typeof ratings.tech === 'number' &&
      Number.isFinite(ratings.tech) &&
      typeof ratings.acc === 'number' &&
      Number.isFinite(ratings.acc) &&
      typeof ratings.pass === 'number' &&
      Number.isFinite(ratings.pass);

    if (!hasAnyRating) {
      this.setMapRatingsUnavailable();
      return;
    }

    this.state.setBeatleaderMapRatings(
      {
        ...ratings,
        tech: hasCompleteBreakdown ? ratings.tech : null,
        acc: hasCompleteBreakdown ? ratings.acc : null,
        pass: hasCompleteBreakdown ? ratings.pass : null
      },
      { showMapRatings: config.showMapRatings, showSSStars: config.showSSStars }
    );
    this.updateTextBlockVisibility(config);
  }

  resetSSStars(): void {
    const config = this.configService.getConfig();
    this.state.resetScoreSaberStars({ showMapRatings: config.showMapRatings, showSSStars: config.showSSStars });
    this.updateTextBlockVisibility(config);
  }

  setSSStarsUnavailable(): void {
    const config = this.configService.getConfig();
    this.state.setScoreSaberStarsUnavailable({ showMapRatings: config.showMapRatings, showSSStars: config.showSSStars });
    this.updateTextBlockVisibility(config);
  }

  renderSSStars(stars: number, config: OverlayConfig): void {
    if (!(stars > 0)) {
      this.setSSStarsUnavailable();
      return;
    }

    this.state.setScoreSaberStars(stars, { showMapRatings: config.showMapRatings, showSSStars: config.showSSStars });
    this.updateTextBlockVisibility(config);
  }

  resetPpPredictor(): void {
    this.state.resetPpPredictor();
    this.updateTextBlockVisibility(this.configService.getConfig());
  }

  renderPpPredictor(values: { beatleader: number | null; scoresaber: number | null }, config: OverlayConfig): void {
    this.state.setPpPredictor(values, config.showPpPredictor);
    this.updateTextBlockVisibility(config);
  }

  updateAccuracy(accuracy: number, grade: string, color: string): void {
    this.state.patchScore({ accuracy, grade, gradeColor: color });
  }

  updateCombo(combo: number): void {
    this.state.patchScore({ combo });
  }

  updateMiss(missCount: number): void {
    this.state.patchScore({ hasMissCount: true, missCount });
  }

  updateHealth(currentHealth: number): void {
    this.state.patchScore({ currentHealth });
  }

  setDefaultTime(): void {
    this.state.resetProgress();
  }

  private updateTextBlockVisibility(config: OverlayConfig): boolean {
    const showAnyText =
      config.showTitle ||
      config.showArtist ||
      config.showMeta ||
      config.showBsr ||
      this.state.mapRatings().visible ||
      this.state.ppPredictor().visible;
    const showHeader = config.showCover || showAnyText;
    const showTopPanel = showHeader || config.showProgress;

    this.state.patchUi({
      textBlockDisplay: showAnyText ? 'flex' : 'none',
      headerDisplay: showHeader ? 'flex' : 'none',
      topPanelDisplay: showTopPanel ? 'flex' : 'none'
    });
    return showAnyText;
  }

  private refreshRankProfile(config: OverlayConfig): void {
    const hasBL = config.showBL;
    const hasSS = config.showSS;
    const hasAnyService = hasBL || hasSS;

    const selectedName = this.pickPreferredSource(config.nameSource, hasBL, hasSS);
    const selectedAvatar = this.pickPreferredSource(config.avatarSource, hasBL, hasSS);
    const avatarSrc = this.getAvatarSource(selectedAvatar);

    this.state.setProfile({
      visible: hasAnyService,
      name: this.getStatusText(selectedName),
      avatarSrc,
      avatarVisible: !!avatarSrc,
      beatleader: {
        visible: hasBL,
        globalRankText: this.formatRankValue(this.blPlayer?.rank, '#--'),
        localRankText: this.formatLocalValue(this.blPlayer),
        pp: this.toFiniteNumberOrNull(this.blPlayer?.pp)
      },
      scoresaber: {
        visible: hasSS,
        globalRankText: this.formatRankValue(this.ssPlayer?.rank, '#--'),
        localRankText: this.formatLocalValue(this.ssPlayer),
        pp: this.toFiniteNumberOrNull(this.ssPlayer?.pp)
      },
      showNextGlobal: hasBL && config.showBLNextGlobal,
      showNextRegion: hasBL && config.showBLNextRegion,
      nextGlobal: this.toBeatLeaderNeighborState(this.blDetails.global),
      nextRegion: this.toBeatLeaderNeighborState(this.blDetails.region)
    });
  }

  private pickPreferredSource(
    preferred: OverlayConfig['nameSource'] | OverlayConfig['avatarSource'],
    hasBL: boolean,
    hasSS: boolean
  ): 'beatleader' | 'scoresaber' | null {
    if (preferred === 'scoresaber' && hasSS) {
      return 'scoresaber';
    }

    if (preferred === 'beatleader' && hasBL) {
      return 'beatleader';
    }

    if (hasBL) {
      return 'beatleader';
    }

    if (hasSS) {
      return 'scoresaber';
    }

    return null;
  }

  private getStatusText(source: 'beatleader' | 'scoresaber' | null): string {
    if (source === 'scoresaber') {
      return this.ssPlayer?.name || this.ssStatusText;
    }

    if (source === 'beatleader') {
      return this.blPlayer?.name || this.blStatusText;
    }

    return this.configService.getText(this.configService.getConfig().lang, 'loading');
  }

  private getAvatarSource(source: 'beatleader' | 'scoresaber' | null): string {
    if (source === 'scoresaber') {
      return this.ssPlayer?.avatar || '';
    }

    if (source === 'beatleader') {
      return this.blPlayer?.avatar || '';
    }

    return '';
  }

  private formatRankValue(value: number | undefined, fallback: string): string {
    return typeof value === 'number' ? `#${value.toLocaleString()}` : fallback;
  }

  private formatLocalValue(player: PlayerCandidate | null): string {
    return player?.countryRank ? `#${player.countryRank.toLocaleString()} (${player.country || 'N/A'})` : '#-- (N/A)';
  }

  private toFiniteNumberOrNull(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private toBeatLeaderNeighborState(info: BeatleaderPlayerOverlayDetails['global']): OverlayProfileNeighborState {
    const text = this.formatBeatLeaderNeighbor(info);

    if (info.status !== 'ready' || !info.value.name) {
      return {
        text,
        name: '',
        ppText: '',
        hasPp: false,
        isReady: false
      };
    }

    return {
      text,
      name: info.value.name,
      ppText: typeof info.value.ppDelta === 'number' ? this.formatBeatLeaderNeighborPp(info.value.ppDelta) : '',
      hasPp: typeof info.value.ppDelta === 'number',
      isReady: true
    };
  }

  private formatBeatLeaderNeighbor(info: BeatleaderPlayerOverlayDetails['global']): string {
    if (info.status === 'failed') {
      return '--';
    }

    if (info.status !== 'ready' || !info.value.name) {
      return 'N/A';
    }

    if (typeof info.value.ppDelta !== 'number') {
      return info.value.name;
    }

    return `${this.formatBeatLeaderNeighborPp(info.value.ppDelta)} • ${info.value.name}`;
  }

  private formatBeatLeaderNeighborPp(ppDelta: number): string {
    const ppText = ppDelta.toLocaleString(undefined, {
      minimumFractionDigits: ppDelta >= 100 ? 0 : 2,
      maximumFractionDigits: ppDelta >= 100 ? 0 : 2
    });

    return `+${ppText} pp`;
  }

  private mergeBeatleaderDetails(
    next: BeatleaderPlayerOverlayDetails,
    previous: BeatleaderPlayerOverlayDetails
  ): BeatleaderPlayerOverlayDetails {
    return {
      global: this.mergeBeatleaderDetail(next.global, previous.global),
      region: this.mergeBeatleaderDetail(next.region, previous.region),
      friends: this.mergeBeatleaderDetail(next.friends, previous.friends)
    };
  }

  private mergeBeatleaderDetail(
    next: BeatleaderPlayerOverlayDetails['global'],
    previous: BeatleaderPlayerOverlayDetails['global']
  ): BeatleaderPlayerOverlayDetails['global'] {
    if (next.status === 'ready') {
      return next;
    }

    return previous.status === 'ready' ? previous : next;
  }

  private getEmptyBeatleaderDetails(): BeatleaderPlayerOverlayDetails {
    return {
      global: { status: 'empty' },
      region: { status: 'empty' },
      friends: { status: 'empty' }
    };
  }

  private getHorizontalAlignment(layout: OverlayConfig['layout']): 'left' | 'center' | 'right' {
    if (layout.endsWith('left')) {
      return 'left';
    }

    if (layout.endsWith('right')) {
      return 'right';
    }

    return 'center';
  }

  private getVerticalAlignment(layout: OverlayConfig['layout']): 'top' | 'middle' | 'bottom' {
    if (layout.startsWith('top')) {
      return 'top';
    }

    if (layout.startsWith('bottom')) {
      return 'bottom';
    }

    return 'middle';
  }

  private getMiddleAnchorTop(config: OverlayConfig): string {
    const referenceHeight = this.getReferenceOverlayHeight(config);
    const scaledHalfHeight = (referenceHeight * config.scale) / 2;
    return `calc(50% - ${scaledHalfHeight}px)`;
  }

  private getReferenceOverlayHeight(config: OverlayConfig): number {
    const playingOverlay = document.getElementById('playing-overlay');
    const menuOverlay = document.getElementById('menu-overlay');

    if (!playingOverlay || !menuOverlay) {
      return 0;
    }

    if (this.state.ui().playingActive) {
      return playingOverlay.offsetHeight;
    }

    if (this.state.ui().menuActive) {
      return menuOverlay.offsetHeight * config.profileScale;
    }

    return Math.max(playingOverlay.offsetHeight, menuOverlay.offsetHeight * config.profileScale);
  }
}
