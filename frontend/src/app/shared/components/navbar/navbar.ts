import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SystemService } from '../../../core/services/system.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="container nav-container">
        <!-- Brand Mark -->
        <a routerLink="/" class="nav-brand">
          <div class="brand-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              <line x1="9" y1="7" x2="15" y2="7"></line>
              <line x1="9" y1="11" x2="13" y2="11"></line>
            </svg>
          </div>
          <div class="brand-meta">
            <span class="brand-title">{{ systemService.academyName() }}</span>
            <span class="brand-sub">Academy</span>
          </div>
        </a>

        <!-- Nav Links -->
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
            Catalog
          </a>

          @if (authService.isLoggedIn()) {
            @if (authService.isStudent()) {
              <a routerLink="/student/my-courses" routerLinkActive="active" class="nav-link">
                My Classroom
              </a>
              <a routerLink="/student/invoices" routerLinkActive="active" class="nav-link">
                Invoices & Billing
              </a>
            }

            @if (authService.isTeacher()) {
              <a routerLink="/teacher/courses" routerLinkActive="active" class="nav-link">
                Course Studio
              </a>
              <a routerLink="/teacher/payments" routerLinkActive="active" class="nav-link">
                Bank Verification
              </a>
              <a routerLink="/teacher/students" routerLinkActive="active" class="nav-link">
                Student Roster
              </a>
              <a routerLink="/teacher/gradebook" routerLinkActive="active" class="nav-link">
                Gradebook
              </a>
            }
          }
        </div>

        <!-- User Menu / CTA -->
        <div class="nav-actions">
          @if (authService.isLoggedIn()) {
            <div class="user-pill">
              <div class="user-avatar">
                {{ userInitials() }}
              </div>
              <div class="user-details">
                <span class="user-name">{{ authService.currentUser()?.fullName }}</span>
                <span class="user-role" [class.is-teacher]="authService.isTeacher()">
                  <span class="status-dot"></span>
                  {{ authService.isTeacher() ? 'Instructor' : 'Student' }}
                </span>
              </div>
              <button (click)="logout()" class="btn-logout" title="Sign out" aria-label="Sign out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          } @else {
            <div class="auth-btns">
              <a routerLink="/login" class="btn btn-outline btn-sm">Log In</a>
              <a routerLink="/register" class="btn btn-primary btn-sm">Enroll Now</a>
            </div>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      height: 64px;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-container {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      text-decoration: none;
      color: inherit;
    }

    .brand-logo {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-md);
      background: var(--primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-xs);
    }

    .brand-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .brand-title {
      font-size: 0.9375rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: var(--text-primary);
    }

    .brand-sub {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-link {
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      transition: var(--transition);
    }

    .nav-link:hover {
      color: var(--text-primary);
      background: var(--bg-subtle);
    }

    .nav-link.active {
      color: var(--text-primary);
      background: #e4e4e7;
      font-weight: 600;
    }

    .nav-actions {
      display: flex;
      align-items: center;
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.25rem 0.35rem 0.25rem 0.65rem;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      box-shadow: var(--shadow-xs);
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: var(--font-mono);
    }

    .user-details {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      max-width: 130px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--emerald);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .user-role.is-teacher {
      color: var(--amber);
    }

    .status-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
    }

    .btn-logout {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
      margin-left: 0.25rem;
    }

    .btn-logout:hover {
      background: var(--rose-light);
      border-color: var(--rose-border);
      color: var(--rose);
    }

    .auth-btns {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  systemService = inject(SystemService);
  router = inject(Router);

  userInitials(): string {
    const name = this.authService.currentUser()?.fullName || 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
