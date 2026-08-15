export type Lang = 'en' | 'ru';
export type Theme = 'cyberpunk' | 'sunset';
export type Layout =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
export type ViewMode = 'menu' | 'playing';
export type RankIdentitySource = 'beatleader' | 'scoresaber';
export type BeatleaderProfileRefreshStrategy = 'score' | 'interval';
export type GameDataSource = 'bs-plus' | 'data-puller';

export interface OverlayConfig {
  lang: Lang;
  theme: Theme;
  gameDataSource: GameDataSource;
  customProxy: string;
  layout: Layout;
  scale: number;
  profileScale: number;
  blId: string;
  ssId: string;
  nameSource: RankIdentitySource;
  avatarSource: RankIdentitySource;
  resolvedBlId: string;
  resolvedBlQuery: string;
  resolvedSsId: string;
  resolvedSsQuery: string;
  blProfileRefreshStrategy: BeatleaderProfileRefreshStrategy;
  blProfileRefreshMinutes: number;
  ssProfileRefreshMinutes: number;
  showBL: boolean;
  showSS: boolean;
  showBLNextGlobal: boolean;
  showBLNextRegion: boolean;
  showBLNextFriends: boolean;
  showDebugUI: boolean;
  showProfileAlways: boolean;
  glowAvatar: boolean;
  showCover: boolean;
  showTitle: boolean;
  showArtist: boolean;
  showMeta: boolean;
  showBsr: boolean;
  showMapRatings: boolean;
  showSSStars: boolean;
  showPpPredictor: boolean;
  showProgress: boolean;
  showHp: boolean;
  showStats: boolean;
  showAcc: boolean;
  showMapBg: boolean;
  showBLBg: boolean;
}

export interface PlayerCandidate {
  id?: string | number;
  name?: string;
  rank?: number;
  countryRank?: number;
  country?: string;
  pp?: number;
  avatar?: string;
}

export interface BeatleaderNextPlayerInfo {
  name: string;
  ppDelta: number | null;
}

export type BeatleaderNextPlayerState =
  | { status: 'ready'; value: BeatleaderNextPlayerInfo }
  | { status: 'empty' }
  | { status: 'failed' };

export interface BeatleaderPlayerOverlayDetails {
  global: BeatleaderNextPlayerState;
  region: BeatleaderNextPlayerState;
  friends: BeatleaderNextPlayerState;
}

export interface BeatleaderMapRatings {
  stars: number | null;
  tech: number | null;
  acc: number | null;
  pass: number | null;
}

export interface BeatleaderOverlayRequestOptions {
  includeGlobal: boolean;
  includeRegion: boolean;
  includeFriends: boolean;
}

export interface BeatleaderPlayerResponse {
  data?: PlayerCandidate[];
}

export interface BeatleaderPlayersSearchResponse {
  data?: PlayerCandidate[];
}

export interface BeatleaderPaginatedPlayersResponse {
  metadata?: {
    itemsPerPage?: number;
    page?: number;
    total?: number;
  };
  data?: PlayerCandidate[];
}

export interface BeatsaverMapByHashResponse {
  id?: string;
  uploaded?: string;
}

export interface ScoreEventPayload {
  accuracy?: number;
  combo?: number;
  missCount?: number;
  currentHealth?: number;
  time?: number;
}

export interface OverlayScoreState {
  hasMissCount: boolean;
  accuracy: number;
  combo: number;
  missCount: number;
  currentHealth: number;
  grade: string;
  gradeColor: string;
}

export interface OverlayProgressState {
  currentTime: number;
  duration: number;
}

export interface OverlayPpPredictorState {
  visible: boolean;
  beatleader: number | null;
  scoresaber: number | null;
}

export interface OverlaySongState {
  title: string;
  artist: string;
  difficultyHtml: string;
  diffColor: string;
  diffShadow: string;
  bpm: number | null;
  coverSrc: string;
  bsrText: string;
  mapDateText: string;
}

export type OverlayRatingLoadState = 'empty' | 'missing' | 'ready';

export interface OverlayMapRatingsState {
  blState: OverlayRatingLoadState;
  ssState: OverlayRatingLoadState;
  showBl: boolean;
  showSs: boolean;
  visible: boolean;
  showBlBreakdown: boolean;
  showTotalRow: boolean;
  blStars: number | null;
  blTech: number | null;
  blAcc: number | null;
  blPass: number | null;
  ssStars: number | null;
}

