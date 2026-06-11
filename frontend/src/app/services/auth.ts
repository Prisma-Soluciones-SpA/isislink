import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  birthDate: string;
  zodiacSign: string;
  esotericPreferences: string[];
  profileImage?: string;
  bio?: string;
  city?: string;
  phone?: string;
  role: 'user' | 'admin';
  freemiumLikesUsed: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  subscription: any | null;
  canLike: boolean;
  likesRemaining: number | null;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private apiUrl = `${environment.apiUrl}/auth`;
  private state = new BehaviorSubject<AuthState>({
    user: null, token: null, subscription: null, canLike: false, likesRemaining: null
  });

  state$ = this.state.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('al_token');
    const userStr = localStorage.getItem('al_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      this.state.next({ ...this.state.value, user, token });
      this.refreshMe().subscribe();
    }
  }

  get currentUser() { return this.state.value.user; }
  get token() { return this.state.value.token; }
  get isLoggedIn() { return !!this.state.value.token; }

  register(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, formData).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  refreshMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        this.state.next({
          ...this.state.value,
          user: res.user,
          subscription: res.subscription,
          canLike: res.canLike,
          likesRemaining: res.likesRemaining
        });
        localStorage.setItem('al_user', JSON.stringify(res.user));
      })
    );
  }

  updateProfile(formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, formData).pipe(
      tap(res => {
        this.state.next({ ...this.state.value, user: res.user });
        localStorage.setItem('al_user', JSON.stringify(res.user));
      })
    );
  }

  private setSession(res: any) {
    localStorage.setItem('al_token', res.token);
    localStorage.setItem('al_user', JSON.stringify(res.user));
    this.state.next({
      user: res.user,
      token: res.token,
      subscription: res.subscription || null,
      canLike: res.user.gender === 'female' ? true : false,
      likesRemaining: null
    });
  }

  logout() {
    localStorage.removeItem('al_token');
    localStorage.removeItem('al_user');
    this.state.next({ user: null, token: null, subscription: null, canLike: false, likesRemaining: null });
  }
}
