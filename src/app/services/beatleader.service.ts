import { Injectable } from '@angular/core';
import { PROXIES } from '../constants/overlay.constants';
import {
  BeatleaderFetchResult,
  BeatleaderPlayerResponse,
  BeatleaderPlayersSearchResponse,
  BeatsaverMapByHashResponse,
  PlayerCandidate
} from '../models/overlay.models';

@Injectable({ providedIn: 'root' })
export class BeatleaderService {
  private currentProxyIdx = 0;

  async fetchBsr(hash: string): Promise<BeatsaverMapByHashResponse> {
    const response = await fetch(`https://api.beatsaver.com/maps/hash/${hash}`);
    if (!response.ok) {
      throw new Error('Not found');
    }

    return (await response.json()) as BeatsaverMapByHashResponse;
  }

  async fetchPlayer(blId: string, resolvedBlId: string, resolvedBlQuery: string): Promise<BeatleaderFetchResult> {
    let player: PlayerCandidate | null = null;
    const isNumeric = /^\d+$/.test(blId);

    if (isNumeric) {
      const json = await this.fetchJSONWithProxyFallback(`https://api.beatleader.com/player/${blId}?stats=true`);
      player = this.extractSinglePlayerResponse(json);
      return {
        player,
        resolvedBlId: blId,
        resolvedBlQuery: blId
      };
    }

    const normalizedQuery = this.normalizeName(blId);
    let nextResolvedBlId = resolvedBlId;
    let nextResolvedBlQuery = resolvedBlQuery;

    if (resolvedBlId && this.normalizeName(resolvedBlQuery) === normalizedQuery) {
      try {
        const json = await this.fetchJSONWithProxyFallback(`https://api.beatleader.com/player/${resolvedBlId}?stats=true`);
        player = this.extractSinglePlayerResponse(json);
      } catch {
        player = null;
      }
    }

    let bestMatchName: string | undefined;

    if (!player) {
      const json = await this.fetchJSONWithProxyFallback(`https://api.beatleader.com/players?search=${encodeURIComponent(blId)}`);
      const candidates = this.extractSearchPlayersResponse(json);
      const resolved = this.resolveBestPlayer(candidates, blId);

      if (!resolved?.best) {
        throw new Error('Player not found');
      }

      player = resolved.best;

      if (player.id) {
        nextResolvedBlId = String(player.id);
        nextResolvedBlQuery = blId;
      }

      if (resolved.ranked.length > 1) {
        bestMatchName = player.name;
      }
    }

    return {
      player,
      resolvedBlId: nextResolvedBlId,
      resolvedBlQuery: nextResolvedBlQuery,
      bestMatchName
    };
  }

  private normalizeName(value: string): string {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private normalizeLoose(value: string): string {
    return this.normalizeName(value).replace(/[_\-\s]+/g, '');
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
    const totalAttempts = PROXIES.length;
    let lastError: unknown = null;

    for (let offset = 0; offset < totalAttempts; offset++) {
      const idx = (this.currentProxyIdx + offset) % totalAttempts;
      const proxy = PROXIES[idx];
      const targetUrl = proxy ? proxy + encodeURIComponent(originalUrl) : originalUrl;

      try {
        const response = await fetch(targetUrl, {
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Network error: ${response.status}`);
        }

        const json = await response.json();
        this.currentProxyIdx = idx;
        return json;
      } catch (error) {
        lastError = error;
        if (offset < totalAttempts - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  private extractSinglePlayerResponse(value: unknown): PlayerCandidate | null {
    if (this.isBeatleaderPlayerResponse(value) && Array.isArray(value.data)) {
      return this.toPlayerCandidate(value.data[0]);
    }

    return this.toPlayerCandidate(value);
  }

  private extractSearchPlayersResponse(value: unknown): PlayerCandidate[] {
    if (!this.isBeatleaderPlayersSearchResponse(value) || !Array.isArray(value.data)) {
      return [];
    }

    return value.data
      .map((item) => this.toPlayerCandidate(item))
      .filter((item): item is PlayerCandidate => item !== null);
  }

  private isBeatleaderPlayerResponse(value: unknown): value is BeatleaderPlayerResponse {
    return this.isJsonObject(value);
  }

  private isBeatleaderPlayersSearchResponse(value: unknown): value is BeatleaderPlayersSearchResponse {
    return this.isJsonObject(value);
  }

  private toPlayerCandidate(value: unknown): PlayerCandidate | null {
    return this.isJsonObject(value) ? (value as PlayerCandidate) : null;
  }

  private isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
