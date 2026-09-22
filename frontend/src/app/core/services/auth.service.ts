import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, catchError } from 'rxjs';
import { AuthResponse, User, UserRole } from '../models/models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:5000/api/auth';

  private userSignal = signal<User | null>(this.getStoredUser());

  currentUser = this.userSignal.asReadonly();

  isLoggedIn = computed(() => !!this.userSignal());
  isTeacher = computed(() => this.userSignal()?.role === UserRole.Teacher);
  isStudent = computed(() => this.userSignal()?.role === UserRole.Student);

  initSession(): Observable<User | null> {
    return this.fetchCurrentUser().pipe(
      catchError(() => {
        this.userSignal.set(null);
        localStorage.removeItem('lms_user');
        return of(null);
      })
    );
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
    this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      localStorage.removeItem('lms_user');
      this.userSignal.set(null);
      this.router.navigate(['/login']);
    });
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('lms_user', JSON.stringify(res.user));
    this.userSignal.set(res.user);
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