export interface OverlayProfileServiceState {
  visible: boolean;
  globalRankText: string;
  localRankText: string;
  pp: number | null;
}

export interface OverlayProfileNeighborState {
  text: string;
  name: string;
  ppText: string;
  hasPp: boolean;
  isReady: boolean;
}

export interface OverlayProfileState {
  visible: boolean;
  name: string;
  avatarSrc: string;
  avatarVisible: boolean;
  beatleader: OverlayProfileServiceState;
  scoresaber: OverlayProfileServiceState;
  showNextGlobal: boolean;
  showNextRegion: boolean;
  nextGlobal: OverlayProfileNeighborState;
  nextRegion: OverlayProfileNeighborState;
}

export interface OverlayUiState {
  theme: Theme;
  appVisible: boolean;
  appTransform: string;
  appTransformOrigin: string;
  appTop: string;
  appBottom: string;
  appLeft: string;
  appRight: string;
  appAlignItems: string;
  playingActive: boolean;
  playingFlexDirection: string;
  playingTop: string;
  playingBottom: string;
  playingAlignItems: string;
  menuActive: boolean;
  menuTop: string;
  menuBottom: string;
  menuTransform: string;
  menuTransformOrigin: string;
  headerDisplay: string;
  headerFlexDirection: string;
  textBlockDisplay: string;
  textBlockAlignItems: string;
  textBlockTextAlign: string;
  statsRowDisplay: string;
  statsRowJustifyContent: string;
  topPanelDisplay: string;
  topPanelNoBackground: boolean;
  hpDisplay: string;
  bottomStatsDisplay: string;
  bottomStatsAlignItems: string;
  bottomStatRowDisplay: string;
  bottomStatRowFlexDirection: string;
  accDisplay: string;
  rankWrapperFlexDirection: string;
  rankInfoAlignItems: string;
  rankInfoTextAlign: string;
  coverDisplay: string;
  coverGlow: boolean;
  avatarGlow: boolean;
  profileBackgroundEnabled: boolean;
  titleDisplay: string;
  artistDisplay: string;
  metaDisplay: string;
  bsrDisplay: string;
  bsrJustifyContent: string;
}

export interface OverlaySettingsState {
  visible: boolean;
  config: OverlayConfig;
}

export interface OverlayViewModel {
  score: OverlayScoreState;
  progress: OverlayProgressState;
  ppPredictor: OverlayPpPredictorState;
  song: OverlaySongState;
  mapRatings: OverlayMapRatingsState;
  profile: OverlayProfileState;
  ui: OverlayUiState;
  settings: OverlaySettingsState;
}

export interface MapInfoPayload {
  sub_name?: string;
  name?: string;
  mapper?: string;
  artist?: string;
  difficulty?: string;
  characteristic?: string;
  BPM?: number;
  coverRaw?: string;
  duration?: number;
  timeMultiplier?: number;
  time?: number;
  BSRKey?: string;
  level_id?: string;
}

export interface WsPayload {
  _event?: string;
  gameStateChanged?: string;
  mapInfoChanged?: MapInfoPayload;
  scoreEvent?: ScoreEventPayload;
  pauseTime?: number;
  resumeTime?: number;
}

export interface BeatleaderFetchResult {
  player: PlayerCandidate | null;
  details: BeatleaderPlayerOverlayDetails;
  resolvedBlId: string;
  resolvedBlQuery: string;
  bestMatchName?: string;
}

export interface ScoresaberFetchResult {
  player: PlayerCandidate | null;
  resolvedSsId: string;
  resolvedSsQuery: string;
  bestMatchName?: string;
}

export interface ScoresaberPlayerResponse {
  id?: string;
  name?: string;
  profilePicture?: string;
  country?: string;
  pp?: number;
  rank?: number;
  countryRank?: number;
}

export interface ScoresaberPlayersSearchResponse {
  players?: ScoresaberPlayerResponse[];
}

export interface SocketCallbacks {
  onOpen: () => void;
  onMessage: (payload: WsPayload) => void;
  onDisconnect: (error?: unknown) => void;
}

export interface GameDataService {
  connect(callbacks: SocketCallbacks): void;
  destroy(): void;
}

export interface PpPredictorEntry {
  leaderboardName?: string;
  pp?: number;
  ppGain?: number;
  personalBest?: number | string;
  isRanked?: boolean;
  maxPP?: number;
  ppSuffix?: string;
  iconPath?: string;
}

export interface PpPredictorPayload {
  messageType?: string;
  payload?: PpPredictorEntry[];
}
