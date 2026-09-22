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
          <h1>My Classroom</h1>
          <p class="text-secondary">Track your active enrolled courses, time-limited access periods, and curriculum progress.</p>
        </div>

        <a routerLink="/" class="btn btn-outline btn-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Browse Masterclasses
        </a>
      </div>

      <!-- Pending Bank Transfers Alert -->
      @if (pendingPayments().length > 0) {
        <div class="pending-alert card">
          <div class="alert-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          </div>
          <div class="alert-content">
            <h4>Bank Transfer Verification in Progress</h4>
            <p class="text-secondary">
              You have submitted {{ pendingPayments().length }} transfer receipt(s). The instructor reviews and approves incoming wire payments regularly.
            </p>
            <div class="pending-slips-list">
              @for (pay of pendingPayments(); track pay.id) {
                <div class="pending-slip-pill">
                  <span class="font-medium">{{ pay.courseTitle }}</span>
                  <span class="mono-num text-muted">Ref: {{ pay.transactionRef }}</span>
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
          <p>Loading your enrolled masterclasses...</p>
        </div>
      } @else if (enrollments().length === 0 && pendingPayments().length === 0) {
        <div class="empty-state card">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <h3>You are not enrolled in any classes yet</h3>
          <p class="text-secondary">Explore current accounting and finance masterclasses to begin your learning curriculum.</p>
          <a routerLink="/" class="btn btn-primary btn-sm" style="margin-top: 0.5rem;">Explore Course Catalog</a>
        </div>
      } @else {
        <div class="enrollments-grid">
          @for (enroll of enrollments(); track enroll.id) {
            <div class="card card-hover enrollment-card" [class.is-expired]="enroll.isExpired">
              <div class="card-header-bar">
                <div class="badge badge-zinc">{{ enroll.monthYear }} Cohort</div>
                <div
                  class="badge mono-num"
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

              <div class="course-info">
                <h3 class="course-title">{{ enroll.courseTitle }}</h3>
                <span class="course-code mono-num">{{ enroll.courseCode }}</span>
              </div>

              <!-- Progress bar -->
              <div class="progress-section">
                <div class="progress-labels">
                  <span>Curriculum Progress</span>
                  <span class="mono-num font-medium">{{ enroll.progressPercentage }}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" [style.width.%]="enroll.progressPercentage"></div>
                </div>
              </div>

              <div class="card-footer-action">
                <div class="validity-info">
                  <span class="label">Access Valid Until</span>
                  <span class="val mono-num">{{ enroll.expiresAt | date:'mediumDate' }}</span>
                </div>

                @if (!enroll.isExpired) {
                  <a [routerLink]="['/student/learn', enroll.courseId]" class="btn btn-emerald btn-sm">
                    Resume &rarr;
                  </a>
                } @else {
                  <button class="btn btn-outline btn-sm" disabled>
                    Expired
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
      padding: 2.5rem 1.5rem 5rem;
    }

    .dash-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
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
      gap: 1rem;
      background: var(--amber-light);
      border: 1px solid var(--amber-border);
      margin-bottom: 2rem;
      align-items: flex-start;
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
    }

    .alert-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .alert-content h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--amber-hover);
      margin-bottom: 0.25rem;
    }

    .alert-content p {
      font-size: 0.8125rem;
    }

    .pending-slips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .pending-slip-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      padding: 0.3rem 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      box-shadow: var(--shadow-xs);
    }

    .enrollments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }

    .enrollment-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
    }

    .enrollment-card.is-expired {
      opacity: 0.7;
      border-color: var(--rose-border);
    }

    .card-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }

    .course-info {
      margin-bottom: 1.25rem;
    }

    .course-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
    }

    .course-code {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
    }

    .progress-section {
      margin-bottom: 1.25rem;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 0.35rem;
    }

    .progress-bar-bg {
      height: 6px;
      background: var(--bg-subtle);
      border-radius: var(--radius-full);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--emerald);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .card-footer-action {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .validity-info {
      display: flex;
      flex-direction: column;
      font-size: 0.75rem;
      line-height: 1.3;
    }

    .validity-info .label {
      color: var(--text-muted);
    }

    .validity-info .val {
      color: var(--text-primary);
      font-weight: 600;
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

    this.paymentService.getMyInvoices().subscribe({
      next: () => {
        // Pending payments check can be extended
      }
    });
  }
}
