import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import {
  BeatleaderMapRatings,
  OverlayMapRatingsState,
  OverlayProfileNeighborState,
  OverlayProfileState,
  OverlayPpPredictorState,
  OverlayProgressState,
  OverlayScoreState,
  OverlayConfig,
  OverlaySettingsState,
  OverlaySongState,
  OverlayUiState,
  OverlayViewModel
} from '../models/overlay.models';
import { DEFAULT_CONFIG, PLACEHOLDER_COVER } from '../constants/overlay.constants';

const DEFAULT_SCORE_STATE: OverlayScoreState = {
  hasMissCount: false,
  accuracy: 0,
  combo: 0,
  missCount: 0,
  currentHealth: 1,
  grade: 'E',
  gradeColor: '#e0e0e0'
};

const DEFAULT_PROGRESS_STATE: OverlayProgressState = {
  currentTime: 0,
  duration: 0
};

const DEFAULT_PP_PREDICTOR_STATE: OverlayPpPredictorState = {
  visible: false,
  beatleader: null,
  scoresaber: null
};

const DEFAULT_SONG_STATE: OverlaySongState = {
  title: 'Waiting for song...',
  artist: '-',
  difficultyHtml: '-',
  diffColor: '',
  diffShadow: '',
  bpm: null,
  coverSrc: PLACEHOLDER_COVER,
  bsrText: 'BSR: -',
  mapDateText: ''
};

const DEFAULT_MAP_RATINGS_STATE: OverlayMapRatingsState = {
  blState: 'empty',
  ssState: 'empty',
  showBl: false,
  showSs: false,
  visible: false,
  showBlBreakdown: false,
  showTotalRow: false,
  blStars: null,
  blTech: null,
  blAcc: null,
  blPass: null,
  ssStars: null
};

const DEFAULT_PROFILE_NEIGHBOR_STATE: OverlayProfileNeighborState = {
  text: '--',
  name: '',
  ppText: '',
  hasPp: false,
  isReady: false
};

const DEFAULT_PROFILE_STATE: OverlayProfileState = {
  visible: false,
  name: 'Loading...',
  avatarSrc: '',
  avatarVisible: false,
  beatleader: {
    visible: false,
    globalRankText: '#--',
    localRankText: '#-- (N/A)',
    pp: null
  },
  scoresaber: {
    visible: false,
    globalRankText: '#--',
    localRankText: '#-- (N/A)',
    pp: null
  },
  showNextGlobal: false,
  showNextRegion: false,
  nextGlobal: { ...DEFAULT_PROFILE_NEIGHBOR_STATE },
  nextRegion: { ...DEFAULT_PROFILE_NEIGHBOR_STATE }
};

const DEFAULT_UI_STATE: OverlayUiState = {
  theme: 'cyberpunk',
  appVisible: false,
  appTransform: '',
  appTransformOrigin: '',
  appTop: '',
  appBottom: '',
  appLeft: '',
  appRight: '',
  appAlignItems: 'flex-start',
  playingActive: false,
  playingFlexDirection: 'column',
  playingTop: '0',
  playingBottom: 'auto',
  playingAlignItems: 'flex-start',
  menuActive: false,
  menuTop: '0',
  menuBottom: 'auto',
  menuTransform: '',
  menuTransformOrigin: '',
  headerDisplay: 'flex',
  headerFlexDirection: 'row',
  textBlockDisplay: 'flex',
  textBlockAlignItems: 'flex-start',
  textBlockTextAlign: 'left',
  statsRowDisplay: 'flex',
  statsRowJustifyContent: 'flex-start',
  topPanelDisplay: 'flex',
  topPanelNoBackground: false,
  hpDisplay: 'flex',
  bottomStatsDisplay: 'flex',
  bottomStatsAlignItems: 'flex-start',
  bottomStatRowDisplay: 'flex',
  bottomStatRowFlexDirection: 'row',
  accDisplay: 'flex',
  rankWrapperFlexDirection: 'row',
  rankInfoAlignItems: 'flex-start',
  rankInfoTextAlign: 'left',
  coverDisplay: 'flex',
  coverGlow: true,
  avatarGlow: true,
  profileBackgroundEnabled: true,
  titleDisplay: '',
  artistDisplay: '',
  metaDisplay: '',
  bsrDisplay: '',
  bsrJustifyContent: 'flex-start'
};

