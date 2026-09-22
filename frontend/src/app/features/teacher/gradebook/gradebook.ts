import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssignmentSubmission } from '../../../core/models/models';
import { TeacherService } from '../../../core/services/teacher.service';

@Component({
  selector: 'app-gradebook',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container gradebook-page">
      <div class="page-header">
        <div>
          <h1>Instructor Gradebook</h1>
          <p class="text-secondary">Review student spreadsheet models and PDF exercises, assign grades, and provide feedback.</p>
        </div>

        <div class="segmented-control">
          <button class="segmented-btn" [class.active]="filterStatus === 'ALL'" (click)="filterStatus = 'ALL'">
            All Submissions
          </button>
          <button class="segmented-btn" [class.active]="filterStatus === 'PENDING'" (click)="filterStatus = 'PENDING'">
            Pending Review
          </button>
          <button class="segmented-btn" [class.active]="filterStatus === 'GRADED'" (click)="filterStatus = 'GRADED'">
            Graded
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading student submissions...</p>
        </div>
      } @else if (filteredSubmissions().length === 0) {
        <div class="empty-state card">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          <h3>No submissions in this view</h3>
          <p class="text-secondary">When enrolled students submit homework tasks, they will appear here for grading.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Assignment</th>
                <th>Submitted File</th>
                <th>Student Notes</th>
                <th>Status</th>
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (sub of filteredSubmissions(); track sub.id) {
                <tr>
                  <td>
                    <strong>{{ sub.studentName }}</strong>
                    <div class="text-muted mono-num" style="font-size: 0.75rem;">{{ sub.studentEmail }}</div>
                  </td>
                  <td>
                    <span class="font-medium">{{ sub.assignmentTitle }}</span>
                  </td>
                  <td>
                    <a [href]="sub.submittedFileUrl" target="_blank" download class="file-link">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      {{ sub.originalFileName }}
                    </a>
                    <div class="text-muted" style="font-size: 0.6875rem;">{{ sub.submittedAt | date:'short' }}</div>
                  </td>
                  <td class="notes-col">
                    <span class="text-secondary">{{ sub.studentNotes || 'No notes provided' }}</span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-zinc]="sub.status === 1" [class.badge-emerald]="sub.status === 2">
                      {{ sub.status === 2 ? 'Graded' : 'Pending' }}
                    </span>
                  </td>
                  <td class="mono-num font-bold">
                    @if (sub.status === 2) {
                      <span class="text-emerald">{{ sub.score }} / {{ sub.maxPoints }}</span>
                    } @else {
                      <span class="text-muted" style="font-weight: normal;">--</span>
                    }
                  </td>
                  <td>
                    <button (click)="openGradeModal(sub)" class="btn btn-outline btn-sm">
                      {{ sub.status === 2 ? 'Update' : 'Grade' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Grade Modal -->
      @if (gradingSubmission()) {
        <div class="modal-overlay" (click)="gradingSubmission.set(null)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="gradingSubmission.set(null)" title="Close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Grade Assignment</h3>
            <p class="text-secondary" style="margin-bottom: 1.25rem; font-size: 0.8125rem;">
              {{ gradingSubmission()?.studentName }} &bull; {{ gradingSubmission()?.assignmentTitle }}
            </p>

            <form (ngSubmit)="confirmGrade()">
              <div class="form-group">
                <label class="form-label">Score (Max: {{ gradingSubmission()?.maxPoints }} Points) *</label>
                <input
                  type="number"
                  class="form-control mono-num"
                  [(ngModel)]="gradeScore"
                  name="gScore"
                  min="0"
                  [max]="gradingSubmission()?.maxPoints || 100"
                  required />
              </div>

              <div class="form-group">
                <label class="form-label">Feedback & Explanations</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="gradeFeedback"
                  name="gFeedback"
                  rows="3"
                  placeholder="e.g. Accurate financial ratios. Be mindful of cash cycle adjustments..."></textarea>
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" (click)="gradingSubmission.set(null)" class="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .gradebook-page {
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

    .segmented-control {
      display: flex;
      background: var(--bg-subtle);
      padding: 3px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }

    .segmented-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-sans);
    }

    .segmented-btn:hover {
      color: var(--text-primary);
    }

    .segmented-btn.active {
      background: #ffffff;
      color: var(--text-primary);
      font-weight: 600;
      box-shadow: var(--shadow-xs);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .file-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.8125rem;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .file-link:hover {
      color: var(--primary-hover);
    }

    .notes-col {
      max-width: 180px;
      font-size: 0.75rem;
    }
  `]
})
export class GradebookComponent {
  teacherService = inject(TeacherService);

  submissions = signal<AssignmentSubmission[]>([]);
  loading = signal(true);
  filterStatus = 'ALL';

  gradingSubmission = signal<AssignmentSubmission | null>(null);
  gradeScore = 0;
  gradeFeedback = '';

  filteredSubmissions = computed(() => {
    return this.submissions().filter(s => {
      if (this.filterStatus === 'ALL') return true;
      if (this.filterStatus === 'PENDING') return s.status === 1;
      if (this.filterStatus === 'GRADED') return s.status === 2;
      return true;
    });
  });

  ngOnInit() {
    this.loadSubmissions();
  }

  loadSubmissions() {
    this.loading.set(true);
    this.teacherService.getSubmissions().subscribe({
      next: (data: AssignmentSubmission[]) => {
        this.submissions.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openGradeModal(sub: AssignmentSubmission) {
    this.gradingSubmission.set(sub);
    this.gradeScore = sub.score || 0;
    this.gradeFeedback = sub.teacherFeedback || '';
  }

  confirmGrade() {
    const sub = this.gradingSubmission();
    if (!sub) return;

    this.teacherService.gradeSubmission(sub.id, this.gradeScore, this.gradeFeedback).subscribe({
      next: () => {
        this.gradingSubmission.set(null);
        this.loadSubmissions();
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to save grade.');
      }
    });
  }
}
