import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <div class="auth-header">
          <span class="badge badge-indigo">Secure Portal Login</span>
          <h2>Welcome Back</h2>
          <p class="text-secondary">Sign in to your accounting classroom or instructor dashboard.</p>
        </div>

        @if (errorMessage()) {
          <div class="error-banner">
            {{ errorMessage() }}
          </div>
        }

        <form (ngSubmit)="login()">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="e.g. alex@example.com"
              required />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input
              type="password"
              class="form-control"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required />
          </div>

          <button type="submit" [disabled]="loading()" class="btn btn-primary btn-lg w-full">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Quick 1-Click Demo Logins -->
        <div class="demo-login-section">
          <div class="divider">
            <span>Or test with 1-click demo profiles</span>
          </div>

          <div class="demo-buttons">
            <button (click)="demoLogin('teacher')" type="button" class="btn btn-outline demo-role-btn">
              <span class="badge badge-amber">Instructor</span>
              <span>Prof. Vance (Teacher)</span>
            </button>
            <button (click)="demoLogin('student')" type="button" class="btn btn-outline demo-role-btn">
              <span class="badge badge-emerald">Student</span>
              <span>Alex Reynolds (Student)</span>
            </button>
          </div>
        </div>

        <div class="auth-footer">
          <span>Don't have an account?</span>
          <a routerLink="/register">Register here</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 72px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
    }

    .auth-card {
      max-width: 460px;
      width: 100%;
      padding: 2.5rem;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-header h2 {
      margin: 0.5rem 0 0.25rem;
    }

    .error-banner {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      color: #9f1239;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }

    .w-full {
      width: 100%;
    }

    .demo-login-section {
      margin-top: 2rem;
    }

    .divider {
      text-align: center;
      position: relative;
      margin-bottom: 1.25rem;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border-subtle);
      z-index: 1;
    }

    .divider span {
      position: relative;
      z-index: 2;
      background: var(--bg-card);
      padding: 0 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .demo-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .demo-role-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
    }

    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      display: flex;
      justify-content: center;
      gap: 0.35rem;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  login() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.user.role === 2) {
          this.router.navigate(['/teacher/courses']);
        } else {
          this.router.navigate(['/student/my-courses']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid email or password.');
      }
    });
  }

  demoLogin(role: 'teacher' | 'student') {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.authService.quickLoginAs(role).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.user.role === 2) {
          this.router.navigate(['/teacher/courses']);
        } else {
          this.router.navigate(['/student/my-courses']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Demo login failed.');
      }
    });
  }
}
