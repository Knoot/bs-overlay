import { Injectable } from '@angular/core';
import { PROXIES } from '../constants/overlay.constants';
import {
  BeatleaderFetchResult,
  BeatleaderNextPlayerInfo,
  BeatleaderOverlayRequestOptions,
  BeatleaderPaginatedPlayersResponse,
  BeatleaderPlayerOverlayDetails,
  BeatleaderPlayerResponse,
  BeatleaderPlayersSearchResponse,
  BeatsaverMapByHashResponse,
  PlayerCandidate
} from '../models/overlay.models';

@Injectable({ providedIn: 'root' })
export class BeatleaderService {
  private currentProxyIdx = 0;
  private customProxy = '';

  setCustomProxy(proxyPrefix: string): void {
    this.customProxy = proxyPrefix.trim();
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

  private emptyDetails(): BeatleaderPlayerOverlayDetails {
    return {
      global: null,
      region: null,
      friends: null
    };
  }

  private async fetchOverlayDetails(
    player: PlayerCandidate,
    requestOptions: BeatleaderOverlayRequestOptions
  ): Promise<BeatleaderPlayerOverlayDetails> {
    const [global, region, friends] = await Promise.all([
      requestOptions.includeGlobal ? this.fetchNextGlobalPlayer(player) : Promise.resolve(null),
      requestOptions.includeRegion ? this.fetchNextRegionPlayer(player) : Promise.resolve(null),
      // requestOptions.includeFriends ? this.fetchNextFriendsPlayer(player) : Promise.resolve(null)
      Promise.resolve(null)
    ]);

    return { global, region, friends };
  }

  private async fetchNextGlobalPlayer(player: PlayerCandidate): Promise<BeatleaderNextPlayerInfo | null> {
    if (!(typeof player.rank === 'number' && player.rank > 1)) {
      return null;
    }

    try {
      const response = await this.fetchPlayersPage({
        sortBy: 'pp',
        order: 'desc',
        page: player.rank - 1,
        count: 1
      });
      return this.toNextPlayerInfo(response.data[0], player);
    } catch {
      return null;
    }
  }

  private async fetchNextRegionPlayer(player: PlayerCandidate): Promise<BeatleaderNextPlayerInfo | null> {
    if (!(typeof player.countryRank === 'number' && player.countryRank > 1 && player.country)) {
      return null;
    }

    try {
      const response = await this.fetchPlayersPage({
        sortBy: 'pp',
        order: 'desc',
        page: player.countryRank - 1,
        count: 1,
        countries: player.country
      });
      return this.toNextPlayerInfo(response.data[0], player);
    } catch {
      return null;
    }
  }

  // private async fetchNextFriendsPlayer(player: PlayerCandidate): Promise<BeatleaderNextPlayerInfo | null> {
  //   const playerId = String(player.id || '');
  //   const playerPp = typeof player.pp === 'number' ? player.pp : null;
  //
  //   if (!playerId || playerPp === null) {
  //     return null;
  //   }
  //
  //   const pageSize = 50;
  //   const maxPages = 4;
  //   let bestCandidate: PlayerCandidate | null = null;
  //
  //   try {
  //     for (let page = 1; page <= maxPages; page++) {
  //       const followers = await this.fetchFollowersPage(playerId, page, pageSize);
  //       if (followers.length === 0) {
  //         break;
  //       }
  //
  //       const profiles = await Promise.all(
  //         followers.map((candidate) => this.fetchPlayerProfileById(String(candidate.id || '')).catch(() => null))
  //       );
  //
  //       for (const profile of profiles) {
  //         if (!profile?.name || typeof profile.pp !== 'number' || profile.pp <= playerPp) {
  //           continue;
  //         }
  //
  //         if (!bestCandidate || (bestCandidate.pp ?? Number.POSITIVE_INFINITY) > profile.pp) {
  //           bestCandidate = profile;
  //         }
  //       }
  //
  //       if (followers.length < pageSize) {
  //         break;
  //       }
  //     }
  //
  //     if (bestCandidate) {
  //       return this.toNextPlayerInfo(bestCandidate, player);
  //     }
  //   } catch {
  //     return null;
  //   }
  //
  //   return null;
  // }
  //
  // private async fetchFollowersPage(playerId: string, page: number, count: number): Promise<PlayerCandidate[]> {
  //   const json = await this.fetchJSONWithProxyFallback(
  //     `https://api.beatleader.com/player/${playerId}/followers?page=${page}&count=${count}&type=following`
  //   );
  //   return this.extractFollowerListResponse(json);
  // }
  //
  // private async fetchPlayerProfileById(playerId: string): Promise<PlayerCandidate | null> {
  //   if (!playerId) {
  //     return null;
  //   }
  //
  //   const json = await this.fetchJSONWithProxyFallback(`https://api.beatleader.com/player/${playerId}?stats=true`);
  //   return this.extractSinglePlayerResponse(json);
  // }

  private async fetchPlayersPage(
    params: Record<string, string | number | boolean | undefined>,
    options?: { allowProxyFallback?: boolean; credentials?: RequestCredentials }
  ): Promise<{ data: PlayerCandidate[]; total?: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      query.set(key, String(value));
    });

