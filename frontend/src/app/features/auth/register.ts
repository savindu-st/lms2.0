import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <div class="auth-header">
          <span class="badge badge-emerald">New Student Enrollment</span>
          <h2>Create Your Account</h2>
          <p class="text-secondary">Join Vance Academy to enroll in monthly courses and access classroom materials.</p>
        </div>

        @if (errorMessage()) {
          <div class="error-banner">
            {{ errorMessage() }}
          </div>
        }

        <form (ngSubmit)="register()">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="fullName"
              name="fullName"
              placeholder="e.g. Alex Reynolds"
              required />
          </div>

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
            <label class="form-label">Password (Min 6 characters)</label>
            <input
              type="password"
              class="form-control"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              minlength="6"
              required />
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number (Optional)</label>
            <input
              type="tel"
              class="form-control"
              [(ngModel)]="phone"
              name="phone"
              placeholder="+1 (555) 000-0000" />
          </div>

          <button type="submit" [disabled]="loading()" class="btn btn-primary btn-lg w-full">
            {{ loading() ? 'Creating account...' : 'Complete Registration' }}
          </button>
        </form>

        <div class="auth-footer">
          <span>Already registered?</span>
          <a routerLink="/login">Log in here</a>
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
      max-width: 480px;
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
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  phone = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  register() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      phoneNumber: this.phone
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/student/my-courses']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed.');
      }
    });
  }
}
