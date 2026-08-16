import { Injectable } from '@angular/core';
import { GameDataService, MapInfoPayload, SocketCallbacks } from '../models/overlay.models';

type DataPullerEndpoint = 'MapData' | 'LiveData';

interface DataPullerMapData {
  InLevel?: boolean;
  LevelPaused?: boolean;
  LevelFinished?: boolean;
  LevelFailed?: boolean;
  LevelQuit?: boolean;
  Hash?: string | null;
  LevelID?: string | null;
  SongName?: string;
  SongSubName?: string;
  SongAuthor?: string;
  Mapper?: string;
  Mappers?: string[];
  BSRKey?: string | null;
  CoverImage?: string | null;
  Duration?: number;
  MapType?: string;
  Difficulty?: string;
  BPM?: number;
  ModifiersMultiplier?: number;
}

interface DataPullerLiveData {
  Score?: number;
  Combo?: number;
  Misses?: number;
  Accuracy?: number;
  PlayerHealth?: number;
  TimeElapsed?: number;
}

@Injectable({ providedIn: 'root' })
export class DataPullerSocketService implements GameDataService {
  private static readonly BASE_URL = 'ws://127.0.0.1:2946/BSDataPuller';
  private static readonly ENDPOINTS: DataPullerEndpoint[] = ['MapData', 'LiveData'];
  private readonly sockets = new Map<DataPullerEndpoint, WebSocket>();
  private readonly reconnectTimeouts = new Map<DataPullerEndpoint, number>();
  private readonly reconnectAttempts = new Map<DataPullerEndpoint, number>();
  private isConnected = false;
  private lastInLevel = false;
  private lastPaused = false;
  private lastMapInfoKey = '';

  connect(callbacks: SocketCallbacks): void {
    this.destroy();
    DataPullerSocketService.ENDPOINTS.forEach((endpoint) => this.connectEndpoint(endpoint, callbacks));
  }

  destroy(): void {
    this.reconnectTimeouts.forEach((timeout) => window.clearTimeout(timeout));
    this.reconnectTimeouts.clear();
    this.reconnectAttempts.clear();
    this.sockets.forEach((socket) => this.cleanupSocket(socket));
    this.sockets.clear();
    this.isConnected = false;
    this.lastInLevel = false;
    this.lastPaused = false;
    this.lastMapInfoKey = '';
  }

  private connectEndpoint(endpoint: DataPullerEndpoint, callbacks: SocketCallbacks): void {
    this.cleanupEndpoint(endpoint);

    let socket: WebSocket;

    try {
      socket = new WebSocket(`${DataPullerSocketService.BASE_URL}/${endpoint}`);
    } catch (error) {
      this.scheduleReconnect(endpoint, callbacks);
      callbacks.onDisconnect(error);
      return;
    }

    this.sockets.set(endpoint, socket);

    socket.onopen = () => {
      if (this.sockets.get(endpoint) !== socket) return;
      this.reconnectAttempts.set(endpoint, 0);

      if (!this.isConnected && this.areAllEndpointsOpen()) {
        this.isConnected = true;
        callbacks.onOpen();
      }
    };

    const disconnectHandler = (eventOrError: Event) => {
      if (this.sockets.get(endpoint) !== socket) return;
      this.sockets.delete(endpoint);
      this.scheduleReconnect(endpoint, callbacks);

      if (this.isConnected) {
        this.isConnected = false;
        callbacks.onDisconnect(eventOrError);
      }
    };

    socket.onclose = disconnectHandler;
    socket.onerror = disconnectHandler;
    socket.onmessage = (event) => {
      if (this.sockets.get(endpoint) !== socket) return;

      try {
        this.handleMessage(endpoint, JSON.parse(event.data) as unknown, callbacks);
      } catch (error) {
        callbacks.onDisconnect(error);
      }
    };
  }

  private handleMessage(endpoint: DataPullerEndpoint, payload: unknown, callbacks: SocketCallbacks): void {
    if (endpoint === 'MapData') {
      this.handleMapData(payload as DataPullerMapData, callbacks);
      return;
    }

    this.handleLiveData(payload as DataPullerLiveData, callbacks);
  }

