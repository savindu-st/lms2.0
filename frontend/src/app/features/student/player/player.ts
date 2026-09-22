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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            My Classroom
          </a>
          <h3 class="sidebar-course-title">{{ course()?.title }}</h3>
          <div class="validity-indicator mono-num" *ngIf="course()?.daysRemaining !== null">
            <span class="status-dot"></span>
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
                        <svg *ngIf="les.isCompleted" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                      <span class="lesson-label">{{ les.title }}</span>
                    </div>

                    <div class="lesson-btn-right">
                      <span class="type-badge" [ngSwitch]="les.contentType">
                        <span *ngSwitchCase="1">Video</span>
                        <span *ngSwitchCase="2">Read</span>
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            <h3>Select a lesson from the curriculum menu to begin</h3>
          </div>
        } @else {
          <!-- Lesson Stage Header -->
          <div class="stage-top-bar">
            <div>
              <span class="badge badge-zinc" [ngSwitch]="activeLesson()?.contentType" style="margin-bottom: 0.5rem;">
                <span *ngSwitchCase="1">Video Lecture</span>
                <span *ngSwitchCase="2">Reading & Notes</span>
                <span *ngSwitchCase="3">Assessment Quiz</span>
                <span *ngSwitchCase="4">Homework Assignment</span>
              </span>
              <h2 class="stage-lesson-title">{{ activeLesson()?.title }}</h2>
            </div>

            <button
              (click)="toggleLessonCompletion()"
              class="btn btn-sm"
              [class.btn-emerald]="activeLesson()?.isCompleted"
              [class.btn-outline]="!activeLesson()?.isCompleted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-cyan"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                <div>
                  <h4>{{ activeLesson()?.attachmentFileName || 'Accounting Study Material / Excel Sheet' }}</h4>
                  <span class="text-muted" style="font-size: 0.75rem;">Downloadable Course Companion Resource</span>
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
                <p class="text-secondary">Answer all questions accurately. Score 60% or higher to automatically pass and complete this lesson module.</p>
              </div>

              <!-- Questions List -->
              @if (!quizResult()) {
                <form (ngSubmit)="submitQuiz()" class="quiz-form">
                  @for (q of activeLesson()?.quizQuestions; track q.id; let idx = $index) {
                    <div class="quiz-question-card">
                      <div class="q-number">Question {{ idx + 1 }} &bull; {{ q.points }} Points</div>
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
                    <span class="score-status">{{ quizResult()?.passed ? 'PASSED' : 'RETRY' }}</span>
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

                  <button (click)="retakeQuiz()" class="btn btn-outline btn-sm">
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
                  <div class="badge badge-amber" style="margin-bottom: 0.35rem;">Practical Homework Task</div>
                  <h3>{{ activeLesson()?.assignment?.title }}</h3>
                </div>
                <div class="max-points-pill mono-num">
                  Max: {{ activeLesson()?.assignment?.maxPoints }} Pts
                </div>
              </div>

              <div class="instructions-box">
                <h4>Assignment Brief</h4>
                <p>{{ activeLesson()?.assignment?.instructions }}</p>
              </div>

              <!-- Template download -->
              <div class="template-box" *ngIf="activeLesson()?.assignment?.templateFileUrl">
                <span class="text-secondary font-medium">Starter Workbook Template:</span>
                <a [href]="activeLesson()?.assignment?.templateFileUrl" target="_blank" download class="btn btn-outline btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download Workbook
                </a>
              </div>

              <!-- Submission status / form -->
              @if (activeLesson()?.assignment?.mySubmission) {
                <div class="submission-status-card">
                  <div class="sub-status-header">
                    <h4>Your Submission</h4>
                    <span class="badge" [class.badge-emerald]="activeLesson()?.assignment?.mySubmission?.status === 2" [class.badge-zinc]="activeLesson()?.assignment?.mySubmission?.status === 1">
                      {{ activeLesson()?.assignment?.mySubmission?.status === 2 ? 'Graded' : 'Under Teacher Review' }}
                    </span>
                  </div>

                  <div class="sub-details">
                    <p class="font-medium">File: <a [href]="activeLesson()?.assignment?.mySubmission?.submittedFileUrl" target="_blank" class="sub-file-link">{{ activeLesson()?.assignment?.mySubmission?.originalFileName }}</a></p>
                    <p class="text-muted" style="font-size: 0.75rem; margin-top: 0.25rem;">Uploaded on {{ activeLesson()?.assignment?.mySubmission?.submittedAt | date:'medium' }}</p>

                    @if (activeLesson()?.assignment?.mySubmission?.status === 2) {
                      <div class="graded-box">
                        <div class="grade-score mono-num">
                          Score: {{ activeLesson()?.assignment?.mySubmission?.score }} / {{ activeLesson()?.assignment?.mySubmission?.maxPoints }} Points
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
                  <h4>Upload Your Solution File (Excel / PDF / CSV)</h4>
                  <div class="form-group" style="margin-top: 0.75rem;">
                    <input type="file" (change)="onAssignmentFileSelected($event)" accept=".xlsx,.xls,.pdf,.csv" class="form-control file-input" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Notes for Instructor (optional)</label>
                    <textarea [(ngModel)]="assignmentNotes" name="asNotes" class="form-control" rows="2" placeholder="Detail any assumptions, model formulas, or footnotes..."></textarea>
                  </div>
                  <button type="submit" [disabled]="submittingAssignment() || !assignmentFile" class="btn btn-emerald btn-lg">
                    {{ submittingAssignment() ? 'Uploading Submission...' : 'Submit Solution to Instructor' }}
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
      grid-template-columns: 320px 1fr;
      min-height: calc(100vh - 64px);
      background: var(--bg-main);
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
      height: calc(100vh - 64px);
      position: sticky;
      top: 64px;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-card);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .back-link:hover {
      color: var(--text-primary);
    }

    .sidebar-course-title {
      font-size: 0.9375rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      line-height: 1.35;
      color: var(--text-primary);
    }

    .validity-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--emerald);
      background: var(--emerald-light);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--emerald-border);
    }

    .status-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
    }

    .modules-accordion {
      padding: 0.5rem 0;
    }

    .module-group {
      margin-bottom: 0.75rem;
    }

    .module-group-title {
      padding: 0.4rem 1rem;
    }

    .mod-num {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .module-group-title h4 {
      font-size: 0.8125rem;
      color: var(--text-primary);
      font-weight: 600;
      line-height: 1.3;
    }

    .lesson-item-btn {
      width: 100%;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 1rem;
      background: transparent;
      border: none;
      border-left: 2px solid transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition);
      font-size: 0.8125rem;
      font-family: var(--font-sans);
    }

    .lesson-item-btn:hover {
      background: var(--bg-subtle);
      color: var(--text-primary);
    }

    .lesson-item-btn.active-lesson {
      background: var(--bg-subtle);
      border-left-color: var(--primary);
      color: var(--text-primary);
      font-weight: 600;
    }

    .lesson-btn-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-width: 200px;
    }

    .status-circle {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid var(--border-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #ffffff;
    }

    .status-circle.is-done {
      background: var(--emerald);
      border-color: var(--emerald);
      color: #ffffff;
    }

    .lesson-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .type-badge {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      background: var(--bg-subtle);
      padding: 0.15rem 0.35rem;
      border-radius: var(--radius-xs);
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
    }

    .player-stage {
      padding: 2.25rem 2.5rem 5rem;
      max-width: 920px;
    }

    .stage-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.75rem;
      gap: 1rem;
    }

    .stage-lesson-title {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: var(--text-primary);
    }

    .video-container {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      margin-bottom: 1.75rem;
      border-radius: var(--radius-lg);
      background: #09090b;
      padding-top: 0;
      padding-left: 0;
      padding-right: 0;
      box-shadow: var(--shadow-sm);
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
      margin-bottom: 1.75rem;
      background: #ffffff;
    }

    .notes-heading {
      font-size: 0.9375rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .notes-body {
      font-size: 0.9375rem;
      line-height: 1.65;
      color: var(--text-secondary);
      white-space: pre-line;
    }

    .attachment-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border-color: var(--border-subtle);
    }

    .att-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .att-info h4 {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .quiz-question-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .q-number {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
      text-transform: uppercase;
    }

    .q-text {
      font-size: 0.9375rem;
      font-weight: 600;
      margin-bottom: 0.85rem;
      color: var(--text-primary);
    }

    .q-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .option-label {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
      background: #ffffff;
      color: var(--text-primary);
      font-size: 0.8125rem;
    }

    .option-label:hover, .option-label.selected {
      border-color: var(--border-focus);
      background: var(--bg-subtle);
    }

    .quiz-result-box {
      text-align: center;
      padding: 1.5rem 0;
    }

    .score-circle {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: var(--emerald-light);
      border: 2px solid var(--emerald-border);
      margin: 0 auto 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .score-num {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--emerald);
    }

    .score-status {
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--emerald);
      letter-spacing: 0.05em;
    }

    .reviews-list {
      margin: 1.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      text-align: left;
    }

    .review-item {
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }

    .review-correct {
      background: var(--emerald-light);
      border-color: var(--emerald-border);
      color: #065f46;
    }

    .review-wrong {
      background: var(--rose-light);
      border-color: var(--rose-border);
      color: #9f1239;
    }

    .review-status {
      font-size: 0.6875rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
    }

    .review-question {
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .review-explanation {
      margin-top: 0.4rem;
      font-size: 0.75rem;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding-top: 0.4rem;
    }

    .assignment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .max-points-pill {
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-sm);
    }

    .instructions-box {
      margin-bottom: 1.25rem;
    }

    .instructions-box h4 {
      font-size: 0.8125rem;
      margin-bottom: 0.35rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .instructions-box p {
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .template-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--bg-subtle);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
      border: 1px solid var(--border-subtle);
      font-size: 0.8125rem;
    }

    .submission-status-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.25rem;
    }

    .sub-status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .sub-file-link {
      color: var(--text-primary);
      text-decoration: underline;
      font-weight: 600;
    }

    .graded-box {
      margin-top: 1rem;
      padding: 0.85rem 1rem;
      background: var(--emerald-light);
      border: 1px solid var(--emerald-border);
      border-radius: var(--radius-md);
    }

    .grade-score {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--emerald);
      margin-bottom: 0.25rem;
    }

    .grade-feedback {
      font-size: 0.8125rem;
      color: var(--text-primary);
    }

    .assignment-submit-form h4 {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .file-input {
      padding: 0.45rem;
      font-size: 0.8125rem;
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
    this.paymentService.uploadFile(this.assignmentFile, 'submissions').subscribe({
      next: (uploadRes) => {
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
