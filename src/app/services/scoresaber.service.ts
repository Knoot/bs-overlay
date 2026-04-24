import { Injectable } from '@angular/core';
import { PROXIES } from '../constants/overlay.constants';
import {
  PlayerCandidate,
  ScoresaberFetchResult,
  ScoresaberPlayersSearchResponse
} from '../models/overlay.models';

@Injectable({ providedIn: 'root' })
export class ScoresaberService {
  private currentProxyIdx = 0;
  private customProxy = '';

  setCustomProxy(proxyPrefix: string): void {
    this.customProxy = proxyPrefix.trim();
    this.currentProxyIdx = 0;
  }

  async fetchPlayer(ssId: string, resolvedSsId: string, resolvedSsQuery: string): Promise<ScoresaberFetchResult> {
    let player: PlayerCandidate | null = null;
    const isNumeric = /^\d+$/.test(ssId);

    if (isNumeric) {
      const json = await this.fetchJSONWithProxyFallback(`https://scoresaber.com/api/player/${ssId}/full`);
      player = this.extractSinglePlayerResponse(json);
      return {
        player,
        resolvedSsId: player?.id ? String(player.id) : ssId,
        resolvedSsQuery: ssId
      };
    }

    const normalizedQuery = this.normalizeName(ssId);
    let nextResolvedSsId = resolvedSsId;
    let nextResolvedSsQuery = resolvedSsQuery;

    if (resolvedSsId && this.normalizeName(resolvedSsQuery) === normalizedQuery) {
      try {
        const json = await this.fetchJSONWithProxyFallback(`https://scoresaber.com/api/player/${resolvedSsId}/full`);
        player = this.extractSinglePlayerResponse(json);
      } catch {
        player = null;
      }
    }

    let bestMatchName: string | undefined;

    if (!player) {
      const json = await this.fetchJSONWithProxyFallback(`https://scoresaber.com/api/players?search=${encodeURIComponent(ssId)}`);
      const candidates = this.extractSearchPlayersResponse(json);
      const resolved = this.resolveBestPlayer(candidates, ssId);

      if (!resolved?.best) {
        throw new Error('Player not found');
      }

      player = resolved.best;

      if (player.id) {
        nextResolvedSsId = String(player.id);
        nextResolvedSsQuery = ssId;
      }

      if (resolved.ranked.length > 1) {
        bestMatchName = player.name;
      }
    }

    return {
      player,
      resolvedSsId: nextResolvedSsId,
      resolvedSsQuery: nextResolvedSsQuery,
      bestMatchName
    };
  }

  async fetchMapStars(hash: string, difficulty: string, characteristic: string): Promise<number | null> {
    const difficultyCode = this.normalizeDifficultyCode(difficulty);
    const gameMode = this.normalizeGameMode(characteristic);
    if (!hash || !difficultyCode) {
      return null;
    }

    try {
      const params = new URLSearchParams({ difficulty: difficultyCode });
      if (gameMode) {
        params.set('gameMode', gameMode);
      }
      const json = await this.fetchJSONWithProxyFallback(
        `https://scoresaber.com/api/leaderboard/by-hash/${hash}/info?${params.toString()}`
      );
      return this.extractMapStarsResponse(json);
    } catch {
      return null;
    }
  }