  private handleMapData(data: DataPullerMapData, callbacks: SocketCallbacks): void {
    const inLevel = Boolean(data.InLevel) && !data.LevelFinished && !data.LevelQuit;
    const paused = Boolean(data.LevelPaused);

    if (inLevel !== this.lastInLevel) {
      callbacks.onMessage({ _event: 'gameState', gameStateChanged: inLevel ? 'Playing' : 'Menu' });
      this.lastInLevel = inLevel;
    }

    const mapInfoKey = this.getMapInfoKey(data);
    if (inLevel && mapInfoKey && mapInfoKey !== this.lastMapInfoKey) {
      callbacks.onMessage({ _event: 'mapInfo', mapInfoChanged: this.toMapInfo(data) });
      this.lastMapInfoKey = mapInfoKey;
    } else if (!inLevel) {
      this.lastMapInfoKey = '';
    }

    if (inLevel && paused && !this.lastPaused) {
      callbacks.onMessage({ _event: 'pause' });
    } else if (inLevel && !paused && this.lastPaused) {
      callbacks.onMessage({ _event: 'resume' });
    }

    this.lastPaused = inLevel && paused;
  }

  private handleLiveData(data: DataPullerLiveData, callbacks: SocketCallbacks): void {
    if (!this.lastInLevel) {
      return;
    }

    callbacks.onMessage({
      _event: 'score',
      scoreEvent: {
        accuracy: this.toRatio(data.Accuracy),
        combo: this.toNumber(data.Combo),
        missCount: this.toNumber(data.Misses),
        currentHealth: this.toRatio(data.PlayerHealth),
        time: this.toNumber(data.TimeElapsed)
      }
    });
  }

  private toMapInfo(data: DataPullerMapData): MapInfoPayload {
    const hash = String(data.Hash ?? '').trim();
    const mapper = data.Mapper || (Array.isArray(data.Mappers) ? data.Mappers.join(', ') : '');

    return {
      name: data.SongName || '',
      sub_name: data.SongSubName || '',
      artist: data.SongAuthor || '',
      mapper,
      difficulty: data.Difficulty || '',
      characteristic: data.MapType || '',
      BPM: this.toNumber(data.BPM),
      coverRaw: String(data.CoverImage ?? '').trim(),
      duration: this.toNumber(data.Duration) * 1000,
      timeMultiplier: this.toNumber(data.ModifiersMultiplier) || 1,
      time: 0,
      BSRKey: data.BSRKey || '',
      level_id: hash ? `custom_level_${hash}` : data.LevelID || ''
    };
  }

  private getMapInfoKey(data: DataPullerMapData): string {
    const hash = String(data.Hash ?? '').trim();
    const levelId = String(data.LevelID ?? '').trim();
    const difficulty = String(data.Difficulty ?? '').trim();
    const characteristic = String(data.MapType ?? '').trim();
    const mapId = hash || levelId;
    return mapId ? [mapId, difficulty, characteristic].join('|') : '';
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toRatio(value: unknown): number {
    const ratio = this.toNumber(value);
    return ratio > 1 ? ratio / 100 : ratio;
  }

  private cleanupEndpoint(endpoint: DataPullerEndpoint): void {
    const reconnectTimeout = this.reconnectTimeouts.get(endpoint);
    if (reconnectTimeout !== undefined) {
      window.clearTimeout(reconnectTimeout);
      this.reconnectTimeouts.delete(endpoint);
    }

    const socket = this.sockets.get(endpoint);
    if (!socket) {
      return;
    }

    this.cleanupSocket(socket);
    this.sockets.delete(endpoint);
  }

  private cleanupSocket(socket: WebSocket): void {
    try {
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.close();
    } catch {
      // Ignore cleanup errors during reconnect.
    }
  }

  private scheduleReconnect(endpoint: DataPullerEndpoint, callbacks: SocketCallbacks): void {
    if (this.reconnectTimeouts.has(endpoint)) {
      return;
    }

    const attempts = this.reconnectAttempts.get(endpoint) ?? 0;
    const delay = Math.min(1000 * Math.pow(2, attempts), 15000);
    this.reconnectAttempts.set(endpoint, attempts + 1);

    const timeout = window.setTimeout(() => {
      this.reconnectTimeouts.delete(endpoint);
      this.connectEndpoint(endpoint, callbacks);
    }, delay);

    this.reconnectTimeouts.set(endpoint, timeout);
  }

  private areAllEndpointsOpen(): boolean {
    return DataPullerSocketService.ENDPOINTS.every((endpoint) => this.sockets.get(endpoint)?.readyState === WebSocket.OPEN);
  }
}
