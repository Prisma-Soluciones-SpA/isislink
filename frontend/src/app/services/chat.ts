import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Chat {
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  getMessages(matchId: string, page = 0): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${matchId}?page=${page}`);
  }

  sendMessage(matchId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${matchId}`, { content });
  }
}
