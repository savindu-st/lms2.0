import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Enrollment, Payment } from '../../../core/models/models';
import { CourseService } from '../../../core/services/course.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container student-dashboard">
      <div class="dash-header">
        <div>
          <span class="badge badge-emerald">Student Dashboard</span>
          <h1>My Accounting Classroom</h1>
          <p class="text-secondary">Track your enrolled courses, time-limited access validity, and pending approvals.</p>
        </div>

        <a routerLink="/" class="btn btn-outline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Browse More Courses
        </a>
      </div>

      <!-- Pending Bank Transfers Alert -->
      @if (pendingPayments().length > 0) {
        <div class="pending-alert card">
          <div class="alert-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          </div>
          <div class="alert-content">
            <h4>Bank Transfer Verification in Progress</h4>
            <p class="text-secondary">
              You have submitted {{ pendingPayments().length }} transfer slip(s). The academy instructor reviews and approves payments regularly.
            </p>
            <div class="pending-slips-list">
              @for (pay of pendingPayments(); track pay.id) {
                <div class="pending-slip-pill">
                  <strong>{{ pay.courseTitle }}</strong>
                  <span class="mono-num">Ref: {{ pay.transactionRef }}</span>
                  <span class="badge badge-amber">Awaiting Approval</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Enrollments List -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading your enrolled courses...</p>
        </div>
      } @else if (enrollments().length === 0 && pendingPayments().length === 0) {
        <div class="empty-state card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <h3>You are not enrolled in any classes yet</h3>
          <p class="text-secondary">Explore this month's accounting masterclasses to begin your learning journey.</p>
          <a routerLink="/" class="btn btn-primary btn-lg">Explore Course Catalog</a>
        </div>
      } @else {
        <div class="enrollments-grid">
          @for (enroll of enrollments(); track enroll.id) {
            <div class="card card-hover enrollment-card" [class.is-expired]="enroll.isExpired">
              <div class="card-header-bar">
                <div class="badge badge-indigo">{{ enroll.monthYear }}</div>
                <div
                  class="days-badge mono-num"
                  [class.badge-emerald]="enroll.daysRemaining > 15 && !enroll.isExpired"
                  [class.badge-amber]="enroll.daysRemaining <= 15 && !enroll.isExpired"
                  [class.badge-rose]="enroll.isExpired">
                  @if (enroll.isExpired) {
                    <span>Access Expired</span>
                  } @else {
                    <span>{{ enroll.daysRemaining }} Days Left</span>
                  }
                </div>
              </div>

              <h3 class="course-title">{{ enroll.courseTitle }}</h3>
              <span class="course-code mono-num">{{ enroll.courseCode }}</span>

              <!-- Progress bar -->
              <div class="progress-section">
                <div class="progress-labels">
                  <span>Curriculum Progress</span>
                  <span class="mono-num">{{ enroll.progressPercentage }}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" [style.width.%]="enroll.progressPercentage"></div>
                </div>
              </div>

              <div class="card-footer-action">
                <div class="validity-info">
                  <span class="label">Access Valid Until:</span>
                  <span class="val mono-num">{{ enroll.expiresAt | date:'mediumDate' }}</span>
                </div>

                @if (!enroll.isExpired) {
                  <a [routerLink]="['/student/learn', enroll.courseId]" class="btn btn-emerald">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Resume Learning
                  </a>
                } @else {
                  <button class="btn btn-outline" disabled>
                    Expired &bull; Contact Teacher
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .student-dashboard {
      padding: 3rem 1.5rem 5rem;
    }

    .dash-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    @media (min-width: 768px) {
      .dash-header {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }

    .pending-alert {
      display: flex;
      gap: 1.25rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      margin-bottom: 2.5rem;
      align-items: flex-start;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .pending-slips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .pending-slip-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      font-size: 0.85rem;
      box-shadow: var(--shadow-sm);
    }

    .enrollments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.75rem;
    }

    .enrollment-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
    }

    .enrollment-card.is-expired {
      opacity: 0.65;
      border-color: #fecdd3;
    }

    .card-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .course-title {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
    }

    .course-code {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      display: block;
    }

    .progress-section {
      margin-bottom: 1.5rem;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 0.4rem;
    }

    .progress-bar-bg {
      height: 8px;
      background: #e2e8f0;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5 0%, #10b981 100%);
      border-radius: var(--radius-full);
      transition: width 0.4s ease;
    }

    .card-footer-action {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .validity-info {
      display: flex;
      flex-direction: column;
      font-size: 0.775rem;
    }

    .validity-info .label {
      color: var(--text-muted);
    }

    .validity-info .val {
      color: var(--text-primary);
      font-weight: 600;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-secondary);
    }

    .empty-icon {
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    .empty-state p {
      margin-bottom: 1.5rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class MyCoursesComponent {
  courseService = inject(CourseService);
  paymentService = inject(PaymentService);
  authService = inject(AuthService);

  enrollments = signal<Enrollment[]>([]);
  pendingPayments = signal<Payment[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    this.courseService.getMyCourses().subscribe({
      next: (data) => {
        this.enrollments.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // Also check student's payments for any pending bank transfers
    this.paymentService.getMyInvoices().subscribe({
      next: () => {
        // Pending payments check can be extended
      }
    });
  }
}
