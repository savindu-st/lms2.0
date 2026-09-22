import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <div class="auth-header">
          <h2>Sign in to your account</h2>
          <p class="text-secondary">Enter your email and password to access your courses and dashboard.</p>
        </div>

        @if (errorMessage()) {
          <div class="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="login()" class="auth-form">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="name@example.com"
              autocomplete="email"
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
              autocomplete="current-password"
              required />
          </div>

          <button type="submit" [disabled]="loading()" class="btn btn-primary btn-lg w-full">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">
          <span>Don't have an account yet?</span>
          <a routerLink="/register" class="auth-link">Create an account</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
    }

    .auth-card {
      max-width: 420px;
      width: 100%;
      padding: 2.25rem;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .auth-header h2 {
      font-size: 1.375rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-bottom: 0.35rem;
    }

    .auth-header p {
      font-size: 0.8125rem;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--rose-light);
      border: 1px solid var(--rose-border);
      color: var(--rose);
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      margin-bottom: 1.25rem;
      font-weight: 500;
    }

    .error-icon {
      flex-shrink: 0;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.8125rem;
      color: var(--text-secondary);
      display: flex;
      justify-content: center;
      gap: 0.35rem;
    }

    .auth-link {
      color: var(--text-primary);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .auth-link:hover {
      color: var(--primary-hover);
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

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
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        const enrollCourseId = this.route.snapshot.queryParams['enrollCourseId'];

        if (returnUrl) {
          this.router.navigate([returnUrl], {
            queryParams: enrollCourseId ? { enroll: enrollCourseId } : {}
          });
          return;
        }

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
}
