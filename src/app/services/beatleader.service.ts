import { Injectable } from '@angular/core';
import {
  BeatleaderMapRatings,
  BeatleaderFetchResult,
  BeatleaderMiniRankingsResponse,
  BeatleaderNextPlayerInfo,
  BeatleaderNextPlayerState,
  BeatleaderOverlayRequestOptions,
  BeatleaderPlayerOverlayDetails,
  BeatleaderPlayerResponse,
  BeatleaderPlayersSearchResponse,
  BeatsaverMapByHashResponse,
  PlayerCandidate
} from '../models/overlay.models';

@Injectable({ providedIn: 'root' })
export class BeatleaderService {
  private currentProxyIdx = 0;
  private proxyPrefixes: string[] = [];

  setCustomProxy(proxyPrefix: string): void {
    this.proxyPrefixes = this.parseProxyPrefixes(proxyPrefix);
    this.currentProxyIdx = 0;
  }

  async fetchBsr(hash: string): Promise<BeatsaverMapByHashResponse> {
    const response = await fetch(`https://api.beatsaver.com/maps/hash/${hash}`, {
      mode: 'cors',
      referrerPolicy: 'no-referrer'
    });
    if (!response.ok) {
      throw new Error('Not found');
    }

    return (await response.json()) as BeatsaverMapByHashResponse;
  }

