import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Course, CourseDetail, TeacherAnalytics } from '../../../core/models/models';
import { TeacherService } from '../../../core/services/teacher.service';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container teacher-page">
      <!-- Analytics Header Cards -->
      <div class="analytics-grid">
        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Total Academy Revenue</span>
            <span class="stat-icon emerald-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </span>
          </div>
          <div class="stat-val mono-num text-emerald">\${{ analytics()?.totalRevenue | number:'1.2-2' }}</div>
          <span class="stat-sub text-muted">This month: \${{ analytics()?.currentMonthRevenue | number:'1.2-2' }}</span>
        </div>

        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Active Enrolled Students</span>
            <span class="stat-icon indigo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
          </div>
          <div class="stat-val mono-num">{{ analytics()?.activeStudentsCount }}</div>
          <span class="stat-sub text-muted">{{ courses().length }} Monthly Courses Published</span>
        </div>

        <div class="card stat-card alert-clickable" routerLink="/teacher/payments">
          <div class="stat-top">
            <span class="stat-label">Pending Bank Slips</span>
            <span class="stat-icon amber-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            </span>
          </div>
          <div class="stat-val mono-num text-amber">{{ analytics()?.pendingBankTransfersCount }}</div>
          <span class="stat-sub stat-link">Review Verification Desk &rarr;</span>
        </div>

        <div class="card stat-card alert-clickable" routerLink="/teacher/gradebook">
          <div class="stat-top">
            <span class="stat-label">Submissions to Grade</span>
            <span class="stat-icon cyan-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </span>
          </div>
          <div class="stat-val mono-num text-cyan">{{ analytics()?.pendingSubmissionsCount }}</div>
          <span class="stat-sub stat-link">Open Student Gradebook &rarr;</span>
        </div>
      </div>

      <!-- Management Header -->
      <div class="dash-management-header">
        <div>
          <h2>Course Management Studio</h2>
          <p class="text-secondary">Create new monthly cohorts, update pricing & duration, and build curriculum lessons.</p>
        </div>

        <button (click)="openCreateCourseModal()" class="btn btn-primary btn-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add New Monthly Class
        </button>
      </div>

      <!-- Courses Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading course studio...</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Batch / Code</th>
                <th>Course Title</th>
                <th>Tuition Fee</th>
                <th>Validity</th>
                <th>Curriculum</th>
                <th>Active Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of courses(); track c.id) {
                <tr>
                  <td>
                    <span class="badge badge-indigo">{{ c.monthYear }}</span>
                    <div class="mono-num text-muted" style="font-size: 0.75rem; margin-top: 2px;">{{ c.courseCode }}</div>
                  </td>
                  <td>
                    <strong>{{ c.title }}</strong>
                  </td>
                  <td class="mono-num text-emerald font-bold">\${{ c.price | number:'1.2-2' }}</td>
                  <td class="mono-num">{{ c.accessDurationDays }} Days</td>
                  <td>
                    <span class="text-secondary">{{ c.modulesCount }} Mods &bull; {{ c.lessonsCount }} Lessons</span>
                  </td>
                  <td class="mono-num">{{ c.activeStudentsCount }} Enrolled</td>
                  <td>
                    <span class="badge" [class.badge-emerald]="c.isPublished" [class.badge-muted]="!c.isPublished">
                      {{ c.isPublished ? 'Published' : 'Draft' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button (click)="openCurriculumBuilder(c)" class="btn btn-primary btn-sm" title="Manage Modules & Lessons">
                        Curriculum
                      </button>
                      <button (click)="openEditCourse(c)" class="btn btn-outline btn-sm" title="Edit Course Details">
                        Edit
                      </button>
                      <button (click)="deleteCourse(c)" class="btn btn-danger btn-sm" title="Delete Course">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Create / Edit Course Modal -->
      @if (showCourseModal()) {
        <div class="modal-overlay" (click)="onModalBackdrop($event)">
          <div class="modal-content">
            <button class="modal-close" (click)="showCourseModal.set(false)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>{{ isEditing() ? 'Update Monthly Class' : 'Create New Monthly Class' }}</h3>
            <p class="text-secondary" style="margin-bottom: 1.5rem;">Configure class details, monthly cohort label, fee, and student access duration.</p>

            <form (ngSubmit)="saveCourse()">
              <div class="form-group">
                <label class="form-label">Course Title *</label>
                <input type="text" class="form-control" [(ngModel)]="courseForm.title" name="cTitle" placeholder="e.g. December 2026: Advanced Auditing & Risk Modeling" required />
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label class="form-label">Course Code *</label>
                  <input type="text" class="form-control mono-num" [(ngModel)]="courseForm.courseCode" name="cCode" placeholder="e.g. ACC-2026-12" required />
                </div>
                <div class="form-group half">
                  <label class="form-label">Month & Year Cohort *</label>
                  <input type="text" class="form-control" [(ngModel)]="courseForm.monthYear" name="cMonth" placeholder="e.g. December 2026" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label class="form-label">Tuition Fee ($ USD) *</label>
                  <input type="number" class="form-control mono-num" [(ngModel)]="courseForm.price" name="cPrice" min="0" step="1" required />
                </div>
                <div class="form-group half">
                  <label class="form-label">Access Duration (Days) *</label>
                  <input type="number" class="form-control mono-num" [(ngModel)]="courseForm.accessDurationDays" name="cDays" min="1" max="365" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Course Description</label>
                <textarea class="form-control" [(ngModel)]="courseForm.description" name="cDesc" rows="3" placeholder="Outline of accounting concepts covered..."></textarea>
              </div>

              <div class="form-group" style="display: flex; flex-direction: row; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                <input type="checkbox" id="pubCheck" [(ngModel)]="courseForm.isPublished" name="cPub" />
                <label for="pubCheck" class="form-label" style="margin-bottom: 0;">Publish immediately to Course Catalog</label>
              </div>

              <div class="modal-footer" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" (click)="showCourseModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="savingCourse()" class="btn btn-primary">
                  {{ savingCourse() ? 'Saving...' : (isEditing() ? 'Save Changes' : 'Create Class') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Curriculum Builder Modal -->
      @if (activeCurriculumCourse()) {
        <div class="modal-overlay" (click)="onCurriculumBackdrop($event)">
          <div class="modal-content modal-content-lg curriculum-builder-modal">
            <button class="modal-close" (click)="activeCurriculumCourse.set(null)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div class="builder-header">
              <span class="badge badge-indigo">{{ activeCurriculumCourse()?.monthYear }}</span>
              <h2>Curriculum Builder: {{ activeCurriculumCourse()?.title }}</h2>
              <p class="text-secondary">Add chapters, modules, video lecture streams, downloadable Excel templates, and assessment quizzes.</p>
            </div>

            <!-- Add Module Inline Form -->
            <div class="add-module-bar">
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newModuleTitle"
                placeholder="New Module Title (e.g. Module 3: Corporate Cash Flow Analysis)..." />
              <button (click)="addModule()" [disabled]="!newModuleTitle" class="btn btn-primary">
                + Add Module
              </button>
            </div>

            <!-- Modules Tree -->
            <div class="builder-modules-list">
              @for (mod of curriculumDetail()?.modules; track mod.id) {
                <div class="builder-module-card card">
                  <div class="module-bar">
                    <div class="bar-left">
                      <span class="mod-pill">Module {{ mod.orderIndex }}</span>
                      <h4>{{ mod.title }}</h4>
                    </div>
                    <div class="bar-right">
                      <button (click)="openAddLessonModal(mod.id)" class="btn btn-emerald btn-sm">
                        + Add Lesson
                      </button>
                      <button (click)="deleteModule(mod.id)" class="btn btn-outline btn-sm text-rose" title="Delete Module">
                        Delete
                      </button>
                    </div>
                  </div>

                  <!-- Module Lessons -->
                  <div class="builder-lessons">
                    @if (mod.lessons.length === 0) {
                      <p class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">No lessons in this module yet. Click "+ Add Lesson".</p>
                    }
                    @for (les of mod.lessons; track les.id) {
                      <div class="builder-lesson-row">
                        <div class="b-les-info">
                          <span class="badge badge-cyan" [ngSwitch]="les.contentType">
                            <span *ngSwitchCase="1">Video</span>
                            <span *ngSwitchCase="2">Reading</span>
                            <span *ngSwitchCase="3">Quiz</span>
                            <span *ngSwitchCase="4">Assignment</span>
                          </span>
                          <span class="les-title">{{ les.title }}</span>
                          <span class="text-muted mono-num" *ngIf="les.durationMinutes">({{ les.durationMinutes }}m)</span>
                        </div>

                        <div class="b-les-actions">
                          <button *ngIf="les.contentType === 3" (click)="openAddQuizQuestion(les.id)" class="btn btn-outline btn-sm" title="Add Quiz Question">
                            + Add Question ({{ les.questionsCount }})
                          </button>
                          <button (click)="deleteLesson(les.id)" class="btn btn-outline btn-sm text-rose">
                            Remove
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Add Lesson Modal -->
      @if (showLessonModal()) {
        <div class="modal-overlay" (click)="showLessonModal.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="showLessonModal.set(false)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Add Lesson to Module</h3>
            <form (ngSubmit)="saveLesson()">
              <div class="form-group">
                <label class="form-label">Lesson Title *</label>
                <input type="text" class="form-control" [(ngModel)]="lessonForm.title" name="lTitle" required placeholder="e.g. 2.1 Cash Flow Statement Indirect Method" />
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label class="form-label">Lesson Type</label>
                  <select class="form-control" [(ngModel)]="lessonForm.contentType" name="lType">
                    <option [value]="1">Video Lecture</option>
                    <option [value]="2">Reading / Document</option>
                    <option [value]="3">Assessment Quiz</option>
                    <option [value]="4">Homework Assignment</option>
                  </select>
                </div>
                <div class="form-group half">
                  <label class="form-label">Duration (Minutes)</label>
                  <input type="number" class="form-control mono-num" [(ngModel)]="lessonForm.durationMinutes" name="lDur" min="1" />
                </div>
              </div>

              @if (lessonForm.contentType === 1) {
                <div class="form-group">
                  <label class="form-label">Video Stream URL (YouTube, Vimeo, or Direct MP4)</label>
                  <input type="text" class="form-control" [(ngModel)]="lessonForm.videoUrl" name="lVid" placeholder="https://www.youtube.com/watch?v=..." />
                </div>
              }

              <div class="form-group">
                <label class="form-label">Lecture Notes / Text Content</label>
                <textarea class="form-control" [(ngModel)]="lessonForm.contentText" name="lText" rows="3" placeholder="Key takeaways, formulas, references..."></textarea>
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" (click)="showLessonModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-emerald">Save Lesson</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Add Quiz Question Modal -->
      @if (showQuizModal()) {
        <div class="modal-overlay" (click)="showQuizModal.set(false)">
          <div class="modal-content modal-content-lg" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="showQuizModal.set(false)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Add Quiz Question</h3>
            <form (ngSubmit)="saveQuizQuestion()">
              <div class="form-group">
                <label class="form-label">Question Text *</label>
                <textarea class="form-control" [(ngModel)]="quizForm.questionText" name="qText" rows="2" placeholder="e.g. When recognizing depreciation expense under straight-line method, what entry is made?" required></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Option A *</label>
                <input type="text" class="form-control" [(ngModel)]="quizForm.optionA" name="optA" required />
              </div>

              <div class="form-group">
                <label class="form-label">Option B *</label>
                <input type="text" class="form-control" [(ngModel)]="quizForm.optionB" name="optB" required />
              </div>

              <div class="form-group">
                <label class="form-label">Option C *</label>
                <input type="text" class="form-control" [(ngModel)]="quizForm.optionC" name="optC" required />
              </div>

              <div class="form-group">
                <label class="form-label">Option D *</label>
                <input type="text" class="form-control" [(ngModel)]="quizForm.optionD" name="optD" required />
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label class="form-label">Correct Option *</label>
                  <select class="form-control" [(ngModel)]="quizForm.correctOptionIndex" name="qCorrect">
                    <option [value]="0">Option A</option>
                    <option [value]="1">Option B</option>
                    <option [value]="2">Option C</option>
                    <option [value]="3">Option D</option>
                  </select>
                </div>
                <div class="form-group half">
                  <label class="form-label">Points</label>
                  <input type="number" class="form-control mono-num" [(ngModel)]="quizForm.points" name="qPts" min="1" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Explanation (Shown after submission)</label>
                <textarea class="form-control" [(ngModel)]="quizForm.explanation" name="qExp" rows="2" placeholder="Why this option is correct..."></textarea>
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" (click)="showQuizModal.set(false)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-emerald">Add Question</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .teacher-page {
      padding: 3rem 1.5rem 5rem;
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      padding: 1.25rem 1.5rem;
    }

    .stat-card.alert-clickable {
      cursor: pointer;
    }

    .stat-card.alert-clickable:hover {
      border-color: rgba(245, 158, 11, 0.4);
    }

    .stat-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .emerald-icon { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .indigo-icon { background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe; }
    .amber-icon { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .cyan-icon { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }

    .stat-val {
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
    }

    .stat-sub {
      font-size: 0.785rem;
    }

    .stat-link {
      color: #0284c7;
      font-weight: 600;
    }

    .text-emerald { color: #059669; }
    .text-amber { color: #d97706; }
    .text-cyan { color: #0284c7; }
    .text-rose { color: #e11d48; }
    .font-bold { font-weight: 700; }

    .dash-management-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    @media (min-width: 768px) {
      .dash-management-header {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }

    .action-btns {
      display: flex;
      gap: 0.4rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-row .half {
      flex: 1;
    }

    .curriculum-builder-modal {
      max-height: 85vh;
    }

    .builder-header {
      margin-bottom: 1.5rem;
    }

    .add-module-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .builder-modules-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .builder-module-card {
      padding: 1.25rem;
      background: var(--bg-surface);
    }

    .module-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .bar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mod-pill {
      font-size: 0.725rem;
      font-weight: 800;
      color: #4f46e5;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .bar-right {
      display: flex;
      gap: 0.5rem;
    }

    .builder-lessons {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .builder-lesson-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.85rem;
      background: var(--bg-card);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }

    .b-les-info {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.875rem;
    }

    .b-les-actions {
      display: flex;
      gap: 0.4rem;
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

    .loading-state {
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
export class TeacherCoursesComponent {
  teacherService = inject(TeacherService);

  courses = signal<Course[]>([]);
  analytics = signal<TeacherAnalytics | null>(null);
  loading = signal(true);

  // Create / Edit Course State
  showCourseModal = signal(false);
  isEditing = signal(false);
  editingCourseId: string | null = null;
  savingCourse = signal(false);

  courseForm = {
    title: '',
    courseCode: '',
    monthYear: '',
    price: 129,
    accessDurationDays: 45,
    description: '',
    thumbnailUrl: '',
    isPublished: true
  };

  // Curriculum Builder State
  activeCurriculumCourse = signal<Course | null>(null);
  curriculumDetail = signal<CourseDetail | null>(null);
  newModuleTitle = '';

  // Lesson Modal
  showLessonModal = signal(false);
  targetModuleId: string | null = null;
  lessonForm = {
    title: '',
    contentType: 1,
    durationMinutes: 30,
    videoUrl: '',
    contentText: ''
  };

  // Quiz Modal
  showQuizModal = signal(false);
  targetLessonId: string | null = null;
  quizForm = {
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOptionIndex: 0,
    points: 2,
    explanation: ''
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.teacherService.getAnalytics().subscribe({
      next: (an) => this.analytics.set(an)
    });

    this.teacherService.getTeacherCourses().subscribe({
      next: (data) => {
        this.courses.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateCourseModal() {
    this.isEditing.set(false);
    this.editingCourseId = null;
    this.courseForm = {
      title: '',
      courseCode: '',
      monthYear: '',
      price: 129,
      accessDurationDays: 45,
      description: '',
      thumbnailUrl: '',
      isPublished: true
    };
    this.showCourseModal.set(true);
  }

  openEditCourse(course: Course) {
    this.isEditing.set(true);
    this.editingCourseId = course.id;
    this.courseForm = {
      title: course.title,
      courseCode: course.courseCode,
      monthYear: course.monthYear,
      price: course.price,
      accessDurationDays: course.accessDurationDays,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl || '',
      isPublished: course.isPublished
    };
    this.showCourseModal.set(true);
  }

  saveCourse() {
    this.savingCourse.set(true);
    if (this.isEditing() && this.editingCourseId) {
      this.teacherService.updateCourse(this.editingCourseId, this.courseForm).subscribe({
        next: () => {
          this.savingCourse.set(false);
          this.showCourseModal.set(false);
          this.loadData();
        },
        error: () => this.savingCourse.set(false)
      });
    } else {
      this.teacherService.createCourse(this.courseForm).subscribe({
        next: () => {
          this.savingCourse.set(false);
          this.showCourseModal.set(false);
          this.loadData();
        },
        error: () => this.savingCourse.set(false)
      });
    }
  }

  deleteCourse(course: Course) {
    if (confirm(`Are you sure you want to delete ${course.title}?`)) {
      this.teacherService.deleteCourse(course.id).subscribe({
        next: () => this.loadData()
      });
    }
  }

  openCurriculumBuilder(course: Course) {
    this.activeCurriculumCourse.set(course);
    this.loadCurriculumDetails(course.id);
  }

  loadCurriculumDetails(courseId: string) {
    this.teacherService.getTeacherCourseDetails(courseId).subscribe({
      next: (detail) => this.curriculumDetail.set(detail)
    });
  }

  addModule() {
    const c = this.activeCurriculumCourse();
    if (!c || !this.newModuleTitle) return;

    this.teacherService.addModule(c.id, this.newModuleTitle).subscribe({
      next: () => {
        this.newModuleTitle = '';
        this.loadCurriculumDetails(c.id);
      }
    });
  }

  deleteModule(moduleId: string) {
    if (confirm('Delete module and all contained lessons?')) {
      this.teacherService.deleteModule(moduleId).subscribe({
        next: () => {
          const c = this.activeCurriculumCourse();
          if (c) this.loadCurriculumDetails(c.id);
        }
      });
    }
  }

  openAddLessonModal(moduleId: string) {
    this.targetModuleId = moduleId;
    this.lessonForm = {
      title: '',
      contentType: 1,
      durationMinutes: 30,
      videoUrl: '',
      contentText: ''
    };
    this.showLessonModal.set(true);
  }

  saveLesson() {
    if (!this.targetModuleId) return;
    this.teacherService.addLesson(this.targetModuleId, this.lessonForm).subscribe({
      next: () => {
        this.showLessonModal.set(false);
        const c = this.activeCurriculumCourse();
        if (c) this.loadCurriculumDetails(c.id);
      }
    });
  }

  deleteLesson(lessonId: string) {
    if (confirm('Remove this lesson?')) {
      this.teacherService.deleteLesson(lessonId).subscribe({
        next: () => {
          const c = this.activeCurriculumCourse();
          if (c) this.loadCurriculumDetails(c.id);
        }
      });
    }
  }

  openAddQuizQuestion(lessonId: string) {
    this.targetLessonId = lessonId;
    this.quizForm = {
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOptionIndex: 0,
      points: 2,
      explanation: ''
    };
    this.showQuizModal.set(true);
  }

  saveQuizQuestion() {
    if (!this.targetLessonId) return;
    this.teacherService.addQuizQuestion(this.targetLessonId, this.quizForm).subscribe({
      next: () => {
        this.showQuizModal.set(false);
        const c = this.activeCurriculumCourse();
        if (c) this.loadCurriculumDetails(c.id);
      }
    });
  }

  onModalBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showCourseModal.set(false);
    }
  }

  onCurriculumBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.activeCurriculumCourse.set(null);
    }
  }
}
