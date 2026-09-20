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
          <span class="badge badge-cyan">Academic Evaluation</span>
          <h1>Instructor Gradebook</h1>
          <p class="text-secondary">Review student Excel spreadsheets and PDF solutions, assign grades, and provide feedback.</p>
        </div>

        <div class="status-tabs">
          <button class="status-tab" [class.active]="filterStatus === 'ALL'" (click)="filterStatus = 'ALL'">
            All Submissions
          </button>
          <button class="status-tab" [class.active]="filterStatus === 'PENDING'" (click)="filterStatus = 'PENDING'">
            Pending Review
          </button>
          <button class="status-tab" [class.active]="filterStatus === 'GRADED'" (click)="filterStatus = 'GRADED'">
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
          <h3>No submissions in this view</h3>
          <p class="text-secondary">When students submit homework files from their classroom, they will appear here for grading.</p>
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
                    <div class="text-muted mono-num" style="font-size: 0.775rem;">{{ sub.studentEmail }}</div>
                  </td>
                  <td>{{ sub.assignmentTitle }}</td>
                  <td>
                    <a [href]="sub.submittedFileUrl" target="_blank" download class="file-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      {{ sub.originalFileName }}
                    </a>
                    <div class="text-muted" style="font-size: 0.725rem;">{{ sub.submittedAt | date:'short' }}</div>
                  </td>
                  <td class="notes-col">
                    <span class="text-secondary">{{ sub.studentNotes || 'No notes' }}</span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-indigo]="sub.status === 1" [class.badge-emerald]="sub.status === 2">
                      {{ sub.status === 2 ? 'Graded' : 'Pending Review' }}
                    </span>
                  </td>
                  <td class="mono-num font-bold">
                    @if (sub.status === 2) {
                      <span class="text-emerald">{{ sub.score }} / {{ sub.maxPoints }}</span>
                    } @else {
                      <span class="text-muted">--</span>
                    }
                  </td>
                  <td>
                    <button (click)="openGradeModal(sub)" class="btn btn-primary btn-sm">
                      {{ sub.status === 2 ? 'Update Grade' : 'Grade Submission' }}
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
            <button class="modal-close" (click)="gradingSubmission.set(null)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Grade Assignment</h3>
            <p class="text-secondary" style="margin-bottom: 1.5rem;">
              {{ gradingSubmission()?.studentName }} &bull; {{ gradingSubmission()?.assignmentTitle }}
            </p>

            <form (ngSubmit)="confirmGrade()">
              <div class="form-group">
                <label class="form-label">Score (Max {{ gradingSubmission()?.maxPoints }} Points) *</label>
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
                <label class="form-label">Feedback & Instructor Comments</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="gradeFeedback"
                  name="gFeedback"
                  rows="4"
                  placeholder="e.g. Excellent classification of assets and liabilities. Keep an eye on depreciation expense adjustments..."></textarea>
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                <button type="button" (click)="gradingSubmission.set(null)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-emerald">Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .gradebook-page {
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

    .status-tabs {
      display: flex;
      background: var(--bg-surface);
      padding: 3px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }

    .status-tab {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.825rem;
      font-weight: 600;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
    }

    .status-tab.active {
      background: var(--primary);
      color: #ffffff;
    }

    .file-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: #0284c7;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .file-link:hover {
      color: #0369a1;
      text-decoration: underline;
    }

    .notes-col {
      max-width: 200px;
      font-size: 0.85rem;
    }

    .text-emerald { color: #059669; }
    .font-bold { font-weight: 700; }

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
export class GradebookComponent {
  teacherService = inject(TeacherService);

  submissions = signal<AssignmentSubmission[]>([]);
  loading = signal(true);
  filterStatus = 'ALL';

  gradingSubmission = signal<AssignmentSubmission | null>(null);
  gradeScore = 95;
  gradeFeedback = '';

  filteredSubmissions = computed(() => {
    if (this.filterStatus === 'PENDING') {
      return this.submissions().filter(s => s.status === 1);
    }
    if (this.filterStatus === 'GRADED') {
      return this.submissions().filter(s => s.status === 2);
    }
    return this.submissions();
  });

  ngOnInit() {
    this.loadSubmissions();
  }

  loadSubmissions() {
    this.loading.set(true);
    this.teacherService.getSubmissions().subscribe({
      next: (data) => {
        this.submissions.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openGradeModal(sub: AssignmentSubmission) {
    this.gradingSubmission.set(sub);
    this.gradeScore = sub.score !== undefined && sub.score !== null ? sub.score : (sub.maxPoints || 100);
    this.gradeFeedback = sub.teacherFeedback || 'Well structured and accurate accounting adjustments.';
  }

  confirmGrade() {
    const sub = this.gradingSubmission();
    if (!sub) return;

    this.teacherService.gradeSubmission(sub.id, this.gradeScore, this.gradeFeedback).subscribe({
      next: () => {
        this.gradingSubmission.set(null);
        this.loadSubmissions();
      },
      error: (err) => alert(err.error?.message || 'Failed to save grade.')
    });
  }
}
