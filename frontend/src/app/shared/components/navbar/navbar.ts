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
        <a routerLink="/" class="nav-brand">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              <line x1="8" y1="7" x2="16" y2="7"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-title">{{ systemService.academyName() }}</span>
            <span class="brand-subtitle">Accounting & Finance</span>
          </div>
        </a>

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

        <div class="nav-actions">
          @if (authService.isLoggedIn()) {
            <div class="user-menu">
              <div class="user-info">
                <span class="user-name">{{ authService.currentUser()?.fullName }}</span>
                <span class="role-badge" [class.badge-teacher]="authService.isTeacher()">
                  {{ authService.isTeacher() ? 'Instructor' : 'Student' }}
                </span>
              </div>
              <button (click)="logout()" class="btn-logout" title="Log out">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      height: 72px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }

    .nav-container {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #4f46e5 0%, #0284c7 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .brand-subtitle {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link {
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-decoration: none;
      transition: var(--transition);
    }

    .nav-link:hover {
      color: var(--text-primary);
      background: #f1f5f9;
    }

    .nav-link.active {
      color: var(--primary);
      background: var(--primary-light);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .role-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #059669;
      background: #ecfdf5;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
    }

    .role-badge.badge-teacher {
      color: #d97706;
      background: #fffbeb;
    }

    .btn-logout {
      background: #f1f5f9;
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-logout:hover {
      background: #fff1f2;
      border-color: #fecdd3;
      color: #e11d48;
    }

    .auth-btns {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  systemService = inject(SystemService);
  router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
