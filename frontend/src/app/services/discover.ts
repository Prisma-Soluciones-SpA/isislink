import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Discover {
  private apiUrl = `${environment.apiUrl}/discover`;

  constructor(private http: HttpClient) {}

  getSuggestions(page = 0): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/suggestions?page=${page}`);
  }

  likeUser(targetUserId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/like`, { targetUserId });
  }
}
