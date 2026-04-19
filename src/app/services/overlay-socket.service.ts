import { Injectable } from '@angular/core';
import { SocketCallbacks, WsPayload } from '../models/overlay.models';

@Injectable({ providedIn: 'root' })
export class OverlaySocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private reconnectScheduled = false;

  connect(url: string, callbacks: SocketCallbacks): void {
    this.cleanupSocket();

    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = null;
    this.reconnectScheduled = false;

    let socket: WebSocket;

    try {
      socket = new WebSocket(url);
    } catch (error) {
      this.scheduleReconnect(url, callbacks);
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
      this.scheduleReconnect(url, callbacks);
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

  private scheduleReconnect(url: string, callbacks: SocketCallbacks): void {
    if (this.reconnectScheduled) {
      return;
    }

    if (this.reconnectAttempts >= 10) {
      return;
    }

    this.reconnectScheduled = true;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectScheduled = false;
      this.connect(url, callbacks);
    }, delay);
  }
}
