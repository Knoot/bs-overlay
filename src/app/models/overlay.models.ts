export type Lang = 'en' | 'ru';
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
  ws: string;
  layout: Layout;
  scale: number;
  blId: string;
  resolvedBlId: string;
  resolvedBlQuery: string;
  showBL: boolean;
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

export interface BeatleaderPlayerResponse {
  data?: PlayerCandidate[];
}

export interface BeatleaderPlayersSearchResponse {
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
  inputWs: HTMLInputElement;
  inputScale: HTMLInputElement;
  inputBl: HTMLInputElement;
  inputShowBl: HTMLInputElement;
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
  resolvedBlId: string;
  resolvedBlQuery: string;
  bestMatchName?: string;
}

export interface SocketCallbacks {
  onOpen: () => void;
  onMessage: (payload: WsPayload) => void;
  onDisconnect: (error?: unknown) => void;
}
