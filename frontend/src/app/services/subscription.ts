import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Subscription {
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

  getPlans(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/plans`);
  }

  getStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/status`);
  }

  getHistory(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/history`);
  }

  initTransaction(planType: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/init`, { planType });
  }
}
