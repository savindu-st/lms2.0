import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User, UserRole } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/auth';

  private userSignal = signal<User | null>(this.getStoredUser());
  private tokenSignal = signal<string | null>(this.getStoredToken());

  currentUser = this.userSignal.asReadonly();
  token = this.tokenSignal.asReadonly();

  isLoggedIn = computed(() => !!this.tokenSignal() && !!this.userSignal());
  isTeacher = computed(() => this.userSignal()?.role === UserRole.Teacher);
  isStudent = computed(() => this.userSignal()?.role === UserRole.Student);

  constructor() {
    if (this.tokenSignal()) {
      this.fetchCurrentUser().subscribe({
        error: () => this.logout()
      });
    }
  }

  register(data: { fullName: string; email: string; password: string; phoneNumber?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  login(data: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.userSignal.set(user);
        localStorage.setItem('lms_user', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('lms_token', res.token);
    localStorage.setItem('lms_user', JSON.stringify(res.user));
    this.tokenSignal.set(res.token);
    this.userSignal.set(res.user);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('lms_token');
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('lms_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