  async fetchMapRatings(hash: string, difficulty: string, mode: string): Promise<BeatleaderMapRatings | null> {
    const difficultyCandidates = this.getDifficultyCandidates(difficulty);
    const modeCandidates = this.getModeCandidates(mode);
    if (!hash || difficultyCandidates.length === 0 || modeCandidates.length === 0) {
      return null;
    }

    for (const difficultyCandidate of difficultyCandidates) {
      for (const modeCandidate of modeCandidates) {
        try {
          const json = await this.fetchJSONWithProxyFallback(
            `https://api.beatleader.com/leaderboard/${hash}/${encodeURIComponent(difficultyCandidate)}/${encodeURIComponent(modeCandidate)}`
          );
          const ratings = this.extractMapRatingsResponse(json);
          if (ratings) {
            return ratings;
          }
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  async fetchPlayer(
    blId: string,
    resolvedBlId: string,
    resolvedBlQuery: string,
    requestOptions: BeatleaderOverlayRequestOptions
  ): Promise<BeatleaderFetchResult> {
    let player: PlayerCandidate | null = null;
    const isNumeric = /^\d+$/.test(blId);

    if (isNumeric) {
      const json = await this.fetchJSONWithProxyFallback(`https://api.beatleader.com/player/${blId}?stats=true`);
      player = this.extractSinglePlayerResponse(json);
      const details = player ? await this.fetchOverlayDetails(player, requestOptions) : this.emptyDetails();
      return {
        player,
        details,
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

    const details = player ? await this.fetchOverlayDetails(player, requestOptions) : this.emptyDetails();

    return {
      player,
      details,
      resolvedBlId: nextResolvedBlId,
      resolvedBlQuery: nextResolvedBlQuery,
      bestMatchName
    };
  }

  async fetchPlayerDetails(
    player: PlayerCandidate,
    requestOptions: BeatleaderOverlayRequestOptions
  ): Promise<BeatleaderPlayerOverlayDetails> {
    return this.fetchOverlayDetails(player, requestOptions);
  }

  private normalizeName(value: string): string {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private normalizeLoose(value: string): string {
    return this.normalizeName(value).replace(/[_\-\s]+/g, '');
  }

  private normalizeDifficultyName(value: string): string {
    const normalized = this.normalizeLoose(value);
    const difficultyMap: Record<string, string> = {
      easy: 'Easy',
      normal: 'Normal',
      hard: 'Hard',
      expert: 'Expert',
      expertplus: 'ExpertPlus'
    };

    return difficultyMap[normalized] ?? '';
  }

  private getDifficultyCandidates(value: string): string[] {
    const trimmed = value.trim();
    const normalized = this.normalizeDifficultyName(value);
    return Array.from(new Set([trimmed, normalized].filter(Boolean)));
  }

  private normalizeModeName(value: string): string {
    const normalized = this.normalizeLoose(value);
    const modeMap: Record<string, string> = {
      standard: 'Standard',
      onesaber: 'OneSaber',
      noarrows: 'NoArrows',
      '90degree': '90Degree',
      '360degree': '360Degree',
      lawless: 'Lawless',
      lightshow: 'Lightshow'
    };

    return modeMap[normalized] ?? value.trim();
  }

  private getModeCandidates(value: string): string[] {
    const trimmed = value.trim();
    const normalized = this.normalizeModeName(value);
    return Array.from(new Set([trimmed, normalized].filter(Boolean)));
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

  private emptyDetails(): BeatleaderPlayerOverlayDetails {
    return {
      global: this.emptyNextPlayerState(),
      region: this.emptyNextPlayerState(),
      friends: this.emptyNextPlayerState()
    };
  }

  private async fetchOverlayDetails(
    player: PlayerCandidate,
    requestOptions: BeatleaderOverlayRequestOptions
  ): Promise<BeatleaderPlayerOverlayDetails> {
    const shouldFetchMiniRankings =
      requestOptions.includeGlobal ||
      requestOptions.includeRegion;

    if (!shouldFetchMiniRankings) {
      return this.emptyDetails();
    }

    try {
      const rankings = await this.fetchMiniRankings(player);
      return {
        global: this.toNextPlayerState(rankings.global, player),
        region: this.toNextPlayerState(rankings.country, player),
        friends: this.emptyNextPlayerState()
      };
    } catch {
      return {
        global: requestOptions.includeGlobal ? this.failedNextPlayerState() : this.emptyNextPlayerState(),
        region: requestOptions.includeRegion ? this.failedNextPlayerState() : this.emptyNextPlayerState(),
        friends: this.emptyNextPlayerState()
      };
    }
  }

  private async fetchMiniRankings(player: PlayerCandidate): Promise<BeatleaderMiniRankingsResponse> {
    if (!(typeof player.rank === 'number' && player.rank > 0)) {
      return {};
    }

    const query = new URLSearchParams();
    query.set('rank', String(player.rank));
    query.set('leaderboardContext', 'general');
    query.set('friends', 'false');

    if (player.country) {
      query.set('country', player.country);
    }

    if (typeof player.countryRank === 'number' && player.countryRank > 0) {
      query.set('countryRank', String(player.countryRank));
    }

    const json = await this.fetchJSONWithProxyFallback(`https://api.beatleader.com/minirankings?${query.toString()}`);
    return this.extractMiniRankingsResponse(json);
  }

  private toNextPlayerState(
    candidates: PlayerCandidate[] | null | undefined,
    currentPlayer: PlayerCandidate
  ): BeatleaderNextPlayerState {
    const value = this.toNextPlayerInfo(this.findClosestHigherPpPlayer(candidates, currentPlayer), currentPlayer);
    return value ? { status: 'ready', value } : this.emptyNextPlayerState();
  }

  private findClosestHigherPpPlayer(
    candidates: PlayerCandidate[] | null | undefined,
    currentPlayer: PlayerCandidate
  ): PlayerCandidate | null {
    const currentPp = typeof currentPlayer.pp === 'number' ? currentPlayer.pp : null;
    const currentId = String(currentPlayer.id ?? '');
    let closest: PlayerCandidate | null = null;

    if (!Array.isArray(candidates)) {
      return null;
    }

    for (const candidate of candidates) {
      if (!candidate?.name || typeof candidate.pp !== 'number') {
        continue;
      }

      if (currentId && String(candidate.id ?? '') === currentId) {
        continue;
      }

      if (currentPp !== null && candidate.pp <= currentPp) {
        continue;
      }

      if (!closest || (closest.pp ?? Number.POSITIVE_INFINITY) > candidate.pp) {
        closest = candidate;
      }
    }

    return closest;
  }

  private toNextPlayerInfo(candidate: PlayerCandidate | null | undefined, currentPlayer: PlayerCandidate): BeatleaderNextPlayerInfo | null {
    if (!candidate?.name) {
      return null;
    }

    const ppDelta =
      typeof candidate.pp === 'number' && typeof currentPlayer.pp === 'number'
        ? Math.max(0, candidate.pp - currentPlayer.pp)
        : null;

    return {
      name: candidate.name,
      ppDelta
    };
  }

  private emptyNextPlayerState(): BeatleaderNextPlayerState {
    return { status: 'empty' };
  }

  private failedNextPlayerState(): BeatleaderNextPlayerState {
    return { status: 'failed' };
  }

  private async fetchJSONWithProxyFallback(
    originalUrl: string,
    options?: { allowProxyFallback?: boolean; credentials?: RequestCredentials }
  ): Promise<unknown> {
    const allowProxyFallback = options?.allowProxyFallback !== false;
    const proxyPool = this.getProxyPool();
    const attempts = allowProxyFallback
      ? proxyPool.length > 0
        ? Array.from({ length: proxyPool.length }, (_, offset) => (this.currentProxyIdx + offset) % proxyPool.length)
        : [-1]
      : [-1];
    let lastError: unknown = null;

    for (let offset = 0; offset < attempts.length; offset++) {
      const idx = attempts[offset];
      const proxy = idx === -1 ? '' : proxyPool[idx];
      const targetUrl = proxy ? proxy + encodeURIComponent(originalUrl) : originalUrl;

      try {
        const response = await fetch(targetUrl, {
          headers: { Accept: 'application/json' },
          credentials: options?.credentials ?? 'same-origin',
          mode: 'cors',
          referrerPolicy: 'no-referrer'
        });

        if (!response.ok) {
          throw new Error(`Network error: ${response.status}`);
        }

        const json = await response.json();
        if (idx >= 0) {
          this.currentProxyIdx = idx;
        }
        return json;
      } catch (error) {
        lastError = error;
        if (offset < attempts.length - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  private getProxyPool(): string[] {
    return this.proxyPrefixes;
  }

  private parseProxyPrefixes(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
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

  private extractMiniRankingsResponse(value: unknown): BeatleaderMiniRankingsResponse {
    if (!this.isBeatleaderMiniRankingsResponse(value)) {
      return {};
    }

    return {
      global: this.extractMiniRankingList(value.global),
      country: this.extractMiniRankingList(value.country),
      friends: null
    };
  }

  private extractMiniRankingList(value: PlayerCandidate[] | null | undefined): PlayerCandidate[] | null {
    if (value === null) {
      return null;
    }

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.toPlayerCandidate(item))
      .filter((item): item is PlayerCandidate => item !== null);
  }

  private extractMapRatingsResponse(value: unknown): BeatleaderMapRatings | null {
    if (!this.isJsonObject(value)) {
      return null;
    }

    const difficulty = this.isJsonObject(value['difficulty']) ? value['difficulty'] : null;
    if (!difficulty) {
      return null;
    }

    return {
      stars: this.toNullableNumber(difficulty['stars']),
      tech: this.toNullableNumber(difficulty['techRating']),
      acc: this.toNullableNumber(difficulty['accRating']),
      pass: this.toNullableNumber(difficulty['passRating'])
    };
  }

  private isBeatleaderPlayerResponse(value: unknown): value is BeatleaderPlayerResponse {
    return this.isJsonObject(value);
  }

  private isBeatleaderPlayersSearchResponse(value: unknown): value is BeatleaderPlayersSearchResponse {
    return this.isJsonObject(value);
  }

  private isBeatleaderMiniRankingsResponse(value: unknown): value is BeatleaderMiniRankingsResponse {
    return this.isJsonObject(value);
  }

  private toPlayerCandidate(value: unknown): PlayerCandidate | null {
    return this.isJsonObject(value) ? (value as PlayerCandidate) : null;
  }

  private toNullableNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