const DEFAULT_SETTINGS_STATE: OverlaySettingsState = {
  visible: false,
  config: { ...DEFAULT_CONFIG }
};

@Injectable({ providedIn: 'root' })
export class OverlayStateService {
  private readonly zone = inject(NgZone);

  private readonly scoreState = signal<OverlayScoreState>({ ...DEFAULT_SCORE_STATE });
  private readonly progressState = signal<OverlayProgressState>({ ...DEFAULT_PROGRESS_STATE });
  private readonly ppPredictorState = signal<OverlayPpPredictorState>({ ...DEFAULT_PP_PREDICTOR_STATE });
  private readonly songState = signal<OverlaySongState>({ ...DEFAULT_SONG_STATE });
  private readonly mapRatingsState = signal<OverlayMapRatingsState>({ ...DEFAULT_MAP_RATINGS_STATE });
  private readonly profileState = signal<OverlayProfileState>({ ...DEFAULT_PROFILE_STATE });
  private readonly uiState = signal<OverlayUiState>({ ...DEFAULT_UI_STATE });
  private readonly settingsState = signal<OverlaySettingsState>({ ...DEFAULT_SETTINGS_STATE });

  readonly score = this.scoreState.asReadonly();
  readonly progress = this.progressState.asReadonly();
  readonly ppPredictor = this.ppPredictorState.asReadonly();
  readonly song = this.songState.asReadonly();
  readonly mapRatings = this.mapRatingsState.asReadonly();
  readonly profile = this.profileState.asReadonly();
  readonly ui = this.uiState.asReadonly();
  readonly settings = this.settingsState.asReadonly();
  readonly viewModel = computed<OverlayViewModel>(() => ({
    score: this.score(),
    progress: this.progress(),
    ppPredictor: this.ppPredictor(),
    song: this.song(),
    mapRatings: this.mapRatings(),
    profile: this.profile(),
    ui: this.ui(),
    settings: this.settings()
  }));

  resetScore(): void {
    this.updateInAngular(() => {
      this.scoreState.set({ ...DEFAULT_SCORE_STATE });
    });
  }

  patchScore(partial: Partial<OverlayScoreState>): void {
    this.updateInAngular(() => {
      this.scoreState.update((current) => ({ ...current, ...partial }));
    });
  }

  resetProgress(): void {
    this.updateInAngular(() => {
      this.progressState.set({ ...DEFAULT_PROGRESS_STATE });
    });
  }

  setProgress(currentTime: number, duration: number): void {
    this.updateInAngular(() => {
      this.progressState.set({
        currentTime: Math.max(0, Number(currentTime) || 0),
        duration: Math.max(0, Number(duration) || 0)
      });
    });
  }

  resetPpPredictor(): void {
    this.updateInAngular(() => {
      this.ppPredictorState.set({ ...DEFAULT_PP_PREDICTOR_STATE });
    });
  }

  setPpPredictor(values: { beatleader: number | null; scoresaber: number | null }, enabled: boolean): void {
    const beatleader = this.toFiniteNumberOrNull(values.beatleader);
    const scoresaber = this.toFiniteNumberOrNull(values.scoresaber);
    this.updateInAngular(() => {
      this.ppPredictorState.set({
        visible: enabled && (beatleader !== null || scoresaber !== null),
        beatleader,
        scoresaber
      });
    });
  }

  setPpPredictorEnabled(enabled: boolean): void {
    this.updateInAngular(() => {
      this.ppPredictorState.update((current) => ({
        ...current,
        visible: enabled && (current.beatleader !== null || current.scoresaber !== null)
      }));
    });
  }

  resetSong(waitingSong: string, coverSrc: string): void {
    this.updateInAngular(() => {
      this.songState.set({
        ...DEFAULT_SONG_STATE,
        title: waitingSong,
        coverSrc
      });
    });
  }

  patchSong(partial: Partial<OverlaySongState>): void {
    this.updateInAngular(() => {
      this.songState.update((current) => ({ ...current, ...partial }));
    });
  }

  setProfile(profile: OverlayProfileState): void {
    this.updateInAngular(() => {
      this.profileState.set(profile);
    });
  }

  patchUi(partial: Partial<OverlayUiState>): void {
    this.updateInAngular(() => {
      this.uiState.update((current) => ({ ...current, ...partial }));
    });
  }

