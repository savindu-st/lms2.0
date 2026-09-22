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
          <span class="badge badge-indigo">Secure Portal Login</span>
          <h2>Welcome Back</h2>
          <p class="text-secondary">Sign in to your student classroom or instructor dashboard.</p>
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
              placeholder="e.g. student@example.com"
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
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }

    .w-full {
      width: 100%;
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
