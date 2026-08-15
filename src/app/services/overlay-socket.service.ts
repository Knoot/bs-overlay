import { Injectable } from '@angular/core';
import { GameDataService, SocketCallbacks, WsPayload } from '../models/overlay.models';

@Injectable({ providedIn: 'root' })
export class OverlaySocketService implements GameDataService {
  private static readonly URL = 'ws://127.0.0.1:2947/socket';
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private reconnectScheduled = false;

  connect(callbacks: SocketCallbacks): void {
    this.cleanupSocket();

    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = null;
    this.reconnectScheduled = false;

    let socket: WebSocket;

    try {
      socket = new WebSocket(OverlaySocketService.URL);
    } catch (error) {
      this.scheduleReconnect(callbacks);
      callbacks.onDisconnect(error);
      return;
    }

    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.reconnectAttempts = 0;
      this.reconnectScheduled = false;
      callbacks.onOpen();
    };

    const disconnectHandler = (eventOrError: Event) => {
      if (socket !== this.socket) return;
      this.scheduleReconnect(callbacks);
      callbacks.onDisconnect(eventOrError);
    };

    socket.onclose = disconnectHandler;
    socket.onerror = disconnectHandler;
    socket.onmessage = (event) => {
      if (this.socket !== socket) return;

      try {
        callbacks.onMessage(JSON.parse(event.data) as WsPayload);
      } catch (error) {
        callbacks.onDisconnect(error);
      }
    };
  }

  destroy(): void {
    this.cleanupSocket();

    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectScheduled = false;
  }

  private cleanupSocket(): void {
    if (!this.socket) return;

    try {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
    } catch {
      // Ignore cleanup errors during reconnect.
    }

    this.socket = null;
  }

  private scheduleReconnect(callbacks: SocketCallbacks): void {
    if (this.reconnectScheduled) {
      return;
    }

    this.reconnectScheduled = true;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;

    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectScheduled = false;
      this.connect(callbacks);
    }, delay);
  }
}