  setSettingsConfig(config: OverlayConfig): void {
    this.updateInAngular(() => {
      this.settingsState.update((current) => ({
        ...current,
        config: { ...config }
      }));
    });
  }

  setSettingsVisible(visible: boolean): void {
    this.updateInAngular(() => {
      this.settingsState.update((current) => ({ ...current, visible }));
    });
  }

  toggleSettingsVisible(): void {
    this.updateInAngular(() => {
      this.settingsState.update((current) => ({ ...current, visible: !current.visible }));
    });
  }

  applyMapRatingSettings(settings: { showMapRatings: boolean; showSSStars: boolean }): void {
    this.updateInAngular(() => {
      this.mapRatingsState.update((current) => this.resolveMapRatingsVisibility(current, settings));
    });
  }

  resetBeatleaderMapRatings(settings: { showMapRatings: boolean; showSSStars: boolean }): void {
    this.updateInAngular(() => {
      this.mapRatingsState.update((current) =>
        this.resolveMapRatingsVisibility(
          {
            ...current,
            blState: 'empty',
            blStars: null,
            blTech: null,
            blAcc: null,
            blPass: null
          },
          settings
        )
      );
    });
  }

  setBeatleaderMapRatingsUnavailable(settings: { showMapRatings: boolean; showSSStars: boolean }): void {
    this.updateInAngular(() => {
      this.mapRatingsState.update((current) =>
        this.resolveMapRatingsVisibility(
          {
            ...current,
            blState: 'missing',
            blStars: null,
            blTech: null,
            blAcc: null,
            blPass: null
          },
          settings
        )
      );
    });
  }

  setBeatleaderMapRatings(ratings: BeatleaderMapRatings, settings: { showMapRatings: boolean; showSSStars: boolean }): void {
    this.updateInAngular(() => {
      this.mapRatingsState.update((current) =>
        this.resolveMapRatingsVisibility(
          {
            ...current,
            blState: 'ready',
            blStars: this.toFiniteNumberOrNull(ratings.stars),
            blTech: this.toFiniteNumberOrNull(ratings.tech),
            blAcc: this.toFiniteNumberOrNull(ratings.acc),
            blPass: this.toFiniteNumberOrNull(ratings.pass)
          },
          settings
        )
      );
    });
  }

  resetScoreSaberStars(settings: { showMapRatings: boolean; showSSStars: boolean }): void {
    this.updateInAngular(() => {
      this.mapRatingsState.update((current) =>
        this.resolveMapRatingsVisibility(
          {
            ...current,
            ssState: 'empty',
            ssStars: null
          },
          settings
        )
      );
    });
  }

  setScoreSaberStarsUnavailable(settings: { showMapRatings: boolean; showSSStars: boolean }): void {
    this.updateInAngular(() => {
      this.mapRatingsState.update((current) =>
        this.resolveMapRatingsVisibility(
          {
            ...current,
            ssState: 'missing',
            ssStars: null
          },
          settings
        )
      );
    });
  }

  setScoreSaberStars(stars: number, settings: { showMapRatings: boolean; showSSStars: boolean }): void {
    this.updateInAngular(() => {
      this.mapRatingsState.update((current) =>
        this.resolveMapRatingsVisibility(
          {
            ...current,
            ssState: 'ready',
            ssStars: this.toFiniteNumberOrNull(stars)
          },
          settings
        )
      );
    });
  }

  private updateInAngular(action: () => void): void {
    if (NgZone.isInAngularZone()) {
      action();
      return;
    }

    this.zone.run(action);
  }

  private toFiniteNumberOrNull(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private resolveMapRatingsVisibility(
    state: OverlayMapRatingsState,
    settings: { showMapRatings: boolean; showSSStars: boolean }
  ): OverlayMapRatingsState {
    const showBl = settings.showMapRatings && state.blState === 'ready';
    const showSs = settings.showSSStars && state.ssState === 'ready';
    const showBlBreakdown =
      showBl &&
      state.blTech !== null &&
      state.blAcc !== null &&
      state.blPass !== null;

    return {
      ...state,
      showBl,
      showSs,
      visible: showBl || showSs,
      showBlBreakdown,
      showTotalRow: showBl || showSs
    };
  }
}
