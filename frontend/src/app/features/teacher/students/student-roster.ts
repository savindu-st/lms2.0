import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Enrollment } from '../../../core/models/models';
import { TeacherService } from '../../../core/services/teacher.service';

@Component({
  selector: 'app-student-roster',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container roster-page">
      <div class="page-header">
        <div>
          <span class="badge badge-indigo">Student Enrollment Tracking</span>
          <h1>Enrolled Student Roster</h1>
          <p class="text-secondary">Monitor individual student progress, time-limited access periods, and grant duration extensions.</p>
        </div>

        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search by student name or email..." [(ngModel)]="searchQuery" class="search-input" />
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading student roster...</p>
        </div>
      } @else if (filteredRoster().length === 0) {
        <div class="empty-state card">
          <h3>No students match search criteria</h3>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course / Cohort</th>
                <th>Enrolled Date</th>
                <th>Expires On</th>
                <th>Remaining Access</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (en of filteredRoster(); track en.id) {
                <tr>
                  <td>
                    <strong>{{ en.studentName }}</strong>
                    <div class="text-muted mono-num" style="font-size: 0.775rem;">{{ en.studentEmail }}</div>
                  </td>
                  <td>
                    <strong>{{ en.courseTitle }}</strong>
                    <div class="mono-num text-muted" style="font-size: 0.75rem;">{{ en.courseCode }} ({{ en.monthYear }})</div>
                  </td>
                  <td class="mono-num text-muted">{{ en.enrolledAt | date:'mediumDate' }}</td>
                  <td class="mono-num">{{ en.expiresAt | date:'mediumDate' }}</td>
                  <td>
                    <span
                      class="badge mono-num"
                      [class.badge-emerald]="en.daysRemaining > 15 && !en.isExpired"
                      [class.badge-amber]="en.daysRemaining <= 15 && !en.isExpired"
                      [class.badge-rose]="en.isExpired">
                      {{ en.isExpired ? 'Expired' : en.daysRemaining + ' Days' }}
                    </span>
                  </td>
                  <td>
                    <div class="roster-progress">
                      <div class="progress-bar-bg">
                        <div class="progress-bar-fill" [style.width.%]="en.progressPercentage"></div>
                      </div>
                      <span class="mono-num progress-text">{{ en.progressPercentage }}%</span>
                    </div>
                  </td>
                  <td>
                    <button (click)="openExtendModal(en)" class="btn btn-outline btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      Extend Access
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Extend Access Modal -->
      @if (extendingEnrollment()) {
        <div class="modal-overlay" (click)="extendingEnrollment.set(null)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="extendingEnrollment.set(null)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Extend Time-Limited Access</h3>
            <p class="text-secondary" style="margin-bottom: 1.5rem;">
              Extend student <strong>{{ extendingEnrollment()?.studentName }}</strong>'s access duration for <strong>{{ extendingEnrollment()?.courseTitle }}</strong>.
            </p>

            <form (ngSubmit)="confirmExtend()">
              <div class="form-group">
                <label class="form-label">Select Extension Duration</label>
                <div class="extension-options">
                  <button type="button" class="btn btn-outline" [class.btn-primary]="selectedExtensionDays === 15" (click)="selectedExtensionDays = 15">+ 15 Days</button>
                  <button type="button" class="btn btn-outline" [class.btn-primary]="selectedExtensionDays === 30" (click)="selectedExtensionDays = 30">+ 30 Days</button>
                  <button type="button" class="btn btn-outline" [class.btn-primary]="selectedExtensionDays === 60" (click)="selectedExtensionDays = 60">+ 60 Days</button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Or Enter Custom Days</label>
                <input type="number" class="form-control mono-num" [(ngModel)]="selectedExtensionDays" name="custDays" min="1" max="365" required />
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                <button type="button" (click)="extendingEnrollment.set(null)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-emerald">Confirm Extension</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .roster-page {
      padding: 3rem 1.5rem 5rem;
    }

    .page-header {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    @media (min-width: 768px) {
      .page-header {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.5rem 1rem;
      width: 100%;
      max-width: 320px;
    }

    .search-input {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 0.9rem;
      width: 100%;
      outline: none;
    }

    .roster-progress {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 140px;
    }

    .progress-bar-bg {
      flex: 1;
      height: 6px;
      background: #e2e8f0;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: #059669;
      border-radius: var(--radius-full);
    }

    .progress-text {
      font-size: 0.75rem;
      color: var(--text-secondary);
      width: 32px;
    }

    .extension-options {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .modal-close {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: #f1f5f9;
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
    }

    .modal-close:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-secondary);
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
export class StudentRosterComponent {
  teacherService = inject(TeacherService);

  roster = signal<Enrollment[]>([]);
  loading = signal(true);
  searchQuery = '';

  extendingEnrollment = signal<Enrollment | null>(null);
  selectedExtensionDays = 30;

  filteredRoster = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.roster();
    return this.roster().filter(e =>
      e.studentName.toLowerCase().includes(q) ||
      e.studentEmail.toLowerCase().includes(q) ||
      e.courseTitle.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadRoster();
  }

  loadRoster() {
    this.loading.set(true);
    this.teacherService.getStudentRoster().subscribe({
      next: (data) => {
        this.roster.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openExtendModal(enrollment: Enrollment) {
    this.extendingEnrollment.set(enrollment);
    this.selectedExtensionDays = 30;
  }

  confirmExtend() {
    const en = this.extendingEnrollment();
    if (!en) return;

    this.teacherService.extendAccess(en.id, this.selectedExtensionDays).subscribe({
      next: () => {
        this.extendingEnrollment.set(null);
        this.loadRoster();
      },
      error: (err) => alert(err.error?.message || 'Failed to extend access.')
    });
  }
}