  private normalizeName(value: string): string {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private normalizeLoose(value: string): string {
    return this.normalizeName(value).replace(/[_\-\s]+/g, '');
  }

  private normalizeDifficultyCode(value: string): string {
    const normalized = this.normalizeLoose(value);
    const difficultyMap: Record<string, string> = {
      easy: '1',
      normal: '3',
      hard: '5',
      expert: '7',
      expertplus: '9'
    };

    return difficultyMap[normalized] ?? '';
  }

  private normalizeGameMode(value: string): string {
    const normalized = this.normalizeLoose(value);
    const modeMap: Record<string, string> = {
      standard: 'SoloStandard',
      onesaber: 'SoloOneSaber',
      noarrows: 'SoloNoArrows',
      '90degree': 'Solo90Degree',
      '360degree': 'Solo360Degree',
      lawless: 'SoloLawless',
      lightshow: 'SoloLightshow'
    };

    return modeMap[normalized] ?? '';
  }

  private scorePlayerMatch(player: PlayerCandidate, query: string): number {
    const name = String(player.name || '');
    if (!name) return Number.NEGATIVE_INFINITY;

    const qExact = this.normalizeName(query);
    const qLoose = this.normalizeLoose(query);
    const nExact = this.normalizeName(name);
    const nLoose = this.normalizeLoose(name);

    let score = 0;
    if (nExact === qExact) score += 1000;
    if (nLoose === qLoose) score += 950;
    if (nExact.startsWith(qExact)) score += 700;
    if (nLoose.startsWith(qLoose)) score += 650;
    if (nExact.includes(qExact)) score += 450;
    if (nLoose.includes(qLoose)) score += 400;
    if (typeof player.pp === 'number') score += Math.min(player.pp / 100, 50);
    if (typeof player.rank === 'number' && player.rank > 0) score += Math.max(0, 50 - Math.min(player.rank, 5000) / 100);
    if (typeof player.countryRank === 'number' && player.countryRank > 0) {
      score += Math.max(0, 10 - Math.min(player.countryRank, 1000) / 100);
    }

    return score;
  }

  private resolveBestPlayer(players: PlayerCandidate[], query: string): { best: PlayerCandidate | null; ranked: Array<{ player: PlayerCandidate; score: number }> } | null {
    if (!Array.isArray(players) || players.length === 0) {
      return null;
    }

    const ranked = players
      .map((player) => ({ player, score: this.scorePlayerMatch(player, query) }))
      .sort((a, b) => b.score - a.score);

    return {
      best: ranked[0]?.player || null,
      ranked
    };
  }

  private async fetchJSONWithProxyFallback(originalUrl: string): Promise<unknown> {
    const proxyPool = this.getProxyPool();
    const attempts = Array.from({ length: proxyPool.length }, (_, offset) => (this.currentProxyIdx + offset) % proxyPool.length);
    let lastError: unknown = null;

    for (let offset = 0; offset < attempts.length; offset++) {
      const idx = attempts[offset];
      const proxy = proxyPool[idx];
      const targetUrl = proxy ? proxy + encodeURIComponent(originalUrl) : originalUrl;

      try {
        const response = await fetch(targetUrl, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          mode: 'cors',
          referrerPolicy: 'no-referrer'
        });

        if (!response.ok) {
          throw new Error(`Network error: ${response.status}`);
        }

        const json = await response.json();
        this.currentProxyIdx = idx;
        return json;
      } catch (error) {
        lastError = error;
        if (offset < attempts.length - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 900));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  private getProxyPool(): string[] {
    return this.customProxy ? [this.customProxy, ...PROXIES] : PROXIES;
  }

  private extractSinglePlayerResponse(value: unknown): PlayerCandidate | null {
    if (!this.isJsonObject(value)) {
      return null;
    }

    return this.toPlayerCandidate(value);
  }

  private extractSearchPlayersResponse(value: unknown): PlayerCandidate[] {
    if (!this.isScoresaberPlayersSearchResponse(value) || !Array.isArray(value.players)) {
      return [];
    }

    return value.players
      .map((item) => this.toPlayerCandidate(item))
      .filter((item): item is PlayerCandidate => item !== null);
  }

  private extractMapStarsResponse(value: unknown): number | null {
    const object = this.toObject(value);
    return object ? this.toNullableNumber(object['stars']) : null;
  }

  private isScoresaberPlayersSearchResponse(value: unknown): value is ScoresaberPlayersSearchResponse {
    return this.isJsonObject(value);
  }

  private toPlayerCandidate(value: unknown): PlayerCandidate | null {
    const object = this.toObject(value);
    if (!object) {
      return null;
    }

    const profilePicture = typeof object['profilePicture'] === 'string' ? object['profilePicture'] : undefined;

    return {
      id: typeof object['id'] === 'string' || typeof object['id'] === 'number' ? object['id'] : undefined,
      name: typeof object['name'] === 'string' ? object['name'] : undefined,
      rank: this.toNullableNumber(object['rank']) ?? undefined,
      countryRank: this.toNullableNumber(object['countryRank']) ?? undefined,
      country: typeof object['country'] === 'string' ? object['country'] : undefined,
      pp: this.toNullableNumber(object['pp']) ?? undefined,
      avatar: profilePicture
    } satisfies PlayerCandidate;
  }

  private toNullableNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private toObject(value: unknown): Record<string, unknown> | null {
    return this.isJsonObject(value) ? value : null;
  }

  private isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
