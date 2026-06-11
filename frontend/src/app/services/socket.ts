import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket as SocketIO } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from './auth';

@Injectable({ providedIn: 'root' })
export class Socket implements OnDestroy {
  private socket: SocketIO | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor(private authService: Auth) {}

  connect() {
    const token = this.authService.token;
    if (!token || this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => this.connected$.next(true));
    this.socket.on('disconnect', () => this.connected$.next(false));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connected$.next(false);
  }

  joinChat(matchId: string) { this.socket?.emit('chat:join', matchId); }
  leaveChat(matchId: string) { this.socket?.emit('chat:leave', matchId); }

  sendMessage(matchId: string, content: string) {
    this.socket?.emit('chat:message', { matchId, content });
  }

  sendTyping(matchId: string, isTyping: boolean) {
    this.socket?.emit('chat:typing', { matchId, isTyping });
  }

  onMessage(): Observable<any> {
    return new Observable(obs => {
      this.socket?.on('chat:message', (msg: any) => obs.next(msg));
    });
  }

  onTyping(): Observable<any> {
    return new Observable(obs => {
      this.socket?.on('chat:typing', (data: any) => obs.next(data));
    });
  }

  onNotification(): Observable<any> {
    return new Observable(obs => {
      this.socket?.on('notification:message', (data: any) => obs.next(data));
    });
  }

  get isConnected$() { return this.connected$.asObservable(); }

  ngOnDestroy() { this.disconnect(); }
}
