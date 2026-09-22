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
          <h1>Enrolled Student Roster</h1>
          <p class="text-secondary">Monitor individual student enrollment status, time-limited access validity, and grant duration extensions.</p>
        </div>

        <div class="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <h3>No students match search criteria</h3>
          <p class="text-secondary">Try searching with a different name or email address.</p>
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
                    <div class="text-muted mono-num" style="font-size: 0.75rem;">{{ en.studentEmail }}</div>
                  </td>
                  <td>
                    <span class="font-medium">{{ en.courseTitle }}</span>
                    <div class="mono-num text-muted" style="font-size: 0.6875rem;">{{ en.courseCode }} ({{ en.monthYear }})</div>
                  </td>
                  <td class="mono-num text-muted" style="font-size: 0.8125rem;">{{ en.enrolledAt | date:'mediumDate' }}</td>
                  <td class="mono-num" style="font-size: 0.8125rem;">{{ en.expiresAt | date:'mediumDate' }}</td>
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
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      Extend
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
            <button class="modal-close" (click)="extendingEnrollment.set(null)" title="Close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Extend Access Validity</h3>
            <p class="text-secondary" style="margin-bottom: 1.25rem; font-size: 0.8125rem;">
              Extend access for <strong>{{ extendingEnrollment()?.studentName }}</strong> in <strong>{{ extendingEnrollment()?.courseTitle }}</strong>.
            </p>

            <form (ngSubmit)="confirmExtend()">
              <div class="form-group">
                <label class="form-label">Extension Duration Preset</label>
                <div class="extension-options">
                  <button type="button" class="btn btn-outline btn-sm" [class.active-preset]="selectedExtensionDays === 15" (click)="selectedExtensionDays = 15">+ 15 Days</button>
                  <button type="button" class="btn btn-outline btn-sm" [class.active-preset]="selectedExtensionDays === 30" (click)="selectedExtensionDays = 30">+ 30 Days</button>
                  <button type="button" class="btn btn-outline btn-sm" [class.active-preset]="selectedExtensionDays === 60" (click)="selectedExtensionDays = 60">+ 60 Days</button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Custom Days</label>
                <input type="number" class="form-control mono-num" [(ngModel)]="selectedExtensionDays" name="custDays" min="1" max="365" required />
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" (click)="extendingEnrollment.set(null)" class="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Confirm Extension</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .roster-page {
      padding: 2.5rem 1.5rem 5rem;
    }

    .page-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
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
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.45rem 0.75rem;
      width: 100%;
      max-width: 300px;
      color: var(--text-muted);
      box-shadow: var(--shadow-xs);
      transition: var(--transition);
    }

    .search-box:focus-within {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 1px var(--border-focus);
    }

    .search-icon {
      flex-shrink: 0;
    }

    .search-input {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 0.8125rem;
      width: 100%;
      outline: none;
      font-family: var(--font-sans);
    }

    .roster-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 120px;
    }

    .progress-bar-bg {
      flex: 1;
      height: 5px;
      background: var(--bg-subtle);
      border-radius: var(--radius-full);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--emerald);
      border-radius: var(--radius-full);
    }

    .progress-text {
      font-size: 0.75rem;
      color: var(--text-secondary);
      width: 28px;
    }

    .extension-options {
      display: flex;
      gap: 0.4rem;
      margin-top: 0.25rem;
    }

    .active-preset {
      background: var(--primary) !important;
      color: #ffffff !important;
      border-color: var(--primary) !important;
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
    return this.roster().filter(en => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      return (
        en.studentName.toLowerCase().includes(q) ||
        en.studentEmail.toLowerCase().includes(q) ||
        en.courseTitle.toLowerCase().includes(q) ||
        en.courseCode.toLowerCase().includes(q)
      );
    });
  });

  ngOnInit() {
    this.loadRoster();
  }

  loadRoster() {
    this.loading.set(true);
    this.teacherService.getStudentRoster().subscribe({
      next: (data: Enrollment[]) => {
        this.roster.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openExtendModal(en: Enrollment) {
    this.extendingEnrollment.set(en);
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
      error: (err: any) => {
        alert(err.error?.message || 'Failed to extend access.');
      }
    });
  }
}