    const json = await this.fetchJSONWithProxyFallback(`https://api.beatleader.com/players?${query.toString()}`, options);
    return this.extractPlayersPageResponse(json);
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

  private isSamePlayer(left: PlayerCandidate | null | undefined, right: PlayerCandidate | null | undefined): boolean {
    if (!left || !right) {
      return false;
    }

    if (left.id !== undefined && right.id !== undefined) {
      return String(left.id) === String(right.id);
    }

    return this.normalizeLoose(left.name || '') === this.normalizeLoose(right.name || '');
  }

  private async fetchJSONWithProxyFallback(
    originalUrl: string,
    options?: { allowProxyFallback?: boolean; credentials?: RequestCredentials }
  ): Promise<unknown> {
    const allowProxyFallback = options?.allowProxyFallback !== false;
    const proxyPool = this.getProxyPool();
    // BeatLeader API does not expose browser CORS headers for app origins like localhost/OBS,
    // so direct fetches fail in the client and we intentionally start with proxy routes.
    const shouldSkipDirectRequest = allowProxyFallback && originalUrl.startsWith('https://api.beatleader.com/');
    const attempts = allowProxyFallback
      ? Array.from({ length: proxyPool.length }, (_, offset) => (this.currentProxyIdx + offset) % proxyPool.length).filter(
          (index) => !(shouldSkipDirectRequest && proxyPool[index] === '')
        )
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
    return this.customProxy ? [this.customProxy, ...PROXIES] : PROXIES;
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

  private extractPlayersPageResponse(value: unknown): { data: PlayerCandidate[]; total?: number } {
    if (!this.isBeatleaderPaginatedPlayersResponse(value) || !Array.isArray(value.data)) {
      return { data: [] };
    }

    const total =
      this.isJsonObject(value.metadata) && typeof value.metadata['total'] === 'number'
        ? value.metadata['total']
        : undefined;

    return {
      data: value.data
        .map((item) => this.toPlayerCandidate(item))
        .filter((item): item is PlayerCandidate => item !== null),
      total
    };
  }

  private extractFollowerListResponse(value: unknown): PlayerCandidate[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.toPlayerCandidate(item))
      .filter((item): item is PlayerCandidate => item !== null);
  }

  private isBeatleaderPlayerResponse(value: unknown): value is BeatleaderPlayerResponse {
    return this.isJsonObject(value);
  }

  private isBeatleaderPlayersSearchResponse(value: unknown): value is BeatleaderPlayersSearchResponse {
    return this.isJsonObject(value);
  }

  private isBeatleaderPaginatedPlayersResponse(value: unknown): value is BeatleaderPaginatedPlayersResponse {
    return this.isJsonObject(value);
  }

  private toPlayerCandidate(value: unknown): PlayerCandidate | null {
    return this.isJsonObject(value) ? (value as PlayerCandidate) : null;
  }

  private isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
