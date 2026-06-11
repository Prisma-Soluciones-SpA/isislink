import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Match {
  private apiUrl = `${environment.apiUrl}/matches`;

  constructor(private http: HttpClient) {}

  getMatches(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getMatchById(matchId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${matchId}`);
  }
}
