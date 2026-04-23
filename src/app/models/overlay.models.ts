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

export interface OverlayConfig {
  lang: Lang;
  theme: Theme;
  ws: string;
  customProxy: string;
  layout: Layout;
  scale: number;
  blId: string;
  resolvedBlId: string;
  resolvedBlQuery: string;
  showBL: boolean;
  showBLNextGlobal: boolean;
  showBLNextRegion: boolean;
  showBLNextFriends: boolean;
  showDebugUI: boolean;
  glowAvatar: boolean;
  showCover: boolean;
  showTitle: boolean;
  showArtist: boolean;
  showMeta: boolean;
  showBsr: boolean;
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

export interface BeatleaderPlayerOverlayDetails {
  global: BeatleaderNextPlayerInfo | null;
  region: BeatleaderNextPlayerInfo | null;
  friends: BeatleaderNextPlayerInfo | null;
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

export interface OverlayElements {
  app: HTMLElement;
  menuOverlay: HTMLElement;
  playingOverlay: HTMLElement;
  topGlassPanel: HTMLElement;
  headerRow: HTMLElement;
  textBlock: HTMLElement;
  statsRow: HTMLElement;
  progFill: HTMLElement;
  time: HTMLElement;
  title: HTMLElement;
  artist: HTMLElement;
  metaLine: HTMLElement;
  bsrLine: HTMLElement;
  diff: HTMLElement;
  bpm: HTMLElement;
  key: HTMLElement;
  date: HTMLElement;
  coverWrapper: HTMLElement;
  cover: HTMLImageElement;
  bottomStats: HTMLElement;
  bottomStatRow: HTMLElement;
  accLarge: HTMLElement;
  accNum: HTMLElement;
  accGrade: HTMLElement;
  missLabel: HTMLElement;
  combo: HTMLElement;
  miss: HTMLElement;
  hpBarWrapper: HTMLElement;
  hpVal: HTMLElement;
  hpFill: HTMLElement;
  debug: HTMLElement;
  settings: HTMLElement;
  blWrapper: HTMLElement;
  blInfo: HTMLElement;
  blAvatarWrapper: HTMLElement;
  blAvatar: HTMLImageElement;
  blName: HTMLElement;
  blGlobal: HTMLElement;
  blLocal: HTMLElement;
  blPp: HTMLElement;
  blNextGlobal: HTMLElement;
  blNextRegion: HTMLElement;
  // blNextFriendsRow: HTMLElement;
  // blNextFriends: HTMLElement;
  inputWs: HTMLInputElement;
  inputTheme: HTMLSelectElement;
  inputScale: HTMLInputElement;
  inputBl: HTMLInputElement;
  inputCustomProxy: HTMLInputElement;
  inputShowBl: HTMLInputElement;
  inputShowBlNextGlobal: HTMLInputElement;
  inputShowBlNextRegion: HTMLInputElement;
  // inputShowBlNextFriends: HTMLInputElement;
  inputShowDebug: HTMLInputElement;
  inputGlowAvatar: HTMLInputElement;
  inputShowCover: HTMLInputElement;
  inputShowTitle: HTMLInputElement;
  inputShowArtist: HTMLInputElement;
  inputShowMeta: HTMLInputElement;
  inputShowBsr: HTMLInputElement;
  inputShowProgress: HTMLInputElement;
  inputShowHp: HTMLInputElement;
  inputShowStats: HTMLInputElement;
  inputShowAcc: HTMLInputElement;
  inputMapBg: HTMLInputElement;
  inputBlBg: HTMLInputElement;
}

export interface BeatleaderFetchResult {
  player: PlayerCandidate | null;
  details: BeatleaderPlayerOverlayDetails;
  resolvedBlId: string;
  resolvedBlQuery: string;
  bestMatchName?: string;
}

export interface SocketCallbacks {
  onOpen: () => void;
  onMessage: (payload: WsPayload) => void;
  onDisconnect: (error?: unknown) => void;
}
