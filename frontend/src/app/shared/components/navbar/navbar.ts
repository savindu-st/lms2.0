import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
            <span class="brand-title">Vance Academy</span>
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
                Verification Desk
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
          <!-- Demo quick switch pills -->
          <div class="demo-pills" title="Quick demo switch">
            <button
              (click)="quickSwitch('student')"
              class="demo-btn"
              [class.active-role]="authService.isLoggedIn() && authService.isStudent()">
              Demo Student
            </button>
            <button
              (click)="quickSwitch('teacher')"
              class="demo-btn"
              [class.active-role]="authService.isLoggedIn() && authService.isTeacher()">
              Demo Teacher
            </button>
          </div>

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
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 100;
      height: 72px;
      display: flex;
      align-items: center;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
    }

    .nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      text-decoration: none;
    }

    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #4f46e5 0%, #10b981 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-weight: 800;
      font-size: 1.15rem;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link {
      padding: 0.5rem 0.9rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      transition: var(--transition);
      text-decoration: none;
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

    .demo-pills {
      display: flex;
      align-items: center;
      background: #f1f5f9;
      padding: 3px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-subtle);
    }

    .demo-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: var(--transition);
    }

    .demo-btn:hover {
      color: var(--text-primary);
    }

    .demo-btn.active-role {
      background: #ffffff;
      color: #0284c7;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
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
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #059669;
    }

    .role-badge.badge-teacher {
      color: #d97706;
    }

    .btn-logout {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      padding: 0.45rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
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
  router = inject(Router);

  quickSwitch(role: 'student' | 'teacher') {
    this.authService.quickLoginAs(role).subscribe({
      next: () => {
        if (role === 'teacher') {
          this.router.navigate(['/teacher/courses']);
        } else {
          this.router.navigate(['/student/my-courses']);
        }
      },
      error: (err) => console.error('Quick login failed', err)
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
