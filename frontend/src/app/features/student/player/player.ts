import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseDetail, Lesson, QuizResult } from '../../../core/models/models';
import { CourseService } from '../../../core/services/course.service';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-classroom-player',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="classroom-layout">
      <!-- Left Sidebar: Curriculum Navigator -->
      <aside class="curriculum-sidebar">
        <div class="sidebar-header">
          <a routerLink="/student/my-courses" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            My Classroom
          </a>
          <h3 class="sidebar-course-title">{{ course()?.title }}</h3>
          <div class="validity-indicator mono-num" *ngIf="course()?.daysRemaining !== null">
            <span class="pulse-dot"></span>
            {{ course()?.daysRemaining }} Days Access Left
          </div>
        </div>

        <div class="modules-accordion">
          @for (mod of course()?.modules; track mod.id) {
            <div class="module-group">
              <div class="module-group-title">
                <span class="mod-num">Module {{ mod.orderIndex }}</span>
                <h4>{{ mod.title }}</h4>
              </div>

              <div class="module-lessons">
                @for (les of mod.lessons; track les.id) {
                  <button
                    (click)="selectLesson(les)"
                    class="lesson-item-btn"
                    [class.active-lesson]="activeLesson()?.id === les.id"
                    [class.completed]="les.isCompleted">
                    <div class="lesson-btn-left">
                      <span class="status-circle" [class.is-done]="les.isCompleted">
                        <svg *ngIf="les.isCompleted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                      <span class="lesson-label">{{ les.title }}</span>
                    </div>

                    <div class="lesson-btn-right">
                      <span class="type-badge" [ngSwitch]="les.contentType">
                        <span *ngSwitchCase="1">Video</span>
                        <span *ngSwitchCase="2">Reading</span>
                        <span *ngSwitchCase="3">Quiz</span>
                        <span *ngSwitchCase="4">Task</span>
                      </span>
                    </div>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </aside>

      <!-- Main Stage Viewport -->
      <main class="player-stage">
        @if (loading()) {
          <div class="stage-loading">
            <div class="spinner"></div>
            <p>Loading classroom content...</p>
          </div>
        } @else if (!activeLesson()) {
          <div class="stage-empty card">
            <h3>Select a lesson from the curriculum menu to begin</h3>
          </div>
        } @else {
          <!-- Lesson Stage Header -->
          <div class="stage-top-bar">
            <div>
              <span class="badge badge-indigo" [ngSwitch]="activeLesson()?.contentType">
                <span *ngSwitchCase="1">Video Lecture</span>
                <span *ngSwitchCase="2">Reading & Notes</span>
                <span *ngSwitchCase="3">Assessment Quiz</span>
                <span *ngSwitchCase="4">Homework Assignment</span>
              </span>
              <h2 class="stage-lesson-title">{{ activeLesson()?.title }}</h2>
            </div>

            <button
              (click)="toggleLessonCompletion()"
              class="btn"
              [class.btn-emerald]="activeLesson()?.isCompleted"
              [class.btn-outline]="!activeLesson()?.isCompleted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{{ activeLesson()?.isCompleted ? 'Completed' : 'Mark as Complete' }}</span>
            </button>
          </div>

          <!-- Video Player Display -->
          @if (activeLesson()?.contentType === 1) {
            <div class="video-container card">
              @if (safeVideoUrl()) {
                <iframe
                  [src]="safeVideoUrl()!"
                  class="video-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen>
                </iframe>
              } @else {
                <div class="no-video">
                  <p>Video lecture will be streamed here</p>
                </div>
              }
            </div>
          }

          <!-- Text Lecture Notes -->
          @if (activeLesson()?.contentText) {
            <div class="lesson-content-card card">
              <h4 class="notes-heading">Lecture Notes & Key Concepts</h4>
              <p class="notes-body">{{ activeLesson()?.contentText }}</p>
            </div>
          }

          <!-- Downloadable Accounting Materials (Excel / PDF) -->
          @if (activeLesson()?.attachmentUrl) {
            <div class="attachment-card card">
              <div class="att-info">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                <div>
                  <h4>{{ activeLesson()?.attachmentFileName || 'Accounting Study Material / Excel Sheet' }}</h4>
                  <span class="text-muted">Instructor Downloadable Resource</span>
                </div>
              </div>
              <a [href]="activeLesson()?.attachmentUrl" target="_blank" download class="btn btn-outline btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download File
              </a>
            </div>
          }

          <!-- Auto-Graded Quiz Widget -->
          @if (activeLesson()?.contentType === 3) {
            <div class="quiz-container card">
              <div class="quiz-header">
                <h3>Accounting Assessment Quiz</h3>
                <p class="text-secondary">Answer all multiple-choice questions. Score 60% or higher to automatically pass and complete this lesson.</p>
              </div>

              <!-- Questions List -->
              @if (!quizResult()) {
                <form (ngSubmit)="submitQuiz()" class="quiz-form">
                  @for (q of activeLesson()?.quizQuestions; track q.id; let idx = $index) {
                    <div class="quiz-question-card">
                      <div class="q-number">Question {{ idx + 1 }} ({{ q.points }} Points)</div>
                      <p class="q-text">{{ q.questionText }}</p>

                      <div class="q-options">
                        <label class="option-label" [class.selected]="quizAnswers[q.id] === 0">
                          <input type="radio" [name]="'q_' + q.id" [value]="0" [(ngModel)]="quizAnswers[q.id]" />
                          <span>A. {{ q.optionA }}</span>
                        </label>
                        <label class="option-label" [class.selected]="quizAnswers[q.id] === 1">
                          <input type="radio" [name]="'q_' + q.id" [value]="1" [(ngModel)]="quizAnswers[q.id]" />
                          <span>B. {{ q.optionB }}</span>
                        </label>
                        <label class="option-label" [class.selected]="quizAnswers[q.id] === 2">
                          <input type="radio" [name]="'q_' + q.id" [value]="2" [(ngModel)]="quizAnswers[q.id]" />
                          <span>C. {{ q.optionC }}</span>
                        </label>
                        <label class="option-label" [class.selected]="quizAnswers[q.id] === 3">
                          <input type="radio" [name]="'q_' + q.id" [value]="3" [(ngModel)]="quizAnswers[q.id]" />
                          <span>D. {{ q.optionD }}</span>
                        </label>
                      </div>
                    </div>
                  }

                  <button type="submit" [disabled]="submittingQuiz()" class="btn btn-emerald btn-lg">
                    <span>Submit Quiz for Grading</span>
                  </button>
                </form>
              } @else {
                <!-- Quiz Result Review -->
                <div class="quiz-result-box" [class.passed]="quizResult()?.passed">
                  <div class="score-circle">
                    <span class="score-num mono-num">{{ quizResult()?.percentage }}%</span>
                    <span class="score-status">{{ quizResult()?.passed ? 'PASSED' : 'TRY AGAIN' }}</span>
                  </div>
                  <h4>You scored {{ quizResult()?.score }} out of {{ quizResult()?.totalPoints }} points</h4>

                  <div class="reviews-list">
                    @for (rev of quizResult()?.questionReviews; track rev.questionId) {
                      <div class="review-item" [class.review-correct]="rev.isCorrect" [class.review-wrong]="!rev.isCorrect">
                        <div class="review-status">
                          {{ rev.isCorrect ? 'Correct (+)' : 'Incorrect (-)' }}
                        </div>
                        <p class="review-question">{{ rev.questionText }}</p>
                        <p class="review-explanation" *ngIf="rev.explanation">
                          <strong>Accounting Explanation:</strong> {{ rev.explanation }}
                        </p>
                      </div>
                    }
                  </div>

                  <button (click)="retakeQuiz()" class="btn btn-secondary">
                    Retake Quiz
                  </button>
                </div>
              }
            </div>
          }

          <!-- Assignment Homework Component -->
          @if (activeLesson()?.contentType === 4 && activeLesson()?.assignment) {
            <div class="assignment-container card">
              <div class="assignment-header">
                <div>
                  <span class="badge badge-amber">Homework Assignment</span>
                  <h3>{{ activeLesson()?.assignment?.title }}</h3>
                </div>
                <div class="max-points-pill mono-num">
                  Max Points: {{ activeLesson()?.assignment?.maxPoints }}
                </div>
              </div>

              <div class="instructions-box">
                <h4>Instructions</h4>
                <p>{{ activeLesson()?.assignment?.instructions }}</p>
              </div>

              <!-- Template download -->
              <div class="template-box" *ngIf="activeLesson()?.assignment?.templateFileUrl">
                <span>Starter Workbook Template:</span>
                <a [href]="activeLesson()?.assignment?.templateFileUrl" target="_blank" download class="btn btn-outline btn-sm">
                  Download Template
                </a>
              </div>

              <!-- Submission status / form -->
              @if (activeLesson()?.assignment?.mySubmission) {
                <div class="submission-status-card">
                  <div class="sub-status-header">
                    <h4>Your Submission</h4>
                    <span class="badge" [class.badge-emerald]="activeLesson()?.assignment?.mySubmission?.status === 2" [class.badge-indigo]="activeLesson()?.assignment?.mySubmission?.status === 1">
                      {{ activeLesson()?.assignment?.mySubmission?.status === 2 ? 'Graded' : 'Under Teacher Review' }}
                    </span>
                  </div>

                  <div class="sub-details">
                    <p>Submitted File: <a [href]="activeLesson()?.assignment?.mySubmission?.submittedFileUrl" target="_blank">{{ activeLesson()?.assignment?.mySubmission?.originalFileName }}</a></p>
                    <p class="text-muted">Submitted on {{ activeLesson()?.assignment?.mySubmission?.submittedAt | date:'medium' }}</p>

                    @if (activeLesson()?.assignment?.mySubmission?.status === 2) {
                      <div class="graded-box">
                        <div class="grade-score mono-num">
                          Score: {{ activeLesson()?.assignment?.mySubmission?.score }} / {{ activeLesson()?.assignment?.mySubmission?.maxPoints }}
                        </div>
                        <p *ngIf="activeLesson()?.assignment?.mySubmission?.teacherFeedback" class="grade-feedback">
                          <strong>Instructor Feedback:</strong> {{ activeLesson()?.assignment?.mySubmission?.teacherFeedback }}
                        </p>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <!-- Upload form -->
                <form (ngSubmit)="submitAssignment()" class="assignment-submit-form">
                  <h4>Submit Solution File (Excel / PDF)</h4>
                  <div class="form-group">
                    <input type="file" (change)="onAssignmentFileSelected($event)" accept=".xlsx,.xls,.pdf,.csv" class="form-control" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Notes for Instructor (optional)</label>
                    <textarea [(ngModel)]="assignmentNotes" name="asNotes" class="form-control" rows="2" placeholder="Describe key formulas or assumptions used..."></textarea>
                  </div>
                  <button type="submit" [disabled]="submittingAssignment() || !assignmentFile" class="btn btn-emerald btn-lg">
                    {{ submittingAssignment() ? 'Uploading Submission...' : 'Submit Assignment to Teacher' }}
                  </button>
                </form>
              }
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [`
    .classroom-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      min-height: calc(100vh - 72px);
    }

    @media (max-width: 900px) {
      .classroom-layout {
        grid-template-columns: 1fr;
      }
    }

    .curriculum-sidebar {
      background: #ffffff;
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      height: calc(100vh - 72px);
      position: sticky;
      top: 72px;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      background: #f8fafc;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .sidebar-course-title {
      font-size: 1.05rem;
      margin-bottom: 0.5rem;
      line-height: 1.35;
      color: var(--text-primary);
    }

    .validity-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #065f46;
      background: #ecfdf5;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-full);
      border: 1px solid #a7f3d0;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      background: #059669;
      border-radius: 50%;
    }

    .modules-accordion {
      padding: 0.75rem 0;
    }

    .module-group {
      margin-bottom: 1rem;
    }

    .module-group-title {
      padding: 0.5rem 1.25rem;
    }

    .mod-num {
      font-size: 0.7rem;
      font-weight: 700;
      color: #4f46e5;
      text-transform: uppercase;
    }

    .module-group-title h4 {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .lesson-item-btn {
      width: 100%;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      background: transparent;
      border: none;
      border-left: 3px solid transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition);
      font-size: 0.875rem;
    }

    .lesson-item-btn:hover {
      background: #f8fafc;
      color: var(--text-primary);
    }

    .lesson-item-btn.active-lesson {
      background: #eef2ff;
      border-left-color: #4f46e5;
      color: #4f46e5;
      font-weight: 700;
    }

    .lesson-btn-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      max-width: 220px;
    }

    .status-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #ffffff;
    }

    .status-circle.is-done {
      background: #059669;
      border-color: #059669;
      color: #ffffff;
    }

    .lesson-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .type-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      background: #f1f5f9;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
    }

    .player-stage {
      padding: 2.5rem 3rem 5rem;
      max-width: 1000px;
    }

    .stage-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .stage-lesson-title {
      margin-top: 0.4rem;
      font-size: 1.85rem;
      color: var(--text-primary);
    }

    .video-container {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      margin-bottom: 2rem;
      border-radius: var(--radius-lg);
      background: #000000;
      padding-top: 0;
      padding-left: 0;
      padding-right: 0;
      box-shadow: var(--shadow-md);
    }

    .video-iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }

    .lesson-content-card, .attachment-card, .quiz-container, .assignment-container {
      margin-bottom: 2rem;
      background: #ffffff;
    }

    .notes-heading {
      margin-bottom: 0.75rem;
      color: #4f46e5;
    }

    .notes-body {
      font-size: 1rem;
      line-height: 1.7;
      color: var(--text-secondary);
    }

    .attachment-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f0f9ff;
      border-color: #bae6fd;
    }

    .att-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .quiz-question-card {
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .q-number {
      font-size: 0.8rem;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 0.4rem;
      text-transform: uppercase;
    }

    .q-text {
      font-size: 1.05rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }

    .q-options {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .option-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
      background: #ffffff;
      color: var(--text-primary);
    }

    .option-label:hover, .option-label.selected {
      border-color: #4f46e5;
      background: #eef2ff;
    }

    .quiz-result-box {
      text-align: center;
      padding: 2rem 0;
    }

    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: #ecfdf5;
      border: 3px solid #10b981;
      margin: 0 auto 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .score-num {
      font-size: 1.75rem;
      font-weight: 800;
      color: #059669;
    }

    .score-status {
      font-size: 0.65rem;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.05em;
    }

    .reviews-list {
      margin: 2rem 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      text-align: left;
    }

    .review-item {
      padding: 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }

    .review-correct {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }

    .review-wrong {
      background: #fff1f2;
      border-color: #fecdd3;
      color: #9f1239;
    }

    .review-status {
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 0.3rem;
      text-transform: uppercase;
    }

    .review-explanation {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding-top: 0.5rem;
    }

    .assignment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .max-points-pill {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
    }

    .instructions-box {
      margin-bottom: 1.5rem;
    }

    .instructions-box h4 {
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
    }

    .template-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #f8fafc;
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-subtle);
    }

    .submission-status-card {
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.5rem;
    }

    .sub-status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .graded-box {
      margin-top: 1.25rem;
      padding: 1rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: var(--radius-md);
    }

    .grade-score {
      font-size: 1.15rem;
      font-weight: 800;
      color: #059669;
      margin-bottom: 0.4rem;
    }

    .grade-feedback {
      font-size: 0.9rem;
      color: var(--text-primary);
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
export class ClassroomPlayerComponent {
  route = inject(ActivatedRoute);
  courseService = inject(CourseService);
  paymentService = inject(PaymentService);
  sanitizer = inject(DomSanitizer);

  course = signal<CourseDetail | null>(null);
  activeLesson = signal<Lesson | null>(null);
  loading = signal(true);

  // Quiz State
  quizAnswers: Record<string, number> = {};
  submittingQuiz = signal(false);
  quizResult = signal<QuizResult | null>(null);

  // Assignment State
  assignmentFile: File | null = null;
  assignmentNotes = '';
  submittingAssignment = signal(false);

  safeVideoUrl = computed<SafeResourceUrl | null>(() => {
    const rawUrl = this.activeLesson()?.videoUrl;
    if (!rawUrl) return null;

    // Convert youtube watch to embed
    let embedUrl = rawUrl;
    if (rawUrl.includes('youtube.com/watch?v=')) {
      const vidId = rawUrl.split('watch?v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    } else if (rawUrl.includes('youtu.be/')) {
      const vidId = rawUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCourse(id);
      }
    });
  }

  loadCourse(courseId: string) {
    this.loading.set(true);
    this.courseService.getCourseClassroom(courseId).subscribe({
      next: (detail) => {
        this.course.set(detail);
        this.loading.set(false);

        // Select first lesson by default
        const firstMod = detail.modules?.[0];
        const firstLes = firstMod?.lessons?.[0];
        if (firstLes) {
          this.selectLesson(firstLes);
        }
      },
      error: (err) => {
        console.error('Failed to load classroom', err);
        this.loading.set(false);
      }
    });
  }

  selectLesson(lesson: Lesson) {
    this.activeLesson.set(lesson);
    this.quizAnswers = {};
    this.quizResult.set(null);
    this.assignmentFile = null;
    this.assignmentNotes = '';
  }

  toggleLessonCompletion() {
    const cur = this.activeLesson();
    if (!cur) return;

    this.courseService.markLessonComplete(cur.id).subscribe({
      next: () => {
        cur.isCompleted = true;
        this.activeLesson.set({ ...cur });
      }
    });
  }

  submitQuiz() {
    const les = this.activeLesson();
    if (!les) return;

    this.submittingQuiz.set(true);
    this.courseService.submitQuiz({
      lessonId: les.id,
      answers: this.quizAnswers
    }).subscribe({
      next: (res) => {
        this.submittingQuiz.set(false);
        this.quizResult.set(res);
        if (res.passed) {
          les.isCompleted = true;
          this.activeLesson.set({ ...les });
        }
      },
      error: (err) => {
        this.submittingQuiz.set(false);
        alert(err.error?.message || 'Quiz submission failed.');
      }
    });
  }

  retakeQuiz() {
    this.quizAnswers = {};
    this.quizResult.set(null);
  }

  onAssignmentFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.assignmentFile = file;
    }
  }

  submitAssignment() {
    const les = this.activeLesson();
    if (!les?.assignment || !this.assignmentFile) return;

    this.submittingAssignment.set(true);
    // 1. Upload file
    this.paymentService.uploadFile(this.assignmentFile, 'submissions').subscribe({
      next: (uploadRes) => {
        // 2. Submit assignment
        this.courseService.submitAssignment(les.assignment!.id, {
          fileUrl: uploadRes.fileUrl,
          originalFileName: uploadRes.originalName,
          notes: this.assignmentNotes
        }).subscribe({
          next: (sub) => {
            this.submittingAssignment.set(false);
            les.assignment!.mySubmission = sub;
            les.isCompleted = true;
            this.activeLesson.set({ ...les });
          },
          error: (err) => {
            this.submittingAssignment.set(false);
            alert(err.error?.message || 'Assignment submission failed.');
          }
        });
      },
      error: (err) => {
        this.submittingAssignment.set(false);
        alert('File upload failed: ' + (err.error?.message || 'Network error'));
      }
    });
  }
}
