import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Tip {
  private apiUrl = `${environment.apiUrl}/tips`;

  constructor(private http: HttpClient) {}

  getTips(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getTipById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
